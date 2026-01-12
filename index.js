const express = require('express');
const app = express();
const cors = require('cors');

// Middlewares
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:4321', 'http://localhost:3000', '*'], // Afegit * per acceptar totes les origins
  credentials: true
}));

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

// Gestió d'errors globals
app.use((err, req, res, next) => {
  console.error('❌ Error no capturat:', err);
  res.status(500).json({
    success: false,
    error: 'Error intern del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor HTTP
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║   🌱 API FreshExpress en execució     ║
║                                        ║
║   🌐 URL: http://0.0.0.0:${PORT}         ║
║   📊 Health: /health                   ║
║   👤 Stats: /stats/:userId             ║
║   🌍 Global: /stats/global             ║
╚════════════════════════════════════════╝
  `);
});

// Gestió de tancament correcte
process.on('SIGTERM', () => {
  console.log('🛑 Tancant servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Tancant servidor...');
  process.exit(0);
});