const express = require('express');
const app = express();

function authenticate(req, res, next) {
  const loggedIn = req.headers.cookie?.includes('auth=true');
  if (loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}

function redirecionarSeAutenticado(req, res, next) {
  const loggedIn = req.headers.cookie?.includes('auth=true');
  if (loggedIn) {
    return res.redirect('/home');
  }
  next();
}

// Rotas
app.get('/', (req, res) => {
  res.send('<h1>Bem-vindo</h1>');
});

app.get('/login', redirecionarSeAutenticado, (req, res) => {
  res.send(`
    <a href="/auth/google">Login with Google</a>
    <script>
      document.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        document.cookie = "auth=true; path=/";
        window.location.href = "/home";
      });
    </script>
  `);
});

app.get('/home', authenticate, (req, res) => {
  res.send(`
    <h1>Dashboard</h1>
    <p>Você está logado como:</p>
    <p><button onclick="logout()">Sair</button></p>
    <script>
      function logout() {
        document.cookie = "auth=; Max-Age=0; path=/";
        window.location.href = "/";
      }
    </script>
  `);
});

module.exports = app;