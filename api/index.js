import express from 'express';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import sql from '../db/db.js';
import { redirecionarSeAutenticado } from '../utils/redirecionarSeAutenticado.js';
import { authenticate } from '../middlewares/auth.js';

// dotenv.config();

const app = express();

app.use(cookieParser());

//*** ROTAS ***//

app.get('/', (req, res) => {
  res.send('<h1>Bem-vindo</h1>');
});

app.get('/login', redirecionarSeAutenticado, (req, res) => {
  res.send('<a href="/auth/google">Login with Google</a>');
});

app.get('/home', authenticate, (req, res) => {
  res.send("<h1>Dashboard</h1><p>Você está logado como:</p><p><button>Sair</button></p>");
});

app.get('/auth/google', (req, res) => {
  const redirect_uri = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

  res.redirect(redirect_uri);
});

app.get('/auth', (req, res) => {
  try {
    res.send("/auth");
  } catch (error) {
    return res.json({ error });
  }
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Código não recebido.");

  try {
    const { data } = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, id_token } = data;

    const userInfo = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const { id, name, email, picture } = userInfo.data;

    const result = await sql`SELECT * FROM usuarios WHERE google_id = ${id}`;
    if (result.length === 0) {
      await sql`
        INSERT INTO usuarios (google_id, nome, email, foto)
        VALUES (${id}, ${name}, ${email}, ${picture})
      `;
    }

    res.cookie("session", id_token, {
      httpOnly: true,
      secure: true,
    });

    res.redirect('/home');
  } catch (error) {
    console.error("Erro ao autenticar:", error.response?.data || error.message);
    res.status(500).send("Erro na autenticação com o Google");
  }
});

app.get('/user', authenticate, (req, res) => {
  const sessionCookie = req.cookies.session;
  if (!sessionCookie) {
    return res.send('Você não está logado. Vá até <a href="/">/</a>');
  }
  res.send(`Token salvo no cookie: ${sessionCookie}`);
});

app.get('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('/login');
});

export default app;