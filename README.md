# 🎬 CineAdmin — Hệ Thống Quản Lý Rạp Chiếu Phim

Ứng dụng web quản lý rạp chiếu phim full-stack với SQL Server backend.

## 📁 Cấu trúc dự án

```
cinema/
├── database.sql          # SQL Server schema + dữ liệu mẫu
├── server.js             # Express.js API backend
├── package.json          # Dependencies
├── .env.example          # Cấu hình môi trường
├── public/
│   └── index.html        # Frontend SPA (giao diện quản trị)
└── README.md
```

## 🛠️ Yêu cầu hệ thống

- **Node.js** >= 16
- **SQL Server** 2017+ hoặc SQL Server Express
- **npm** >= 8

## ⚙️ Cài đặt & Chạy

### Bước 1: Tạo Database

Mở SQL Server Management Studio (SSMS), chạy file `database.sql`:
```sql
-- Chạy toàn bộ file database.sql
-- Tạo DB CinemaDB + schema + dữ liệu mẫu
```

### Bước 2: Cài dependencies

```bash
cd cinema
npm install
```

### Bước 3: Cấu hình kết nối DB

```bash
cp .env.example .env
```

Sửa file `.env`:
```env
DB_SERVER=localhost          # hoặc tên SQL Server instance
DB_PORT=1433
DB_DATABASE=CinemaDB
DB_USER=sa                  # hoặc tài khoản SQL Server của bạn
DB_PASSWORD=YourPassword123!
DB_ENCRYPT=false
DB_TRUST_SERVER_CERT=true
PORT=3000
```

### Bước 4: Khởi động server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

## 🔌 SQL Server Authentication

Nếu dùng **Windows Authentication**, sửa `server.js`:
```javascript
const dbConfig = {
  server: 'localhost',
  database: 'CinemaDB',
  options: {
    trustedConnection: true,      // Windows Auth
    trustServerCertificate: true,
  }
};
```

Cài thêm package:
```bash
npm install msnodesqlv8
```

## 📊 Tính năng

| Module           | Chức năng                                      |
|------------------|------------------------------------------------|
| **Dashboard**    | Thống kê tổng quan, biểu đồ doanh thu         |
| **Thành phố**    | CRUD thành phố                                 |
| **Rạp chiếu**    | CRUD rạp, lọc theo thành phố                  |
| **Phòng chiếu**  | CRUD phòng, lọc theo rạp                      |
| **Ghế**          | Xem/xóa ghế theo phòng                        |
| **Phim**         | CRUD phim dạng card, tìm kiếm, lọc thể loại  |
| **Suất chiếu**   | CRUD suất chiếu, sơ đồ ghế realtime          |
| **Vé**           | Đặt vé, hủy vé, lọc trạng thái               |
| **Khách hàng**   | CRUD khách hàng, điểm tích lũy               |

## 🗃️ Cấu trúc Database

```
ThanhPho ──── RapChieuPhim ──── Phong ──── Ghe
                                   │
                              SuatChieu ──── Ve ──── KhachHang
                                   │
                                 Phim
```

## 🔗 API Endpoints

| Method | Endpoint                        | Mô tả                     |
|--------|---------------------------------|---------------------------|
| GET    | /api/thanhpho                   | Danh sách thành phố       |
| GET    | /api/rap                        | Danh sách rạp             |
| GET    | /api/phong?maRap=               | Danh sách phòng           |
| GET    | /api/phim?search=&theloai=      | Danh sách phim            |
| GET    | /api/suatchieu?ngay=&maPhim=    | Danh sách suất chiếu      |
| GET    | /api/suatchieu/:id/soghe        | Sơ đồ ghế suất chiếu     |
| GET    | /api/ve?trangThai=              | Danh sách vé              |
| POST   | /api/ve                         | Đặt vé (dùng stored proc) |
| PUT    | /api/ve/:id/huy                 | Hủy vé                    |
| GET    | /api/khachhang?search=          | Danh sách khách hàng      |
| GET    | /api/thongke/tongquan           | Thống kê tổng quan        |
| GET    | /api/thongke/doanhthu-theo-rap  | Doanh thu theo rạp        |
| GET    | /api/thongke/phim-hot           | Top phim ăn khách         |

## 🐛 Troubleshooting

**Lỗi kết nối SQL Server:**
- Bật TCP/IP trong SQL Server Configuration Manager
- Bật SQL Server Browser service
- Kiểm tra firewall mở port 1433
- Bật SQL Server Authentication (mixed mode)

**Lỗi named instance:**
```env
DB_SERVER=localhost\\SQLEXPRESS
```
