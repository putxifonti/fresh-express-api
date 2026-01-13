const bcrypt = require('bcrypt');;
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// Crear pool de connexions a MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'api2',                    
  password: 'la_teva_contrasenya', 
  database: 'freshexpress_operacional',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar connexió
pool.getConnection()
  .then(conn => {
    console.log('✅ Connexió a MySQL establerta correctament');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error connectant a MySQL:', err);
  });

// ⭐ FUNCIÓ PRINCIPAL: Obtenir estadístiques d'un usuari
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validar que userId és un número
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'usuari invàlid'
      });
    }

    console.log(`📊 Obtenint estadístiques per l'usuari ${userId}...`);

    // Consulta 1: Total de comandes
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM pedidos WHERE cliente_id = ?',
      [userId]
    );
    const totalComandes = Number(totalResult[0]?.total) || 0;

    // Consulta 2: Total gastat (només comandes lliurades)
    const [gastatResult] = await pool.execute(
      'SELECT COALESCE(SUM(total), 0) as totalGastat FROM pedidos WHERE cliente_id = ? AND estado = "entregado"',
      [userId]
    );
    const totalGastat = Number(gastatResult[0]?.totalGastat) || 0;

    // Calcular punts (10 punts per cada euro gastat)
    const puntsAcumulats = Math.floor(totalGastat * 10);

    // Calcular impacte ecològic (0.5kg CO2 per comanda)
    const impacteEco = totalComandes * 0.5;

    // Retornar estadístiques
    return res.status(200).json({
      success: true,
      stats: {
        totalComandes,
        puntsAcumulats,
        impacteEco: parseFloat(impacteEco.toFixed(2)),
        totalGastat: parseFloat(totalGastat.toFixed(2))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obtenint estadístiques:', error);
    return res.status(500).json({
      success: false,
      error: 'Error intern del servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Health check de l'API
const healthCheck = async (req, res) => {
  try {
    // Provar connexió a la base de dades
    await pool.execute('SELECT 1');
    
    return res.status(200).json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
};

// Obtenir estadístiques globals (opcional)
const getGlobalStats = async (req, res) => {
  try {
    // Total usuaris
    const [usuarisResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM usuarios WHERE rol = "cliente"'
    );
    const totalUsuaris = Number(usuarisResult[0]?.total) || 0;

    // Total comandes
    const [comandesResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM pedidos'
    );
    const totalComandes = Number(comandesResult[0]?.total) || 0;

    // Total facturat
    const [facturatResult] = await pool.execute(
      'SELECT COALESCE(SUM(total), 0) as totalFacturat FROM pedidos WHERE estado = "entregado"'
    );
    const totalFacturat = Number(facturatResult[0]?.totalFacturat) || 0;

    return res.status(200).json({
      success: true,
      globalStats: {
        totalUsuaris,
        totalComandes,
        totalFacturat: parseFloat(totalFacturat.toFixed(2)),
        impacteEcoGlobal: parseFloat((totalComandes * 0.5).toFixed(2))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obtenint estadístiques globals:', error);
    return res.status(500).json({
      success: false,
      error: 'Error intern del servidor'
    });
  }
};

// Obtenir llista d'empreses disponibles
const getEmpresasDisponibles = async (req, res) => {
  try {
    console.log('🏢 Obtenint llista d\'empreses disponibles...');

    // ⭐ AQUESTA ÉS LA MATEIXA CONSULTA QUE productes.astro
    const [empresas] = await pool.execute(
      `SELECT 
        id,
        nombre,
        logo,
        descripcion,
        categoria,
        activo
      FROM empresas 
      WHERE activo = 1
      ORDER BY nombre ASC`
    );

    console.log(`✅ ${empresas.length} empreses trobades`);

    return res.status(200).json({
      success: true,
      empresas: empresas.map(emp => ({
        id: emp.id,
        nombre: emp.nombre,
        logoUrl: emp.logo || '',
        descripcion: emp.descripcion || '',
        categoria: emp.categoria || 'General',
        activo: emp.activo === 1
      })),
      total: empresas.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obtenint empreses:', error);
    return res.status(500).json({
      success: false,
      error: 'Error intern del servidor',
      message: error.message
    });
  }
};

// Exportar funcions
module.exports = {
  getUserStats,
  healthCheck,
  getGlobalStats,
  getEmpresasDisponibles
};