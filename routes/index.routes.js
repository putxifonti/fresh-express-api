const { Router } = require('express');
const router = Router();
const { 
  getUserStats, 
  healthCheck, 
  getGlobalStats,
  getEmpresasDisponibles
} = require('../controladors/index.controllers');

// Health check
router.get('/health', healthCheck);

// Estadístiques
router.get('/stats/global', getGlobalStats);
router.get('/stats/:userId', getUserStats);
router.get('/empresas', getEmpresasDisponibles);

module.exports = router;