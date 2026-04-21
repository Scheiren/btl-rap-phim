-- =====================================================
-- HỆ THỐNG QUẢN LÝ RẠP CHIẾU PHIM
-- SQL Server Database Schema + Sample Data
-- =====================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'CinemaDB')
    DROP DATABASE CinemaDB;
GO

CREATE DATABASE CinemaDB
    COLLATE Vietnamese_CI_AS;
GO

USE CinemaDB;
GO

-- =====================================================
-- 1. BẢNG THÀNH PHỐ
-- =====================================================
CREATE TABLE ThanhPho (
    MaTP        NVARCHAR(10)    NOT NULL PRIMARY KEY,
    TenTP       NVARCHAR(100)   NOT NULL
);

-- =====================================================
-- 2. BẢNG RẠP CHIẾU PHIM
-- =====================================================
CREATE TABLE RapChieuPhim (
    MaRap       NVARCHAR(10)    NOT NULL PRIMARY KEY,
    TenRap      NVARCHAR(150)   NOT NULL,
    DiaChi      NVARCHAR(255)   NOT NULL,
    MaTP        NVARCHAR(10)    NOT NULL,
    FOREIGN KEY (MaTP) REFERENCES ThanhPho(MaTP)
);

-- =====================================================
-- 3. BẢNG PHÒNG
-- =====================================================
CREATE TABLE Phong (
    MaPhong     NVARCHAR(10)    NOT NULL PRIMARY KEY,
    TenPhong    NVARCHAR(100)   NOT NULL,
    MaRap       NVARCHAR(10)    NOT NULL,
    FOREIGN KEY (MaRap) REFERENCES RapChieuPhim(MaRap)
);

-- =====================================================
-- 4. BẢNG GHẾ
-- =====================================================
CREATE TABLE Ghe (
    MaGhe       NVARCHAR(10)    NOT NULL,
    MaPhong     NVARCHAR(10)    NOT NULL,
    ViTri       NVARCHAR(10)    NOT NULL,
    LoaiGhe     NVARCHAR(20)    NOT NULL CHECK (LoaiGhe IN (N'VIP', N'Thường')),
    PRIMARY KEY (MaGhe),
    UNIQUE (MaPhong, ViTri),
    FOREIGN KEY (MaPhong) REFERENCES Phong(MaPhong)
);

-- =====================================================
-- 5. BẢNG PHIM
-- =====================================================
CREATE TABLE Phim (
    MaPhim          NVARCHAR(10)    NOT NULL PRIMARY KEY,
    TenPhim         NVARCHAR(200)   NOT NULL,
    DaoDien         NVARCHAR(150)   NOT NULL,
    QuocGia         NVARCHAR(100)   NOT NULL,
    TheLoai         NVARCHAR(100)   NOT NULL,
    ThoiLuong       INT             NOT NULL,   -- phút
    NgayKhoiChieu   DATE            NOT NULL,
    MoTa            NVARCHAR(MAX)   NULL,
    HinhAnh         NVARCHAR(500)   NULL
);

-- =====================================================
-- 6. BẢNG SUẤT CHIẾU
-- =====================================================
CREATE TABLE SuatChieu (
    MaSchieu    NVARCHAR(10)    NOT NULL PRIMARY KEY,
    MaPhim      NVARCHAR(10)    NOT NULL,
    MaPhong     NVARCHAR(10)    NOT NULL,
    NgayChieu   DATE            NOT NULL,
    ThoiGianBd  TIME            NOT NULL,
    ThoiGianKt  TIME            NOT NULL,
    HeSoGia     DECIMAL(5,2)    NOT NULL DEFAULT 1.0,
    FOREIGN KEY (MaPhim)    REFERENCES Phim(MaPhim),
    FOREIGN KEY (MaPhong)   REFERENCES Phong(MaPhong)
);

-- =====================================================
-- 7. BẢNG KHÁCH HÀNG
-- =====================================================
CREATE TABLE KhachHang (
    MaKH        NVARCHAR(10)    NOT NULL PRIMARY KEY,
    HoTen       NVARCHAR(150)   NOT NULL,
    Sdt         NVARCHAR(15)    NOT NULL UNIQUE,
    Email       NVARCHAR(150)   NULL,
    DiemTichLuy INT             NOT NULL DEFAULT 0
);

-- =====================================================
-- 8. BẢNG VÉ
-- =====================================================
CREATE TABLE Ve (
    MaVe        NVARCHAR(10)    NOT NULL PRIMARY KEY,
    MaKH        NVARCHAR(10)    NOT NULL,
    MaSchieu    NVARCHAR(10)    NOT NULL,
    MaPhong     NVARCHAR(10)    NOT NULL,
    ViTri       NVARCHAR(10)    NOT NULL,
    TrangThai   NVARCHAR(20)    NOT NULL DEFAULT N'Đã đặt' 
                    CHECK (TrangThai IN (N'Đã đặt', N'Còn trống', N'Đã hủy')),
    NgayDat     DATETIME        NOT NULL DEFAULT GETDATE(),
    ThanhTien   DECIMAL(12,0)   NOT NULL,
    FOREIGN KEY (MaKH)              REFERENCES KhachHang(MaKH),
    FOREIGN KEY (MaSchieu)          REFERENCES SuatChieu(MaSchieu),
    FOREIGN KEY (MaPhong, ViTri)    REFERENCES Ghe(MaPhong, ViTri)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IX_RapChieuPhim_MaTP    ON RapChieuPhim(MaTP);
CREATE INDEX IX_Phong_MaRap          ON Phong(MaRap);
CREATE INDEX IX_Ghe_MaPhong          ON Ghe(MaPhong);
CREATE INDEX IX_SuatChieu_MaPhim     ON SuatChieu(MaPhim);
CREATE INDEX IX_SuatChieu_MaPhong    ON SuatChieu(MaPhong);
CREATE INDEX IX_SuatChieu_NgayChieu  ON SuatChieu(NgayChieu);
CREATE INDEX IX_Ve_MaKH              ON Ve(MaKH);
CREATE INDEX IX_Ve_MaSchieu          ON Ve(MaSchieu);

GO

-- =====================================================
-- DỮ LIỆU MẪU
-- =====================================================

-- Thành phố
INSERT INTO ThanhPho VALUES
('TP01', N'Hà Nội'),
('TP02', N'TP. Hồ Chí Minh'),
('TP03', N'Đà Nẵng'),
('TP04', N'Cần Thơ'),
('TP05', N'Hải Phòng');

-- Rạp chiếu phim
INSERT INTO RapChieuPhim VALUES
('RAP01', N'CGV Vincom Ba Đình', N'72A Nguyễn Trãi, Thanh Xuân, Hà Nội', 'TP01'),
('RAP02', N'Lotte Cinema Hà Nội', N'54 Liễu Giai, Ba Đình, Hà Nội', 'TP01'),
('RAP03', N'CGV Crescent Mall', N'101 Tôn Dật Tiên, Phú Mỹ Hưng, HCM', 'TP02'),
('RAP04', N'Galaxy Nguyễn Du', N'116 Nguyễn Du, Quận 1, HCM', 'TP02'),
('RAP05', N'Lotte Cinema Đà Nẵng', N'6 Lê Duẩn, Hải Châu, Đà Nẵng', 'TP03');

-- Phòng
INSERT INTO Phong VALUES
('P01', N'Phòng 1 - Standard', 'RAP01'),
('P02', N'Phòng 2 - VIP', 'RAP01'),
('P03', N'Phòng 3 - IMAX', 'RAP01'),
('P04', N'Phòng 1 - Standard', 'RAP02'),
('P05', N'Phòng 2 - Deluxe', 'RAP02'),
('P06', N'Phòng 1 - 4DX', 'RAP03'),
('P07', N'Phòng 2 - Standard', 'RAP03'),
('P08', N'Phòng 1 - VIP', 'RAP04'),
('P09', N'Phòng 1 - Standard', 'RAP05');

-- Ghế (mỗi phòng ~20 ghế mẫu)
DECLARE @phong NVARCHAR(10);
DECLARE @hang CHAR(1);
DECLARE @so INT;
DECLARE @maGhe NVARCHAR(10);
DECLARE @viTri NVARCHAR(10);
DECLARE @loai NVARCHAR(20);
DECLARE @ghe_id INT = 1;

DECLARE phong_cursor CURSOR FOR SELECT MaPhong FROM Phong;
OPEN phong_cursor;
FETCH NEXT FROM phong_cursor INTO @phong;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @hang = 'A';
    WHILE @hang <= 'E'
    BEGIN
        SET @so = 1;
        WHILE @so <= 8
        BEGIN
            SET @maGhe = 'G' + RIGHT('000' + CAST(@ghe_id AS NVARCHAR), 3);
            SET @viTri = @hang + CAST(@so AS NVARCHAR);
            IF @hang IN ('D','E') SET @loai = N'VIP' ELSE SET @loai = N'Thường';
            
            INSERT INTO Ghe(MaGhe, MaPhong, ViTri, LoaiGhe) 
            VALUES (@maGhe, @phong, @viTri, @loai);
            
            SET @ghe_id = @ghe_id + 1;
            SET @so = @so + 1;
        END
        SET @hang = CHAR(ASCII(@hang) + 1);
    END
    FETCH NEXT FROM phong_cursor INTO @phong;
END

CLOSE phong_cursor;
DEALLOCATE phong_cursor;
GO

-- Phim
INSERT INTO Phim VALUES
('PM01', N'Avengers: Secret Wars', N'Russo Brothers', N'Mỹ', N'Hành động / Viễn tưởng', 180, '2026-05-01',
 N'Cuộc chiến cuối cùng của các siêu anh hùng để cứu lấy vũ trụ đa chiều.', NULL),
('PM02', N'Inception 2', N'Christopher Nolan', N'Mỹ', N'Khoa học viễn tưởng / Tâm lý', 160, '2026-04-15',
 N'Hành trình xâm nhập giấc mơ trở lại với những bí ẩn sâu hơn.', NULL),
('PM03', N'Doraemon: Nobita và Vương Quốc Rô-bốt', N'Takashi Yamazaki', N'Nhật Bản', N'Hoạt hình / Gia đình', 110, '2026-03-07',
 N'Doraemon và Nobita phiêu lưu đến vương quốc của những chú rô-bốt thần kỳ.', NULL),
('PM04', N'Kẻ Trộm Mặt Trăng', N'Bảo Nhân', N'Việt Nam', N'Hành động / Hài', 120, '2026-04-30',
 N'Bộ phim hành động hài hước thuần Việt về một tên trộm bất đắc dĩ.', NULL),
('PM05', N'Oppenheimer 2', N'Christopher Nolan', N'Mỹ / Anh', N'Lịch sử / Tiểu sử', 200, '2026-06-20',
 N'Tiếp nối hành trình của nhà vật lý học vĩ đại trong thế chiến thứ hai.', NULL),
('PM06', N'Lật Mặt 8', N'Lý Hải', N'Việt Nam', N'Hành động / Drama', 130, '2026-04-25',
 N'Phần tiếp theo của thương hiệu điện ảnh Việt đình đám Lật Mặt.', NULL);

-- Suất chiếu
INSERT INTO SuatChieu VALUES
('SC001', 'PM01', 'P01', '2026-04-20', '09:00', '12:00', 1.0),
('SC002', 'PM01', 'P01', '2026-04-20', '14:00', '17:00', 1.0),
('SC003', 'PM01', 'P02', '2026-04-20', '18:30', '21:30', 1.5),
('SC004', 'PM02', 'P03', '2026-04-20', '10:00', '12:40', 1.2),
('SC005', 'PM02', 'P03', '2026-04-20', '15:00', '17:40', 1.2),
('SC006', 'PM03', 'P04', '2026-04-20', '08:00', '09:50', 1.0),
('SC007', 'PM04', 'P05', '2026-04-21', '19:00', '21:00', 1.3),
('SC008', 'PM05', 'P06', '2026-04-21', '20:00', '23:20', 1.8),
('SC009', 'PM06', 'P07', '2026-04-22', '13:00', '15:10', 1.0),
('SC010', 'PM01', 'P08', '2026-04-22', '16:00', '19:00', 1.5),
('SC011', 'PM02', 'P09', '2026-04-22', '09:30', '12:10', 1.0),
('SC012', 'PM03', 'P01', '2026-04-23', '10:00', '11:50', 1.0);

-- Khách hàng
INSERT INTO KhachHang VALUES
('KH001', N'Nguyễn Văn An', '0912345678', 'an.nguyen@email.com', 250),
('KH002', N'Trần Thị Bình', '0923456789', 'binh.tran@email.com', 180),
('KH003', N'Lê Minh Cường', '0934567890', 'cuong.le@email.com', 520),
('KH004', N'Phạm Thu Dung', '0945678901', 'dung.pham@email.com', 90),
('KH005', N'Hoàng Văn Em', '0956789012', 'em.hoang@email.com', 340),
('KH006', N'Ngô Thị Fai', '0967890123', 'fai.ngo@email.com', 760),
('KH007', N'Đỗ Quốc Giang', '0978901234', 'giang.do@email.com', 120),
('KH008', N'Vũ Thị Hoa', '0989012345', 'hoa.vu@email.com', 450);

-- Vé
INSERT INTO Ve VALUES
('VE0001', 'KH001', 'SC001', 'P01', 'A1', N'Đã đặt', '2026-04-18 10:30:00', 100000),
('VE0002', 'KH001', 'SC001', 'P01', 'A2', N'Đã đặt', '2026-04-18 10:30:00', 100000),
('VE0003', 'KH002', 'SC003', 'P02', 'D1', N'Đã đặt', '2026-04-18 14:00:00', 180000),
('VE0004', 'KH003', 'SC002', 'P01', 'B3', N'Đã đặt', '2026-04-19 09:00:00', 100000),
('VE0005', 'KH004', 'SC004', 'P03', 'C1', N'Đã đặt', '2026-04-19 11:00:00', 120000),
('VE0006', 'KH005', 'SC007', 'P05', 'E2', N'Đã đặt', '2026-04-19 12:00:00', 150000),
('VE0007', 'KH006', 'SC008', 'P06', 'D3', N'Đã đặt', '2026-04-19 15:00:00', 200000),
('VE0008', 'KH007', 'SC010', 'P08', 'D1', N'Đã đặt', '2026-04-20 08:00:00', 180000),
('VE0009', 'KH008', 'SC009', 'P07', 'B2', N'Đã đặt', '2026-04-20 09:00:00', 100000),
('VE0010', 'KH003', 'SC005', 'P03', 'A5', N'Đã đặt', '2026-04-20 10:00:00', 120000);

GO

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- SP: Thống kê doanh thu theo rạp
CREATE PROCEDURE sp_DoanhThuTheoRap
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL
AS
BEGIN
    SELECT 
        r.MaRap,
        r.TenRap,
        tp.TenTP,
        COUNT(v.MaVe)       AS TongVe,
        SUM(v.ThanhTien)    AS DoanhThu
    FROM RapChieuPhim r
    JOIN ThanhPho tp    ON tp.MaTP = r.MaTP
    LEFT JOIN Phong p   ON p.MaRap = r.MaRap
    LEFT JOIN SuatChieu sc ON sc.MaPhong = p.MaPhong
        AND (@TuNgay IS NULL OR sc.NgayChieu >= @TuNgay)
        AND (@DenNgay IS NULL OR sc.NgayChieu <= @DenNgay)
    LEFT JOIN Ve v      ON v.MaSchieu = sc.MaSchieu AND v.TrangThai = N'Đã đặt'
    GROUP BY r.MaRap, r.TenRap, tp.TenTP
    ORDER BY DoanhThu DESC;
END
GO

-- SP: Xem ghế còn trống của một suất chiếu
CREATE PROCEDURE sp_GheTrongSuatChieu
    @MaSchieu NVARCHAR(10)
AS
BEGIN
    SELECT sc.MaPhong, g.MaGhe, g.ViTri, g.LoaiGhe,
        CASE WHEN v.MaVe IS NOT NULL THEN N'Đã đặt' ELSE N'Còn trống' END AS TrangThai
    FROM SuatChieu sc
    JOIN Ghe g ON g.MaPhong = sc.MaPhong
    LEFT JOIN Ve v ON v.MaSchieu = sc.MaSchieu 
        AND v.MaPhong = g.MaPhong 
        AND v.ViTri = g.ViTri
        AND v.TrangThai = N'Đã đặt'
    WHERE sc.MaSchieu = @MaSchieu
    ORDER BY g.ViTri;
END
GO

-- SP: Đặt vé
CREATE PROCEDURE sp_DatVe
    @MaKH       NVARCHAR(10),
    @MaSchieu   NVARCHAR(10),
    @MaPhong    NVARCHAR(10),
    @ViTri      NVARCHAR(10),
    @GiaGoc     DECIMAL(12,0)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra ghế đã đặt chưa
        IF EXISTS (
            SELECT 1 FROM Ve 
            WHERE MaSchieu = @MaSchieu AND MaPhong = @MaPhong 
              AND ViTri = @ViTri AND TrangThai = N'Đã đặt'
        )
        BEGIN
            ROLLBACK;
            SELECT -1 AS KetQua, N'Ghế đã được đặt!' AS ThongBao;
            RETURN;
        END

        DECLARE @HeSo DECIMAL(5,2);
        SELECT @HeSo = HeSoGia FROM SuatChieu WHERE MaSchieu = @MaSchieu;

        DECLARE @ThanhTien DECIMAL(12,0) = @GiaGoc * @HeSo;
        DECLARE @MaVe NVARCHAR(10) = 'VE' + RIGHT('00000' + CAST(
            (SELECT ISNULL(MAX(CAST(SUBSTRING(MaVe,3,10) AS INT)),0)+1 FROM Ve), 4), 4);

        INSERT INTO Ve(MaVe, MaKH, MaSchieu, MaPhong, ViTri, TrangThai, NgayDat, ThanhTien)
        VALUES (@MaVe, @MaKH, @MaSchieu, @MaPhong, @ViTri, N'Đã đặt', GETDATE(), @ThanhTien);

        -- Cập nhật điểm tích lũy
        UPDATE KhachHang 
        SET DiemTichLuy = DiemTichLuy + CAST(@ThanhTien / 10000 AS INT)
        WHERE MaKH = @MaKH;

        COMMIT;
        SELECT 1 AS KetQua, @MaVe AS MaVe, @ThanhTien AS ThanhTien, N'Đặt vé thành công!' AS ThongBao;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SELECT -1 AS KetQua, ERROR_MESSAGE() AS ThongBao;
    END CATCH
END
GO

PRINT N'Database CinemaDB created successfully!';
