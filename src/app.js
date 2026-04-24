const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'sistema_practicas_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 1000 * 60 * 60 }
}));

app.use('/public', express.static(path.join(__dirname, 'public')));

// Dashboard protegido
app.get('/dashboard', (req, res) => {
    if (!req.session.supervisor) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

// Redirigir raíz al login
app.get('/', (req, res) => res.redirect('/login'));

app.use('/', authRoutes);
app.use('/', estudianteRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});