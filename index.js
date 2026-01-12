const express = require('express');
const app = express();
const cors = require('cors');
const { expressjwt: jwt } = require("express-jwt");
const fs = require('fs');
const https = require('https');

// Middlewares
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:4321', 'http://localhost:3000'],
  credentials: true
}));

// ⚠️ JWT opcional per aquestes rutes (sense autenticació per simplicitat)
// Si vols JWT, descomenta això:
/*
app.use(jwt({
  secret: "Torello2",
  algorithms: ['HS256']
}).unless({
  path: [
    '/health',
    '/stats/:userId',
    '/stats/global'
  ]
}));
*/

// Logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutes
app.use(require('./routes/index.routes'));

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: '🌱 API FreshExpress - Estadístiques',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      userStats: 'GET /stats/:userId',
      globalStats: 'GET /stats/global'
    }
  });
});

// Gestió d'errors 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no trobat',
    path: req.path
  });
});

// Opcions HTTPS (si vols utilitzar-les)
const httpsOptionDev = {
  key: fs.readFileSync("C:\\Users\\Tomàs\\Desktop\\42I-Digitalització\\EX2\\cert\\server.key"),
  cert: fs.readFileSync("C:\\Users\\Tomàs\\Desktop\\42I-Digitalització\\EX2\\cert\\server-crt"),
  requestCert: true,
  rejectUnauthorized: false
};

// ⚠️ Canvia a HTTP normal per facilitar proves
// HTTPS:
// https.createServer(httpsOptionDev, app).listen(3000, () => {
//   console.log('🔒 Servidor HTTPS escoltant en el port:', 3000);
// });

// HTTP (més senzill per proves):
app.listen(3000, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🌱 API FreshExpress en execució     ║
║                                        ║
║   🌐 URL: http://localhost:3000       ║
║   📊 Health: /health                   ║
║   👤 Stats: /stats/:userId             ║
╚════════════════════════════════════════╝
  `);
});