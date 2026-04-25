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
// RUTA TEMPORAL — borrar después
app.get('/fix-correo', (req, res) => {
  const db = require('./config/db');
  db.query(
    "UPDATE supervisores SET correo = 'apazajherson8@gmail.com' WHERE correo = 'jherson8@gmail.com'",
    (err, result) => {
      if (err) return res.json({ error: err.message });
      res.json({ ok: true, filas_actualizadas: result.affectedRows });
    }
  );
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});