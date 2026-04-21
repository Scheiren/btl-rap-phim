USE CinemaDB
GO
-- Bài 5.2- 5.4
-- View 1: vw_SuatChieuChiTiet
--   Thông tin đầy đủ một suất chiếu: phim, phòng, rạp,
--   thành phố, giờ bắt đầu/kết thúc, hệ số giá

CREATE OR ALTER VIEW vw_SuatChieuChiTiet AS
SELECT
    sc.MaSchieu,
    sc.NgayChieu,
    sc.ThoiGianBd,
    DATEADD(MINUTE, pm.ThoiLuong,
            CAST(sc.ThoiGianBd AS DATETIME))   AS ThoiGianKetThuc,
    sc.HeSoGia,
    pm.MaPhim,
    pm.TenPhim,
    pm.DaoDien,
    pm.ThoiLuong,
    pm.QuocGia,
    p.MaPhong,
    p.TenPhong,
    r.MaRap,
    r.TenRap,
    r.DiaChi,
    tp.MaTP,
    tp.TenTP
FROM SuatChieu sc
JOIN Phim pm            ON pm.MaPhim  = sc.MaPhim
JOIN Phong p            ON p.MaPhong  = sc.MaPhong
JOIN RapChieuPhim r     ON r.MaRap    = p.MaRap
JOIN ThanhPho tp        ON tp.MaTP    = r.MaTP;
GO

-- View 2: vw_VeChiTiet
--   Thông tin vé đầy đủ: khách hàng, phim, ghế, giá
CREATE OR ALTER VIEW vw_VeChiTiet AS
SELECT
    v.MaVe,
    v.TrangThai,
    v.NgayDat,
    v.ThanhTien,
    -- Khách hàng
    kh.MaKH,
    kh.HoTen        AS TenKhachHang,
    kh.Sdt,
    kh.Email,
    kh.DiemTichLuy,
    -- Ghế
    g.ViTri,
    g.LoaiGhe,
    -- Suất chiếu & phim
    sc.MaSchieu,
    sc.NgayChieu,
    sc.ThoiGianBd,
    sc.HeSoGia,
    pm.TenPhim,
    pm.DaoDien,
    pm.ThoiLuong,
    -- Phòng & rạp
    p.TenPhong,
    r.TenRap,
    tp.TenTP
FROM Ve v
JOIN KhachHang kh   ON kh.MaKH    = v.MaKH
JOIN SuatChieu sc   ON sc.MaSchieu = v.MaSchieu
JOIN Phim pm        ON pm.MaPhim  = sc.MaPhim
JOIN Phong p        ON p.MaPhong  = v.MaPhong
JOIN RapChieuPhim r ON r.MaRap    = p.MaRap
JOIN ThanhPho tp    ON tp.MaTP    = r.MaTP
JOIN Ghe g          ON g.MaPhong  = v.MaPhong
                   AND g.ViTri    = v.ViTri;
GO

-- View 3: vw_DoanhThuTheoPhim
--   Tổng hợp doanh thu, số vé, số suất chiếu từng phim
CREATE OR ALTER VIEW vw_DoanhThuTheoPhim AS
SELECT
    pm.MaPhim,
    pm.TenPhim,
    pm.DaoDien,
    pm.QuocGia,
    pm.NgayKhoiChieu,
    tl.TheLoai,
    COUNT(DISTINCT sc.MaSchieu) AS TongSuatChieu,
    COUNT(v.MaVe) AS TongVeDaBan,
    ISNULL(SUM(v.ThanhTien), 0) AS TongDoanhThu,
    ISNULL(AVG(v.ThanhTien), 0) AS GiaVeTrungBinh
FROM Phim pm
LEFT JOIN
(
    SELECT
        x.MaPhim,
        STRING_AGG(x.TenTheLoai, N', ') AS TheLoai
    FROM
    (
        SELECT DISTINCT
            ptl.MaPhim,
            tl.TenTheLoai
        FROM Phim_TheLoai ptl
        JOIN TheLoai tl ON tl.MaTheLoai = ptl.MaTheLoai
    ) x
    GROUP BY x.MaPhim
) tl ON tl.MaPhim = pm.MaPhim
LEFT JOIN SuatChieu sc ON sc.MaPhim = pm.MaPhim
LEFT JOIN Ve v ON v.MaSchieu = sc.MaSchieu
              AND v.TrangThai = N'Đã đặt'
GROUP BY
    pm.MaPhim,
    pm.TenPhim,
    pm.DaoDien,
    pm.QuocGia,
    pm.NgayKhoiChieu,
    tl.TheLoai;
GO

-- View 4: vw_TinhTrangGhe
--   Trạng thái từng ghế trong mỗi suất chiếu (đặt/trống)


CREATE OR ALTER VIEW vw_TinhTrangGhe AS
SELECT
    sc.MaSchieu,
    sc.NgayChieu,
    sc.ThoiGianBd,
    pm.TenPhim,
    r.TenRap,
    p.TenPhong,
    g.MaGhe,
    g.ViTri,
    g.LoaiGhe,
    CASE WHEN v.MaVe IS NOT NULL THEN N'Đã đặt' ELSE N'Còn trống' END AS TrangThaiGhe,
    v.MaKH,
    v.ThanhTien
FROM SuatChieu sc
JOIN Phim pm        ON pm.MaPhim  = sc.MaPhim
JOIN Phong p        ON p.MaPhong  = sc.MaPhong
JOIN RapChieuPhim r ON r.MaRap    = p.MaRap
JOIN Ghe g          ON g.MaPhong  = sc.MaPhong
LEFT JOIN Ve v      ON v.MaSchieu = sc.MaSchieu
                   AND v.MaPhong  = g.MaPhong
                   AND v.ViTri    = g.ViTri
                   AND v.TrangThai = N'Đã đặt';
GO

-- View 5: vw_ThongKeKhachHang
--   Thống kê hành vi khách hàng — hạng thành viên tự động
CREATE OR ALTER VIEW vw_ThongKeKhachHang AS
SELECT
    kh.MaKH,
    kh.HoTen,
    kh.Sdt,
    kh.Email,
    kh.DiemTichLuy,
    COUNT(DISTINCT v.MaVe)    AS TongVeDaMua,
    ISNULL(SUM(v.ThanhTien), 0) AS TongChiTieu,
    -- Phim xem gần nhất
    MAX(sc.NgayChieu)           AS NgayXemGanNhat,
    -- Hạng thành viên
    CASE
        WHEN kh.DiemTichLuy >= 500 THEN N'Vàng'
        WHEN kh.DiemTichLuy >= 200 THEN N'Bạc'
        ELSE N'Đồng'
    END                         AS HangThanhVien
FROM KhachHang kh
LEFT JOIN Ve v          ON v.MaKH     = kh.MaKH
                       AND v.TrangThai = N'Đã đặt'
LEFT JOIN SuatChieu sc  ON sc.MaSchieu = v.MaSchieu
GROUP BY kh.MaKH, kh.HoTen, kh.Sdt, kh.Email, kh.DiemTichLuy;
GO


-- TẠO INDEX TĂNG TỐC ĐỘ TRUY VẤN --

-- Xoá nếu đã tồn tại trước khi tạo lại
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Ve_TrangThai' AND object_id = OBJECT_ID('Ve'))
    DROP INDEX IX_Ve_TrangThai ON Ve;
 
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Ve_MaKH_TrangThai' AND object_id = OBJECT_ID('Ve'))
    DROP INDEX IX_Ve_MaKH_TrangThai ON Ve;
 
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Ve_MaSchieu_TrangThai' AND object_id = OBJECT_ID('Ve'))
    DROP INDEX IX_Ve_MaSchieu_TrangThai ON Ve;
 
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Ve_MaPhong_ViTri' AND object_id = OBJECT_ID('Ve'))
    DROP INDEX IX_Ve_MaPhong_ViTri ON Ve;
 
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SuatChieu_NgayChieu_MaPhim' AND object_id = OBJECT_ID('SuatChieu'))
    DROP INDEX IX_SuatChieu_NgayChieu_MaPhim ON SuatChieu;
 
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_KhachHang_DiemTichLuy' AND object_id = OBJECT_ID('KhachHang'))
    DROP INDEX IX_KhachHang_DiemTichLuy ON KhachHang;
 
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Phim_NgayKhoiChieu' AND object_id = OBJECT_ID('Phim'))
    DROP INDEX IX_Phim_NgayKhoiChieu ON Phim;
 
GO


-- SP QUẢN LÝ PHIM


-- Index 1: Lọc vé theo trạng thái — dùng nhiều nhất trong nghiệp vụ
-- Tác dụng: Truy vấn COUNT vé đã đặt nhanh hơn đáng kể
CREATE INDEX IX_Ve_TrangThai
    ON Ve(TrangThai)
    INCLUDE (MaSchieu, MaKH, ThanhTien);
GO
 
-- Index 2: Composite — lọc vé theo khách hàng và trạng thái
-- Tác dụng: Truy vấn lịch sử vé khách hàng (Truy vấn 7) tăng tốc
CREATE INDEX IX_Ve_MaKH_TrangThai
    ON Ve(MaKH, TrangThai)
    INCLUDE (MaSchieu, MaPhong, ViTri, ThanhTien, NgayDat);
GO
 
-- Index 3: Composite — kiểm tra ghế đã đặt trong sp_DatVe và View tình trạng ghế
-- Tác dụng: Tránh Full Scan bảng Ve khi kiểm tra ghế trống
CREATE INDEX IX_Ve_MaSchieu_TrangThai
    ON Ve(MaSchieu, TrangThai)
    INCLUDE (MaPhong, ViTri, MaKH, ThanhTien);
GO
 
-- Index 4: Composite — kiểm tra vị trí ghế trong phòng
-- Tác dụng: Tăng tốc FK lookup (MaPhong, ViTri) trong bảng Ve
CREATE INDEX IX_Ve_MaPhong_ViTri
    ON Ve(MaPhong, ViTri)
    INCLUDE (TrangThai, MaSchieu);
GO
 
-- Index 5: Composite — lọc suất chiếu theo ngày + phim
-- Tác dụng: Truy vấn lịch chiếu theo ngày (Truy vấn 1, 6) tăng tốc nhiều
CREATE INDEX IX_SuatChieu_NgayChieu_MaPhim
    ON SuatChieu(NgayChieu, MaPhim)
    INCLUDE (MaPhong, ThoiGianBd, HeSoGia);
GO
 
-- Index 6: Sắp xếp & lọc theo điểm tích lũy khách hàng
-- Tác dụng: TOP N khách hàng VIP (Truy vấn 3) không cần Sort
CREATE INDEX IX_KhachHang_DiemTichLuy
    ON KhachHang(DiemTichLuy DESC)
    INCLUDE (HoTen, Sdt, Email);
GO
 
-- Index 7: Tìm phim theo ngày khởi chiếu
-- Tác dụng: Truy vấn phim đang chiếu / sắp chiếu nhanh hơn
CREATE INDEX IX_Phim_NgayKhoiChieu
    ON Phim(NgayKhoiChieu)
    INCLUDE (TenPhim, DaoDien, ThoiLuong);
GO

-- STORED PROCEDURES THÊM / SỬA / XÓA / TÌM KIẾM --

-- SP: Thêm phim mới
CREATE OR ALTER PROCEDURE sp_ThemPhim
    @MaPhim        NVARCHAR(10),
    @TenPhim       NVARCHAR(200),
    @DaoDien       NVARCHAR(150),
    @QuocGia       NVARCHAR(100),
    @ThoiLuong     INT,
    @NgayKhoiChieu DATE,
    @MoTa          NVARCHAR(MAX) = NULL,
    @HinhAnh       NVARCHAR(500) = NULL,
    @DanhSachTL    NVARCHAR(500) = NULL   -- VD: 'TL01,TL02'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra mã phim đã tồn tại
        IF EXISTS (SELECT 1 FROM Phim WHERE MaPhim = @MaPhim)
        BEGIN
            ROLLBACK;
            SELECT -1 AS KetQua, N'Mã phim đã tồn tại!' AS ThongBao;
            RETURN;
        END
 
        INSERT INTO Phim (MaPhim, TenPhim, DaoDien, QuocGia, ThoiLuong,
                          NgayKhoiChieu, MoTa, HinhAnh)
        VALUES (@MaPhim, @TenPhim, @DaoDien, @QuocGia, @ThoiLuong,
                @NgayKhoiChieu, @MoTa, @HinhAnh);
 
        -- Thêm thể loại (nếu truyền vào)
        IF @DanhSachTL IS NOT NULL
        BEGIN
            DECLARE @tl NVARCHAR(10);
            DECLARE @xml XML = CAST('<r>' + REPLACE(@DanhSachTL, ',', '</r><r>') + '</r>' AS XML);
            INSERT INTO Phim_TheLoai (MaPhim, MaTheLoai)
            SELECT @MaPhim, T.c.value('.', 'NVARCHAR(10)')
            FROM @xml.nodes('/r') T(c)
            WHERE EXISTS (SELECT 1 FROM TheLoai WHERE MaTheLoai = T.c.value('.', 'NVARCHAR(10)'));
        END
 
        COMMIT;
        SELECT 1 AS KetQua, @MaPhim AS MaPhim, N'Thêm phim thành công!' AS ThongBao;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SELECT -1 AS KetQua, ERROR_MESSAGE() AS ThongBao;
    END CATCH
END
GO

-- SP: Cập nhật thông tin phim
CREATE OR ALTER PROCEDURE sp_SuaPhim
    @MaPhim        NVARCHAR(10),
    @TenPhim       NVARCHAR(200)   = NULL,
    @DaoDien       NVARCHAR(150)   = NULL,
    @QuocGia       NVARCHAR(100)   = NULL,
    @ThoiLuong     INT             = NULL,
    @NgayKhoiChieu DATE            = NULL,
    @MoTa          NVARCHAR(MAX)   = NULL,
    @HinhAnh       NVARCHAR(500)   = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Phim WHERE MaPhim = @MaPhim)
    BEGIN
        SELECT -1 AS KetQua, N'Không tìm thấy phim!' AS ThongBao;
        RETURN;
    END
 
    UPDATE Phim SET
        TenPhim       = ISNULL(@TenPhim,       TenPhim),
        DaoDien       = ISNULL(@DaoDien,       DaoDien),
        QuocGia       = ISNULL(@QuocGia,       QuocGia),
        ThoiLuong     = ISNULL(@ThoiLuong,     ThoiLuong),
        NgayKhoiChieu = ISNULL(@NgayKhoiChieu, NgayKhoiChieu),
        MoTa          = ISNULL(@MoTa,          MoTa),
        HinhAnh       = ISNULL(@HinhAnh,       HinhAnh)
    WHERE MaPhim = @MaPhim;
 
    SELECT 1 AS KetQua, N'Cập nhật phim thành công!' AS ThongBao;
END
GO
 
-- SP: Xóa phim (chỉ cho phép nếu chưa có suất chiếu)
CREATE OR ALTER PROCEDURE sp_XoaPhim
    @MaPhim NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Phim WHERE MaPhim = @MaPhim)
    BEGIN
        SELECT -1 AS KetQua, N'Không tìm thấy phim!' AS ThongBao;
        RETURN;
    END
 
    IF EXISTS (SELECT 1 FROM SuatChieu WHERE MaPhim = @MaPhim)
    BEGIN
        SELECT -1 AS KetQua,
               N'Không thể xóa: phim đã có suất chiếu hoặc vé đã bán!' AS ThongBao;
        RETURN;
    END
 
    BEGIN TRANSACTION;
    BEGIN TRY
        DELETE FROM Phim_TheLoai WHERE MaPhim = @MaPhim;
        DELETE FROM Phim          WHERE MaPhim = @MaPhim;
        COMMIT;
        SELECT 1 AS KetQua, N'Xóa phim thành công!' AS ThongBao;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SELECT -1 AS KetQua, ERROR_MESSAGE() AS ThongBao;
    END CATCH
END
GO
 
-- SP: Tìm kiếm phim (hỗ trợ nhiều tiêu chí)
CREATE OR ALTER PROCEDURE sp_TimKiemPhim
    @TenPhim    NVARCHAR(200) = NULL,
    @DaoDien    NVARCHAR(150) = NULL,
    @QuocGia    NVARCHAR(100) = NULL,
    @MaTheLoai  NVARCHAR(10)  = NULL,
    @TuNgay     DATE          = NULL,
    @DenNgay    DATE          = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT
        pm.MaPhim,
        pm.TenPhim,
        pm.DaoDien,
        pm.QuocGia,
        pm.ThoiLuong,
        pm.NgayKhoiChieu,
        STRING_AGG(tl.TenTheLoai, N', ') WITHIN GROUP (ORDER BY tl.TenTheLoai) AS TheLoai
    FROM Phim pm
    LEFT JOIN Phim_TheLoai ptl ON ptl.MaPhim    = pm.MaPhim
    LEFT JOIN TheLoai tl       ON tl.MaTheLoai  = ptl.MaTheLoai
    WHERE
        (@TenPhim   IS NULL OR pm.TenPhim   LIKE N'%' + @TenPhim   + N'%')
        AND (@DaoDien   IS NULL OR pm.DaoDien   LIKE N'%' + @DaoDien   + N'%')
        AND (@QuocGia   IS NULL OR pm.QuocGia   LIKE N'%' + @QuocGia   + N'%')
        AND (@MaTheLoai IS NULL OR ptl.MaTheLoai = @MaTheLoai)
        AND (@TuNgay    IS NULL OR pm.NgayKhoiChieu >= @TuNgay)
        AND (@DenNgay   IS NULL OR pm.NgayKhoiChieu <= @DenNgay)
    GROUP BY pm.MaPhim, pm.TenPhim, pm.DaoDien, pm.QuocGia,
             pm.ThoiLuong, pm.NgayKhoiChieu
    ORDER BY pm.NgayKhoiChieu DESC;
END
GO

-- SP QUẢN LÝ KHÁCH HÀNG

-- SP: Thêm khách hàng mới
CREATE OR ALTER PROCEDURE sp_ThemKhachHang
    @MaKH   NVARCHAR(10),
    @HoTen  NVARCHAR(150),
    @Sdt    NVARCHAR(15),
    @Email  NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM KhachHang WHERE MaKH = @MaKH)
    BEGIN
        SELECT -1 AS KetQua, N'Mã khách hàng đã tồn tại!' AS ThongBao; RETURN;
    END
    IF EXISTS (SELECT 1 FROM KhachHang WHERE Sdt = @Sdt)
    BEGIN
        SELECT -1 AS KetQua, N'Số điện thoại đã được đăng ký!' AS ThongBao; RETURN;
    END
 
    INSERT INTO KhachHang (MaKH, HoTen, Sdt, Email, DiemTichLuy)
    VALUES (@MaKH, @HoTen, @Sdt, @Email, 0);
 
    SELECT 1 AS KetQua, @MaKH AS MaKH, N'Thêm khách hàng thành công!' AS ThongBao;
END
GO
 
-- SP: Cập nhật thông tin khách hàng
CREATE OR ALTER PROCEDURE sp_SuaKhachHang
    @MaKH  NVARCHAR(10),
    @HoTen NVARCHAR(150) = NULL,
    @Sdt   NVARCHAR(15)  = NULL,
    @Email NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE MaKH = @MaKH)
    BEGIN
        SELECT -1 AS KetQua, N'Không tìm thấy khách hàng!' AS ThongBao; RETURN;
    END
 
    -- Kiểm tra số điện thoại mới không trùng khách khác
    IF @Sdt IS NOT NULL AND EXISTS (
        SELECT 1 FROM KhachHang WHERE Sdt = @Sdt AND MaKH <> @MaKH)
    BEGIN
        SELECT -1 AS KetQua, N'Số điện thoại đã được đăng ký!' AS ThongBao; RETURN;
    END
 
    UPDATE KhachHang SET
        HoTen = ISNULL(@HoTen, HoTen),
        Sdt   = ISNULL(@Sdt,   Sdt),
        Email = ISNULL(@Email, Email)
    WHERE MaKH = @MaKH;
 
    SELECT 1 AS KetQua, N'Cập nhật khách hàng thành công!' AS ThongBao;
END
GO
 
-- SP: Tìm kiếm khách hàng
CREATE OR ALTER PROCEDURE sp_TimKiemKhachHang
    @TuKhoa NVARCHAR(150) = NULL   -- tìm theo tên hoặc SĐT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM vw_ThongKeKhachHang
    WHERE @TuKhoa IS NULL
       OR HoTen LIKE N'%' + @TuKhoa + N'%'
       OR Sdt   LIKE N'%' + @TuKhoa + N'%'
    ORDER BY DiemTichLuy DESC;
END
GO

-- SP QUẢN LÝ SUẤT CHIẾU


-- SP: Thêm suất chiếu mới (có kiểm tra xung đột phòng/giờ)
CREATE OR ALTER PROCEDURE sp_ThemSuatChieu
    @MaSchieu   NVARCHAR(10),
    @MaPhim     NVARCHAR(10),
    @MaPhong    NVARCHAR(10),
    @NgayChieu  DATE,
    @ThoiGianBd TIME,
    @HeSoGia    DECIMAL(5,2) = 1.0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM SuatChieu WHERE MaSchieu = @MaSchieu)
        BEGIN ROLLBACK; SELECT -1 AS KetQua, N'Mã suất chiếu đã tồn tại!' AS ThongBao; RETURN; END
 
        -- Lấy thời lượng phim mới thêm
        DECLARE @ThoiLuong INT;
        SELECT @ThoiLuong = ThoiLuong FROM Phim WHERE MaPhim = @MaPhim;
        IF @ThoiLuong IS NULL
        BEGIN ROLLBACK; SELECT -1 AS KetQua, N'Mã phim không tồn tại!' AS ThongBao; RETURN; END
 
        DECLARE @TgBd   DATETIME = CAST(@NgayChieu AS DATETIME) + CAST(@ThoiGianBd AS DATETIME);
        DECLARE @TgKt   DATETIME = DATEADD(MINUTE, @ThoiLuong, @TgBd);
 
        -- Kiểm tra phòng có suất chiếu trùng giờ không
        IF EXISTS (
            SELECT 1 FROM SuatChieu sc2
            JOIN Phim pm2 ON pm2.MaPhim = sc2.MaPhim
            WHERE sc2.MaPhong = @MaPhong
              AND sc2.NgayChieu = @NgayChieu
              AND (
                    CAST(@NgayChieu AS DATETIME) + CAST(sc2.ThoiGianBd AS DATETIME) < @TgKt
                AND DATEADD(MINUTE, pm2.ThoiLuong,
                            CAST(@NgayChieu AS DATETIME) + CAST(sc2.ThoiGianBd AS DATETIME)) > @TgBd
              )
        )
        BEGIN
            ROLLBACK;
            SELECT -1 AS KetQua,
                   N'Phòng chiếu đã có suất chiếu trùng khung giờ này!' AS ThongBao;
            RETURN;
        END
 
        INSERT INTO SuatChieu (MaSchieu, MaPhim, MaPhong, NgayChieu, ThoiGianBd, HeSoGia)
        VALUES (@MaSchieu, @MaPhim, @MaPhong, @NgayChieu, @ThoiGianBd, @HeSoGia);
 
        COMMIT;
        SELECT 1 AS KetQua, @MaSchieu AS MaSchieu, N'Thêm suất chiếu thành công!' AS ThongBao;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SELECT -1 AS KetQua, ERROR_MESSAGE() AS ThongBao;
    END CATCH
END
GO
 
-- SP: Hủy suất chiếu (chỉ được hủy khi chưa bán vé)
CREATE OR ALTER PROCEDURE sp_HuySuatChieu
    @MaSchieu NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM SuatChieu WHERE MaSchieu = @MaSchieu)
    BEGIN SELECT -1 AS KetQua, N'Không tìm thấy suất chiếu!' AS ThongBao; RETURN; END
 
    IF EXISTS (SELECT 1 FROM Ve WHERE MaSchieu = @MaSchieu AND TrangThai = N'Đã đặt')
    BEGIN SELECT -1 AS KetQua, N'Không thể hủy: suất chiếu đã có vé được đặt!' AS ThongBao; RETURN; END
 
    DELETE FROM SuatChieu WHERE MaSchieu = @MaSchieu;
    SELECT 1 AS KetQua, N'Hủy suất chiếu thành công!' AS ThongBao;
END
GO
 
-- SP: Hủy vé (cập nhật trạng thái và hoàn điểm)
CREATE OR ALTER PROCEDURE sp_HuyVe
    @MaVe NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @TrangThai NVARCHAR(20), @MaKH NVARCHAR(10), @ThanhTien DECIMAL(12,0);
        SELECT @TrangThai = TrangThai, @MaKH = MaKH, @ThanhTien = ThanhTien
        FROM Ve WHERE MaVe = @MaVe;
 
        IF @TrangThai IS NULL
        BEGIN ROLLBACK; SELECT -1 AS KetQua, N'Không tìm thấy vé!' AS ThongBao; RETURN; END
 
        IF @TrangThai <> N'Đã đặt'
        BEGIN ROLLBACK; SELECT -1 AS KetQua, N'Vé này không ở trạng thái Đã đặt!' AS ThongBao; RETURN; END
 
        UPDATE Ve SET TrangThai = N'Đã hủy' WHERE MaVe = @MaVe;
 
        -- Hoàn điểm tích lũy
        UPDATE KhachHang
        SET DiemTichLuy = DiemTichLuy - CAST(@ThanhTien / 10000 AS INT)
        WHERE MaKH = @MaKH;
 
        COMMIT;
        SELECT 1 AS KetQua, N'Hủy vé thành công!' AS ThongBao;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SELECT -1 AS KetQua, ERROR_MESSAGE() AS ThongBao;
    END CATCH
END
GO






-- bài 6: PHÂN TÍCH SO SÁNH HIỆU NĂNG

-- Bật đo hiệu năng
SET STATISTICS IO  ON;
SET STATISTICS TIME ON;
GO


-- THỬ NGHIỆM: Tỷ lệ lấp đầy ghế theo suất chiếu

-- Phương án 1: Không dùng View (truy vấn thẳng — baseline)
PRINT N'=== TH1 BASELINE: Tỷ lệ lấp đầy — truy vấn thẳng ===';
SELECT
    sc.MaSchieu,
    pm.TenPhim,
    COUNT(DISTINCT g.MaGhe)  AS TongGhe,
    COUNT(DISTINCT v.MaVe)   AS GheDaDat,
    CAST(COUNT(DISTINCT v.MaVe) * 100.0
        / NULLIF(COUNT(DISTINCT g.MaGhe),0) AS DECIMAL(5,1)) AS TyLe
FROM SuatChieu sc
JOIN Phim pm ON pm.MaPhim = sc.MaPhim
JOIN Ghe g   ON g.MaPhong = sc.MaPhong
LEFT JOIN Ve v ON v.MaSchieu = sc.MaSchieu AND v.TrangThai = N'Đã đặt'
GROUP BY sc.MaSchieu, pm.TenPhim
ORDER BY TyLe DESC;
GO
 
-- Phương án 2: Dùng View (đã được index hỗ trợ)
PRINT N'=== TH2 QUA VIEW: vw_TinhTrangGhe ===';
SELECT
    MaSchieu,
    TenPhim,
    COUNT(MaGhe)                                           AS TongGhe,
    COUNT(CASE WHEN TrangThaiGhe = N'Đã đặt' THEN 1 END)  AS GheDaDat,
    CAST(COUNT(CASE WHEN TrangThaiGhe = N'Đã đặt' THEN 1 END) * 100.0
        / NULLIF(COUNT(MaGhe), 0) AS DECIMAL(5,1))         AS TyLe
FROM vw_TinhTrangGhe
GROUP BY MaSchieu, TenPhim
ORDER BY TyLe DESC;
GO



