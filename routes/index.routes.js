const { Router } = require('express');
const router = Router();
const { 
  getUserStats, 
  healthCheck, 
  getGlobalStats 
} = require('../controladors/index.controllers');

// ⭐ ORDRE IMPORTANT: Rutes específiques ABANS de rutes amb paràmetres
router.get('/health', healthCheck);
router.get('/stats/global', getGlobalStats);        // ⚠️ Aquesta ABANS
router.get('/stats/:userId', getUserStats);         // ⚠️ Aquesta DESPRÉS

module.exports = router;