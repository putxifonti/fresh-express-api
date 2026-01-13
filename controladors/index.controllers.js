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

    // Consulta per obtenir empreses actives
    const [empresas] = await pool.execute(
      `SELECT 
        id,
        nombre,
        descripcion,
        logo_url,
        categoria,
        valoracion,
        entregas_completadas,
        activo,
        fecha_registro
      FROM empresas 
      WHERE activo = 1
      ORDER BY nombre ASC`
    );

    return res.status(200).json({
      success: true,
      empresas: empresas.map(emp => ({
        id: emp.id,
        nombre: emp.nombre,
        descripcion: emp.descripcion || '',
        logoUrl: emp.logo_url || '',
        categoria: emp.categoria || 'General',
        valoracion: Number(emp.valoracion) || 0,
        entregasCompletadas: Number(emp.entregas_completadas) || 0,
        activo: emp.activo === 1,
        fechaRegistro: emp.fecha_registro
      })),
      total: empresas.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obtenint empreses:', error);
    return res.status(500).json({
      success: false,
      error: 'Error intern del servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir detalls d'una empresa específica
const getEmpresaById = async (req, res) => {
  try {
    const { empresaId } = req.params;

    if (!empresaId || isNaN(empresaId)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'empresa invàlid'
      });
    }

    console.log(`🏢 Obtenint detalls de l'empresa ${empresaId}...`);

    const [empresa] = await pool.execute(
      `SELECT 
        id,
        nombre,
        descripcion,
        logo_url,
        categoria,
        valoracion,
        entregas_completadas,
        direccion,
        telefono,
        email,
        horario_apertura,
        horario_cierre,
        activo,
        fecha_registro
      FROM empresas 
      WHERE id = ?`,
      [empresaId]
    );

    if (empresa.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Empresa no trobada'
      });
    }

    const emp = empresa[0];

    return res.status(200).json({
      success: true,
      empresa: {
        id: emp.id,
        nombre: emp.nombre,
        descripcion: emp.descripcion || '',
        logoUrl: emp.logo_url || '',
        categoria: emp.categoria || 'General',
        valoracion: Number(emp.valoracion) || 0,
        entregasCompletadas: Number(emp.entregas_completadas) || 0,
        direccion: emp.direccion || '',
        telefono: emp.telefono || '',
        email: emp.email || '',
        horarioApertura: emp.horario_apertura || '',
        horarioCierre: emp.horario_cierre || '',
        activo: emp.activo === 1,
        fechaRegistro: emp.fecha_registro
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obtenint empresa:', error);
    return res.status(500).json({
      success: false,
      error: 'Error intern del servidor'
    });
  }
};

// Exportar funcions
module.exports = {
  getUserStats,
  healthCheck,
  getGlobalStats,
  getEmpresasDisponibles,
  getEmpresaById
};