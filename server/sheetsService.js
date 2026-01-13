const { google } = require('googleapis');
const path = require('path');
const pool = require('./db');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'), // file JSON tải từ Google Cloud
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const spreadsheetId = '1Tuevg7REmIde0y6XbJ5gBRIkOjX1cjJbsubwfyrKpUU'; // ID Google Sheet

async function getUsers() {
  try {
    // Truy vấn tất cả người dùng từ bảng users
    const [rows] = await pool.query('SELECT * FROM users');
    
    // Map lại dữ liệu để khớp với định dạng bạn đang dùng ở Frontend
    return rows.map(user => ({
      id: user.id,
      name: user.full_name, // Chú ý đổi r[1] thành full_name theo đúng cột trong DB
      email: user.email,
      passwordHash: user.password,
      loginProvider: user.login_provider,
      createdAt: user.created_at
    }));
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng từ DB:', error.message);
    throw error;
  }
}

async function addUser(user) {
  try {
    const sql = `
      INSERT INTO users (full_name, email, password, login_provider, provider_id) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    // Các giá trị tương ứng với dấu ?
    const values = [
      user.name || '', 
      user.email || '', 
      user.passwordHash || null, // Password có thể null nếu dùng Google/FB
      user.loginProvider || 'local', 
      user.providerId || null
    ];

    const [result] = await pool.query(sql, values);
    
    // Trả về thông tin ID vừa tạo để Frontend biết
    return { id: result.insertId, ...user };
  } catch (error) {
    // Xử lý lỗi trùng Email (do cột email là UNIQUE)
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('Email này đã tồn tại!');
      throw new Error('Email đã được sử dụng.');
    }
    console.error('Lỗi khi thêm người dùng vào DB:', error.message);
    throw error;
  }
}

// ===== FLIGHTS =====
async function getFlights() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: ['Flights!A2:W'],          // đọc đủ 23 cột
  });
  const rows = res.data.valueRanges[0].values || [];

  return rows.map(r => ({
    id: r[0],
    originAirportCode: r[1],
    destinationAirportCode: r[2],
    departureDate: r[3],
    departureDateTime: r[4],
    arrivalDateTime: r[5],
    tripDuration: r[6] ? Number(r[6]) : null,
    flightDuration: r[7] ? Number(r[7]) : null,
    passengers: r[8] ? Number(r[8]) : null,
    cabinClass: r[9],
    fareClass: r[10],
    fareFamilyName: r[11],
    priceSGD: r[12] ? Number(r[12]) : null,
    priceVND: r[13] ? Number(r[13]) : null,
    currency: r[14],
    flightNumber: r[15],
    aircraft: { name: r[16], code: r[17] },
    operatingAirline: { name: r[18], code: r[19] },
    marketingAirline: { name: r[20], code: r[21] },
    airline: r[22]
  }));
}

async function saveFlightsToSheet(flights) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const values = flights.map(f => [
    f.id || '',                     // A
    f.originAirportCode || '',      // B
    f.destinationAirportCode || '', // C
    f.departureDate || '',          // D
    f.departureDateTime || '',      // E
    f.arrivalDateTime || '',        // F
    f.tripDuration || '',           // G
    f.flightDuration || '',         // H
    f.passengers || '',             // I
    f.cabinClass || '',             // J
    f.fareClass || '',              // K
    f.fareFamilyName || '',         // L
    f.priceSGD || '',               // M
    f.priceVND || '',               // N
    f.currency || '',               // O
    f.flightNumber || '',           // P
    f.aircraft?.name || '',         // Q
    f.aircraft?.code || '',         // R
    f.operatingAirline?.name || '', // S
    f.operatingAirline?.code || '', // T
    f.marketingAirline?.name || '', // U
    f.marketingAirline?.code || '', // V
    f.airline || ''                 // W
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Flights!A2',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: values 
    },
  });
}
async function getPurchases() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: ['Purchases!A2:U'],  // mở rộng tới cột U
  });
  const rows = res.data.valueRanges[0].values || [];
  return rows.map(r => ({
    userId: r[0],               
    type: r[1],                 
    flightId: r[2],             
    returnId: r[3],             
    from: r[4],                 
    to: r[5],                   
    departureDate: r[6],        
    returnDate: r[7],           
    passengers: Number(r[8]),   
    class: r[9],                
    totalPrice: Number(r[10]), 
    priceSGD: Number(r[11]) || 0,
    flightNumber: r[12] || '',  
    aircraft: r[13] || '',      
    date: r[14],                
    status: r[15],             
    method: r[16] || '',        
    cabinClass: r[17] || '',    
    fareClass: r[18] || '',     
    fareFamilyName: r[19] || '',
    currency: r[20] || 'SGD' 
  }));
}

async function addPurchase(purchase) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    console.log("Đang gửi dữ liệu đến Google Sheets...");

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Purchases!A2', 
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          purchase.userId || '', 
          purchase.type || '',
          purchase.flightId || purchase.outboundId || '',
          purchase.returnId || '',
          purchase.from || '',
          purchase.to || '',
          purchase.departureDate || '',
          purchase.returnDate || '',
          purchase.passengers || '',
          purchase.class || '',
          purchase.totalPrice || '',
          purchase.priceSGD || '',
          purchase.flightNumber || '',
          purchase.aircraft || '',
          purchase.date || new Date().toISOString(),
          purchase.status || 'Pending',
          purchase.method || 'bank',
          purchase.cabinClass || '',
          purchase.fareClass || '',
          purchase.fareFamilyName || '',
          purchase.currency || 'VND'
        ]]
      },
    });

    console.log("Kết quả từ Google Sheets:", response.statusText);
    return response.data;
  } catch (error) {
    console.error("LỖI KHI GHI VÀO GOOGLE SHEETS:", error.message);
    throw error;
  }
}
module.exports = {
  getUsers,
  addUser,
  getFlights,
  saveFlightsToSheet,
  getPurchases,
  addPurchase,
};