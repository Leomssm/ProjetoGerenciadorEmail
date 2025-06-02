import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import sql from '../db/db.js';
import { redirecionarSeAutenticado } from '../utils/redirecionarSeAutenticado.js';
import { authenticate } from '../middlewares/auth.js';

const app = express();
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(cookieParser());

//*** ROTAS ***//

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', redirecionarSeAutenticado, (req, res) => {
    res.render('login');
});

app.get('/home', authenticate, (req, res) => {
    res.render('home');
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

app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.send("Código não recebido.");
    }
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

        let userInfo;
        try {
            userInfo = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            console.log('userInfo:', userInfo.data);
        } catch (error) {
            console.error('Erro ao buscar userInfo:', error.response?.data || error.message || error);
            throw error;
        }

        const { sub, name, email, picture } = userInfo.data;

        let result;
        try {
            result = await sql`SELECT * FROM usuarios WHERE google_id = ${sub}`;
        } catch (error) {
            console.error("Erro na query SELECT:", error);
            return res.status(500).send("Erro no banco ao buscar usuário.");
        }

        if (result.length === 0) {
            try {
                await sql`
      INSERT INTO usuarios (google_id, nome, email, foto)
      VALUES (${sub}, ${name}, ${email}, ${picture})
    `;
            } catch (err) {
                console.error("Erro ao inserir usuário:", err);
                return res.status(500).send("Erro ao inserir usuário");
            }
        }

        res.cookie("session", id_token, {
            httpOnly: true,
            secure: true,
        });

        res.redirect('/home');
    } catch (error) {
        console.error("Erro ao autenticar:", error?.response?.data || error.message || error);
        res.status(500).send("Erro na autenticação com o Google");
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('session');
    res.redirect('/login');
});

export default app;