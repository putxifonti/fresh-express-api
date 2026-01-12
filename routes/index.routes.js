const { Router } = require('express');
const router = Router();
const { 
  getUserStats, 
  healthCheck, 
  getGlobalStats 
} = require('../controladors/index.controllers');

// ⭐ NOVES RUTES PER FRESHEXPRESS
router.get('/health', healthCheck);
router.get('/stats/:userId', getUserStats);
router.get('/stats/global', getGlobalStats);

// Rutes antigues (comentades)
// router.get('/obtenirfotospubliques', obtenirFotosPubliques);
// router.post('/alta', inserirUsuari);

module.exports = router;