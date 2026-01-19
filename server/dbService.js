const pool = require('./db');

/**
 * Ánh xạ dữ liệu từ DB sang Object JS (Helper function)
 */
const mapUser = (user) => ({
  id: user.id,
  name: user.full_name,
  email: user.email,
  phone: user.phone,          // Trường mới
  address: user.address,      // Trường mới
  gender: user.gender,        // Trường mới
  avatar: user.avatar_url,    // Trường mới: Ảnh đại diện
  passwordHash: user.password,
  loginProvider: user.login_provider,
  providerId: user.provider_id,
  createdAt: user.created_at
});

async function getUsers() {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows.map(mapUser);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng từ DB:', error.message);
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    return mapUser(rows[0]);
  } catch (error) {
    console.error('Lỗi khi tìm người dùng bằng email:', error.message);
    throw error;
  }
}

async function getUserById(id) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return mapUser(rows[0]);
  } catch (error) {
    console.error('Lỗi khi tìm người dùng bằng ID:', error.message);
    throw error;
  }
}

/**
 * Thêm người dùng mới (Hỗ trợ lưu Avatar từ Google/FB)
 */
async function addUser(user) {
  try {
    const sql = `
      INSERT INTO users (full_name, email, avatar_url, password, login_provider, provider_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      user.name || user.full_name || '', 
      user.email || '', 
      user.avatar_url || null,
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

async function updateUserProfile(id, data) {
  try {
    const sql = `
      UPDATE users 
      SET full_name = ?, phone = ?, address = ?, gender = ? , avatar_url = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [data.name, data.phone, data.address, data.gender, data.avatar_url, id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Lỗi khi cập nhật Profile trong DB:', error.message);
    throw error;
  }
}
async function updatePassword(id, newPasswordHash) {
  try {
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPasswordHash, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getUsers,
  getUserByEmail,
  getUserById,
  addUser,
  updateUserProfile,
  updatePassword
};