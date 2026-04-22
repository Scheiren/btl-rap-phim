require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================
app.use(cors({
  origin: 'http://localhost:3000',//check port
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================
// SQL SERVER CONFIG
// =====================================================
const dbConfig = {
  server:   process.env.DB_SERVER   || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE || 'CinemaDB',
  user:     process.env.DB_USER     || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  options: {
    encrypt:              process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort:     true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let pool;
async function getPool() {
  if (!pool) pool = await sql.connect(dbConfig);
  return pool;
}

// Helper: query wrapper
async function query(queryStr, params = {}) {
  const p = await getPool();
  const req = p.request();
  Object.entries(params).forEach(([k, v]) => req.input(k, v));
  return req.query(queryStr);
}

// Xác thực qua JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Truy cập bị từ chối. Vui lòng đăng nhập.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
    req.user = user;
    next();
  });
}

// =====================================================
// ROUTES — XÁC THỰC (AUTH)
// =====================================================
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const userPayload = { username: username, role: 'admin' };
    
    const accessToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '2h' });
    
    res.json({ success: true, token: accessToken });
  } else {
    res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu.' });
  }
});

// =====================================================
// ROUTES — THÀNH PHỐ
// =====================================================
app.get('/api/thanhpho', async (req, res) => {
  try {
    const result = await query('SELECT * FROM ThanhPho ORDER BY TenTP');
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/thanhpho', authenticateToken, async (req, res) => {
  const { MaTP, TenTP } = req.body;
  try {
    await query('INSERT INTO ThanhPho VALUES (@MaTP, @TenTP)', { MaTP, TenTP });
    res.json({ success: true, message: 'Thêm thành phố thành công' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/thanhpho/:id', authenticateToken, async (req, res) => {
  const { TenTP } = req.body;
  try {
    await query('UPDATE ThanhPho SET TenTP=@TenTP WHERE MaTP=@MaTP',
      { MaTP: req.params.id, TenTP });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/thanhpho/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM ThanhPho WHERE MaTP=@MaTP', { MaTP: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =====================================================
// ROUTES — RẠP CHIẾU PHIM
// =====================================================
app.get('/api/rap', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, tp.TenTP,
        (SELECT COUNT(*) FROM Phong WHERE MaRap = r.MaRap) AS SoPhong
      FROM RapChieuPhim r
      JOIN ThanhPho tp ON tp.MaTP = r.MaTP
      ORDER BY tp.TenTP, r.TenRap
    `);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/rap/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, tp.TenTP FROM RapChieuPhim r
      JOIN ThanhPho tp ON tp.MaTP = r.MaTP WHERE r.MaRap=@MaRap
    `, { MaRap: req.params.id });
    res.json(result.recordset[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rap', authenticateToken, async (req, res) => {
  const { MaRap, TenRap, DiaChi, MaTP } = req.body;
  try {
    await query('INSERT INTO RapChieuPhim VALUES (@MaRap,@TenRap,@DiaChi,@MaTP)',
      { MaRap, TenRap, DiaChi, MaTP });
    res.json({ success: true, message: 'Thêm rạp thành công' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/rap/:id', authenticateToken, async (req, res) => {
  const { TenRap, DiaChi, MaTP } = req.body;
  try {
    await query('UPDATE RapChieuPhim SET TenRap=@TenRap,DiaChi=@DiaChi,MaTP=@MaTP WHERE MaRap=@MaRap',
      { MaRap: req.params.id, TenRap, DiaChi, MaTP });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/rap/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM RapChieuPhim WHERE MaRap=@MaRap', { MaRap: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =====================================================
// ROUTES — PHÒNG
// =====================================================
app.get('/api/phong', async (req, res) => {
  try {
    const { maRap } = req.query;
    let q = `SELECT p.*, r.TenRap, tp.TenTP,
      (SELECT COUNT(*) FROM Ghe WHERE MaPhong=p.MaPhong) AS SoGhe
      FROM Phong p JOIN RapChieuPhim r ON r.MaRap=p.MaRap
      JOIN ThanhPho tp ON tp.MaTP=r.MaTP`;
    const params = {};
    if (maRap) { q += ' WHERE p.MaRap=@MaRap'; params.MaRap = maRap; }
    q += ' ORDER BY r.TenRap, p.TenPhong';
    const result = await query(q, params);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/phong', authenticateToken, async (req, res) => {
  const { MaPhong, TenPhong, MaRap } = req.body;
  try {
    await query('INSERT INTO Phong VALUES (@MaPhong,@TenPhong,@MaRap)',
      { MaPhong, TenPhong, MaRap });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/phong/:id', authenticateToken, async (req, res) => {
  const { TenPhong, MaRap } = req.body;
  try {
    await query('UPDATE Phong SET TenPhong=@TenPhong,MaRap=@MaRap WHERE MaPhong=@MaPhong',
      { MaPhong: req.params.id, TenPhong, MaRap });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/phong/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM Phong WHERE MaPhong=@MaPhong', { MaPhong: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =====================================================
// ROUTES — GHẾ
// =====================================================
app.get('/api/ghe', async (req, res) => {
  try {
    const { maPhong } = req.query;
    let q = `SELECT g.*, p.TenPhong, r.TenRap FROM Ghe g
      JOIN Phong p ON p.MaPhong=g.MaPhong
      JOIN RapChieuPhim r ON r.MaRap=p.MaRap`;
    const params = {};
    if (maPhong) { q += ' WHERE g.MaPhong=@MaPhong'; params.MaPhong = maPhong; }
    q += ' ORDER BY g.ViTri';
    const result = await query(q, params);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ghe', authenticateToken, async (req, res) => {
  const { MaGhe, MaPhong, ViTri, LoaiGhe } = req.body;
  try {
    await query('INSERT INTO Ghe VALUES (@MaGhe,@MaPhong,@ViTri,@LoaiGhe)',
      { MaGhe, MaPhong, ViTri, LoaiGhe });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/ghe/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM Ghe WHERE MaGhe=@MaGhe', { MaGhe: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =====================================================
// ROUTES — PHIM
// =====================================================
app.get('/api/phim', async (req, res) => {
  try {
    const { search, theloai } = req.query;
    let q = 'SELECT *, (SELECT COUNT(*) FROM SuatChieu WHERE MaPhim=p.MaPhim) AS SoSuat FROM Phim p WHERE 1=1';
    const params = {};
    if (search) { q += ' AND (TenPhim LIKE @s OR DaoDien LIKE @s)'; params.s = `%${search}%`; }
    if (theloai) { q += ' AND TheLoai LIKE @tl'; params.tl = `%${theloai}%`; }
    q += ' ORDER BY NgayKhoiChieu DESC';
    const result = await query(q, params);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/phim/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Phim WHERE MaPhim=@MaPhim', { MaPhim: req.params.id });
    res.json(result.recordset[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/phim', authenticateToken, async (req, res) => {
  const { MaPhim, TenPhim, DaoDien, QuocGia, TheLoai, ThoiLuong, NgayKhoiChieu, MoTa } = req.body;
  try {
    await query(`INSERT INTO Phim(MaPhim,TenPhim,DaoDien,QuocGia,TheLoai,ThoiLuong,NgayKhoiChieu,MoTa)
      VALUES(@MaPhim,@TenPhim,@DaoDien,@QuocGia,@TheLoai,@ThoiLuong,@NgayKhoiChieu,@MoTa)`,
      { MaPhim, TenPhim, DaoDien, QuocGia, TheLoai, ThoiLuong: parseInt(ThoiLuong), NgayKhoiChieu, MoTa });
    res.json({ success: true, message: 'Thêm phim thành công' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/phim/:id', authenticateToken, async (req, res) => {
  const { TenPhim, DaoDien, QuocGia, TheLoai, ThoiLuong, NgayKhoiChieu, MoTa } = req.body;
  try {
    await query(`UPDATE Phim SET TenPhim=@TenPhim,DaoDien=@DaoDien,QuocGia=@QuocGia,
      TheLoai=@TheLoai,ThoiLuong=@ThoiLuong,NgayKhoiChieu=@NgayKhoiChieu,MoTa=@MoTa
      WHERE MaPhim=@MaPhim`,
      { MaPhim: req.params.id, TenPhim, DaoDien, QuocGia, TheLoai, ThoiLuong: parseInt(ThoiLuong), NgayKhoiChieu, MoTa });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/phim/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM Phim WHERE MaPhim=@MaPhim', { MaPhim: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =====================================================
// ROUTES — SUẤT CHIẾU
// =====================================================
app.get('/api/suatchieu', async (req, res) => {
  try {
    const { maPhim, maPhong, ngay } = req.query;
    let q = `
      SELECT sc.*, pm.TenPhim, pm.ThoiLuong, p.TenPhong, r.TenRap,
        (SELECT COUNT(*) FROM Ve WHERE MaSchieu=sc.MaSchieu AND TrangThai=N'Đã đặt') AS SoVeDaBan,
        (SELECT COUNT(*) FROM Ghe WHERE MaPhong=sc.MaPhong) AS TongGhe
      FROM SuatChieu sc
      JOIN Phim pm ON pm.MaPhim=sc.MaPhim
      JOIN Phong p ON p.MaPhong=sc.MaPhong
      JOIN RapChieuPhim r ON r.MaRap=p.MaRap
      WHERE 1=1`;
    const params = {};
    if (maPhim) { q += ' AND sc.MaPhim=@MaPhim'; params.MaPhim = maPhim; }
    if (maPhong) { q += ' AND sc.MaPhong=@MaPhong'; params.MaPhong = maPhong; }
    if (ngay) { q += ' AND sc.NgayChieu=@NgayChieu'; params.NgayChieu = ngay; }
    q += ' ORDER BY sc.NgayChieu, sc.ThoiGianBd';
    const result = await query(q, params);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/suatchieu', authenticateToken, async (req, res) => {
  const { MaSchieu, MaPhim, MaPhong, NgayChieu, ThoiGianBd, ThoiGianKt, HeSoGia } = req.body;
  try {
    await query(`INSERT INTO SuatChieu VALUES(@MaSchieu,@MaPhim,@MaPhong,@NgayChieu,@ThoiGianBd,@ThoiGianKt,@HeSoGia)`,
      { MaSchieu, MaPhim, MaPhong, NgayChieu, ThoiGianBd, ThoiGianKt, HeSoGia: parseFloat(HeSoGia) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/suatchieu/:id', authenticateToken, async (req, res) => {
  const { MaPhim, MaPhong, NgayChieu, ThoiGianBd, ThoiGianKt, HeSoGia } = req.body;
  try {
    await query(`UPDATE SuatChieu SET MaPhim=@MaPhim,MaPhong=@MaPhong,NgayChieu=@NgayChieu,
      ThoiGianBd=@ThoiGianBd,ThoiGianKt=@ThoiGianKt,HeSoGia=@HeSoGia WHERE MaSchieu=@MaSchieu`,
      { MaSchieu: req.params.id, MaPhim, MaPhong, NgayChieu, ThoiGianBd, ThoiGianKt, HeSoGia: parseFloat(HeSoGia) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/suatchieu/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM SuatChieu WHERE MaSchieu=@MaSchieu', { MaSchieu: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Sơ đồ ghế của suất chiếu
app.get('/api/suatchieu/:id/soghe', async (req, res) => {
  try {
    const result = await query(`
      SELECT g.MaGhe, g.ViTri, g.LoaiGhe,
        CASE WHEN v.MaVe IS NOT NULL THEN N'Đã đặt' ELSE N'Còn trống' END AS TrangThai
      FROM SuatChieu sc
      JOIN Ghe g ON g.MaPhong=sc.MaPhong
      LEFT JOIN Ve v ON v.MaSchieu=sc.MaSchieu AND v.MaPhong=g.MaPhong
        AND v.ViTri=g.ViTri AND v.TrangThai=N'Đã đặt'
      WHERE sc.MaSchieu=@MaSchieu ORDER BY g.ViTri
    `, { MaSchieu: req.params.id });
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =====================================================
// ROUTES — KHÁCH HÀNG
// =====================================================
app.get('/api/khachhang', async (req, res) => {
  try {
    const { search } = req.query;
    let q = `SELECT kh.*, (SELECT COUNT(*) FROM Ve WHERE MaKH=kh.MaKH) AS TongVe,
      (SELECT ISNULL(SUM(ThanhTien),0) FROM Ve WHERE MaKH=kh.MaKH AND TrangThai=N'Đã đặt') AS TongChiTieu
      FROM KhachHang kh WHERE 1=1`;
    const params = {};
    if (search) { q += ' AND (HoTen LIKE @s OR Sdt LIKE @s OR Email LIKE @s)'; params.s = `%${search}%`; }
    q += ' ORDER BY DiemTichLuy DESC';
    const result = await query(q, params);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/khachhang', authenticateToken, async (req, res) => {
  const { MaKH, HoTen, Sdt, Email } = req.body;
  try {
    await query('INSERT INTO KhachHang(MaKH,HoTen,Sdt,Email) VALUES(@MaKH,@HoTen,@Sdt,@Email)',
      { MaKH, HoTen, Sdt, Email: Email || null });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/khachhang/:id', authenticateToken, async (req, res) => {
  const { HoTen, Sdt, Email, DiemTichLuy } = req.body;
  try {
    await query('UPDATE KhachHang SET HoTen=@HoTen,Sdt=@Sdt,Email=@Email,DiemTichLuy=@DiemTichLuy WHERE MaKH=@MaKH',
      { MaKH: req.params.id, HoTen, Sdt, Email: Email || null, DiemTichLuy: parseInt(DiemTichLuy) || 0 });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/khachhang/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM KhachHang WHERE MaKH=@MaKH', { MaKH: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =====================================================
// ROUTES — VÉ
// =====================================================
app.get('/api/ve', async (req, res) => {
  try {
    const { maKH, maSchieu, trangThai } = req.query;
    let q = `
      SELECT v.*, kh.HoTen, kh.Sdt, pm.TenPhim, p.TenPhong, r.TenRap,
        sc.NgayChieu, sc.ThoiGianBd, sc.ThoiGianKt, g.LoaiGhe
      FROM Ve v
      JOIN KhachHang kh ON kh.MaKH=v.MaKH
      JOIN SuatChieu sc ON sc.MaSchieu=v.MaSchieu
      JOIN Phim pm ON pm.MaPhim=sc.MaPhim
      JOIN Phong p ON p.MaPhong=v.MaPhong
      JOIN RapChieuPhim r ON r.MaRap=p.MaRap
      JOIN Ghe g ON g.MaPhong=v.MaPhong AND g.ViTri=v.ViTri
      WHERE 1=1`;
    const params = {};
    if (maKH) { q += ' AND v.MaKH=@MaKH'; params.MaKH = maKH; }
    if (maSchieu) { q += ' AND v.MaSchieu=@MaSchieu'; params.MaSchieu = maSchieu; }
    if (trangThai) { q += ' AND v.TrangThai=@TrangThai'; params.TrangThai = trangThai; }
    q += ' ORDER BY v.NgayDat DESC';
    const result = await query(q, params);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ve', async (req, res) => {
  const { MaKH, MaSchieu, MaPhong, ViTri, GiaGoc } = req.body;
  try {
    const p = await getPool();
    const result = await p.request()
      .input('MaKH', MaKH).input('MaSchieu', MaSchieu)
      .input('MaPhong', MaPhong).input('ViTri', ViTri)
      .input('GiaGoc', parseFloat(GiaGoc))
      .execute('sp_DatVe');
    const r = result.recordset[0];
    if (r.KetQua === 1) res.json({ success: true, ...r });
    else res.status(400).json({ success: false, error: r.ThongBao });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/ve/:id/huy', authenticateToken, async (req, res) => {
  try {
    await query(`UPDATE Ve SET TrangThai=N'Đã hủy' WHERE MaVe=@MaVe`, { MaVe: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =====================================================
// ROUTES — THỐNG KÊ / DASHBOARD
// =====================================================
app.get('/api/thongke/tongquan', async (req, res) => {
  try {
    const [phim, rap, khach, ve, doanhthu] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM Phim'),
      query('SELECT COUNT(*) AS total FROM RapChieuPhim'),
      query('SELECT COUNT(*) AS total FROM KhachHang'),
      query(`SELECT COUNT(*) AS total FROM Ve WHERE TrangThai=N'Đã đặt'`),
      query(`SELECT ISNULL(SUM(ThanhTien),0) AS total FROM Ve WHERE TrangThai=N'Đã đặt'`),
    ]);
    res.json({
      tongPhim:     phim.recordset[0].total,
      tongRap:      rap.recordset[0].total,
      tongKhach:    khach.recordset[0].total,
      tongVe:       ve.recordset[0].total,
      doanhThu:     doanhthu.recordset[0].total,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/thongke/doanhthu-theo-rap', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.TenRap, tp.TenTP,
        COUNT(v.MaVe) AS TongVe,
        ISNULL(SUM(v.ThanhTien),0) AS DoanhThu
      FROM RapChieuPhim r
      JOIN ThanhPho tp ON tp.MaTP=r.MaTP
      LEFT JOIN Phong p ON p.MaRap=r.MaRap
      LEFT JOIN SuatChieu sc ON sc.MaPhong=p.MaPhong
      LEFT JOIN Ve v ON v.MaSchieu=sc.MaSchieu AND v.TrangThai=N'Đã đặt'
      GROUP BY r.MaRap, r.TenRap, tp.TenTP
      ORDER BY DoanhThu DESC
    `);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/thongke/phim-hot', async (req, res) => {
  try {
    const result = await query(`
      SELECT TOP 6 pm.TenPhim, pm.TheLoai,
        COUNT(v.MaVe) AS SoVe,
        ISNULL(SUM(v.ThanhTien),0) AS DoanhThu
      FROM Phim pm
      LEFT JOIN SuatChieu sc ON sc.MaPhim=pm.MaPhim
      LEFT JOIN Ve v ON v.MaSchieu=sc.MaSchieu AND v.TrangThai=N'Đã đặt'
      GROUP BY pm.MaPhim, pm.TenPhim, pm.TheLoai
      ORDER BY SoVe DESC
    `);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await getPool();
    console.log('✅ Kết nối SQL Server thành công!');
    app.listen(PORT, () => {
      console.log(`🎬 Cinema Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
    process.exit(1);
  }
}

startServer();
