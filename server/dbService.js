const pool = require('./db');

async function getUsers() {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    
    return rows.map(user => ({
      id: user.id,
      name: user.full_name, 
      email: user.email,
      passwordHash: user.password,
      loginProvider: user.login_provider,
      providerId: user.provider_id,
      createdAt: user.created_at
    }));
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng từ DB:', error.message);
    throw error;
  }
}

/**
 * Tìm một người dùng theo Email (Dùng cho Login & Passport)
 */
async function getUserByEmail(email) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    
    const user = rows[0];
    return {
      id: user.id,
      name: user.full_name,
      email: user.email,
      passwordHash: user.password,
      loginProvider: user.login_provider,
      providerId: user.provider_id
    };
  } catch (error) {
    console.error('Lỗi khi tìm người dùng bằng email:', error.message);
    throw error;
  }
}
async function getUserById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      const user = rows[0];
      return {
        id: user.id,
        name: user.full_name,
        email: user.email,
        loginProvider: user.login_provider
      };
    } catch (error) {
      throw error;
    }
}
/**
 * Thêm người dùng mới (Hỗ trợ cả Local, Google, Facebook)
 */
async function addUser(user) {
  try {
    const sql = `
      INSERT INTO users (full_name, email, password, login_provider, provider_id) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const values = [
      user.name || user.full_name || '', 
      user.email || '', 
      user.passwordHash || user.password || null, 
      user.loginProvider || user.provider || 'local', 
      user.providerId || null
    ];

    const [result] = await pool.query(sql, values);
    
    return { 
      id: result.insertId, 
      ...user 
    };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Email đã được sử dụng.');
    }
    console.error('Lỗi khi thêm người dùng vào DB:', error.message);
    throw error;
  }
}

module.exports = {
  getUsers,
  getUserByEmail,
  getUserById,
  addUser
};