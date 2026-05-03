require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function encryptTable(db, tableName) {
  const [rows] = await db.execute(`SELECT id, contrasenia FROM ${tableName}`);

  for (const user of rows) {
    if (!user.contrasenia) continue;

    // Evitar re-encriptar
    if (user.contrasenia.startsWith('$2b$')) continue;

    const hash = await bcrypt.hash(user.contrasenia, 10);

    await db.execute(
      `UPDATE ${tableName} SET contrasenia = ? WHERE id = ?`,
      [hash, user.id]
    );
  }

  console.log(`✅ ${tableName} actualizado`);
}

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await encryptTable(db, 'estudiantes');
  await encryptTable(db, 'supervisores');

  console.log("🔥 TODAS las contraseñas encriptadas");
  await db.end();
}

run();