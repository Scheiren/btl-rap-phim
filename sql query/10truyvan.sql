USE CinemaDB;
GO


 -- Truy vấn 1: Danh sách phim đang chiếu hôm nay
WITH FilmToday AS
(
    SELECT
        pm.MaPhim,
        pm.TenPhim,
        pm.DaoDien,
        pm.ThoiLuong,
        sc.MaSchieu,
        r.TenRap
    FROM Phim pm
    JOIN SuatChieu sc ON sc.MaPhim = pm.MaPhim
    JOIN Phong p ON p.MaPhong = sc.MaPhong
    JOIN RapChieuPhim r ON r.MaRap = p.MaRap
    WHERE sc.NgayChieu = CAST(GETDATE() AS DATE)
),
ShowCount AS
(
    SELECT
        MaPhim,
        COUNT(DISTINCT MaSchieu) AS SoSuatChieu
    FROM FilmToday
    GROUP BY MaPhim
),
RapList AS
(
    SELECT DISTINCT
        MaPhim,
        TenRap
    FROM FilmToday
)
SELECT
    f.MaPhim,
    f.TenPhim,
    f.DaoDien,
    f.ThoiLuong,
    s.SoSuatChieu,
    STRING_AGG(r.TenRap, N', ') AS DanhSachRap
FROM
(
    SELECT DISTINCT
        MaPhim, TenPhim, DaoDien, ThoiLuong
    FROM FilmToday
) f
JOIN ShowCount s ON s.MaPhim = f.MaPhim
JOIN RapList r ON r.MaPhim = f.MaPhim
GROUP BY
    f.MaPhim, f.TenPhim, f.DaoDien, f.ThoiLuong, s.SoSuatChieu
ORDER BY s.SoSuatChieu DESC;
GO

--  Truy vấn 2: Doanh thu từng phim theo từng rạp

SELECT
    r.TenRap,
    pm.TenPhim,
    COUNT(v.MaVe)        AS TongVeDaBan,
    SUM(v.ThanhTien)     AS DoanhThu,
    AVG(v.ThanhTien)     AS GiaTrungBinh
FROM Ve v
JOIN SuatChieu sc       ON sc.MaSchieu = v.MaSchieu
JOIN Phim pm            ON pm.MaPhim   = sc.MaPhim
JOIN Phong p            ON p.MaPhong   = sc.MaPhong
JOIN RapChieuPhim r     ON r.MaRap     = p.MaRap
WHERE v.TrangThai = N'Đã đặt'
GROUP BY r.TenRap, pm.TenPhim
ORDER BY r.TenRap, DoanhThu DESC;
GO

-- Truy vấn 3: Top 5 khách hàng có điểm tích lũy cao nhất

SELECT TOP 5
    kh.MaKH,
    kh.HoTen,
    kh.Sdt,
    kh.Email,
    kh.DiemTichLuy,
    COUNT(v.MaVe)    AS TongVeDaMua,
    SUM(v.ThanhTien) AS TongChiTieu
FROM KhachHang kh
LEFT JOIN Ve v ON v.MaKH = kh.MaKH AND v.TrangThai = N'Đã đặt'
GROUP BY kh.MaKH, kh.HoTen, kh.Sdt, kh.Email, kh.DiemTichLuy
ORDER BY kh.DiemTichLuy DESC;
GO


-- Truy vấn 4: Tỷ lệ lấp đầy ghế (occupancy rate) theo suất chiếu

SELECT
    sc.MaSchieu,
    pm.TenPhim,
    p.TenPhong,
    r.TenRap,
    sc.NgayChieu,
    sc.ThoiGianBd,
    COUNT(DISTINCT g.MaGhe)                                        AS TongGhe,
    COUNT(DISTINCT v.MaVe)                                         AS GheDaDat,
    COUNT(DISTINCT g.MaGhe) - COUNT(DISTINCT v.MaVe)              AS GheTrong,
    CAST(COUNT(DISTINCT v.MaVe) * 100.0
         / NULLIF(COUNT(DISTINCT g.MaGhe), 0) AS DECIMAL(5,1))    AS TyLeLapDay_Pct
FROM SuatChieu sc
JOIN Phim pm        ON pm.MaPhim  = sc.MaPhim
JOIN Phong p        ON p.MaPhong  = sc.MaPhong
JOIN RapChieuPhim r ON r.MaRap    = p.MaRap
JOIN Ghe g          ON g.MaPhong  = sc.MaPhong
LEFT JOIN Ve v      ON v.MaSchieu = sc.MaSchieu
                   AND v.MaPhong  = g.MaPhong
                   AND v.ViTri    = g.ViTri
                   AND v.TrangThai = N'Đã đặt'
GROUP BY sc.MaSchieu, pm.TenPhim, p.TenPhong, r.TenRap, sc.NgayChieu, sc.ThoiGianBd
ORDER BY TyLeLapDay_Pct DESC;
GO


-- Truy vấn 5: in ra các thể loại phim được sắp xếp theo số lượng vé

SELECT
    tl.TenTheLoai,
    COUNT(v.MaVe)    AS TongVe,
    SUM(v.ThanhTien) AS TongDoanhThu
FROM TheLoai tl
JOIN Phim_TheLoai ptl ON ptl.MaTheLoai = tl.MaTheLoai
JOIN Phim pm          ON pm.MaPhim     = ptl.MaPhim
JOIN SuatChieu sc     ON sc.MaPhim     = pm.MaPhim
JOIN Ve v             ON v.MaSchieu    = sc.MaSchieu
                      AND v.TrangThai = N'Đã đặt'
GROUP BY tl.MaTheLoai, tl.TenTheLoai
ORDER BY TongVe DESC;
GO

-- Truy vấn 6: Danh sách suất chiếu còn ghế trống trong 7 ngày tới, sắp xếp theo ngày và giờ

USE CinemaDB;
GO

WITH ThongTinSuatChieu AS
(
    SELECT
        sc.MaSchieu,
        pm.TenPhim,
        r.TenRap,
        p.TenPhong,
        sc.NgayChieu,
        sc.ThoiGianBd,
        DATEADD(MINUTE, pm.ThoiLuong, CAST(sc.ThoiGianBd AS DATETIME)) AS ThoiGianKetThuc,
        sc.HeSoGia,
        (SELECT COUNT(*) FROM Ghe WHERE MaPhong = sc.MaPhong) AS TongGhe,
        (SELECT COUNT(*)
         FROM Ve
         WHERE MaSchieu = sc.MaSchieu
           AND TrangThai = N'Đã đặt') AS GheDaDat
    FROM SuatChieu sc
    JOIN Phim pm ON pm.MaPhim = sc.MaPhim
    JOIN Phong p ON p.MaPhong = sc.MaPhong
    JOIN RapChieuPhim r ON r.MaRap = p.MaRap
    WHERE sc.NgayChieu BETWEEN CAST(GETDATE() AS DATE)
                           AND DATEADD(DAY, 7, CAST(GETDATE() AS DATE))
)
SELECT
    MaSchieu,
    TenPhim,
    TenRap,
    TenPhong,
    NgayChieu,
    ThoiGianBd,
    ThoiGianKetThuc,
    HeSoGia,
    TongGhe,
    GheDaDat,
    TongGhe - GheDaDat AS GheTrong
FROM ThongTinSuatChieu
WHERE TongGhe - GheDaDat > 0
ORDER BY NgayChieu, ThoiGianBd;
GO


-- Truy vấn 7: Lịch sử đặt vé của một khách hàng cụ thể (KH003)

SELECT
    v.MaVe,
    v.NgayDat,
    pm.TenPhim,
    r.TenRap,
    p.TenPhong,
    sc.NgayChieu,
    sc.ThoiGianBd,
    g.ViTri,
    g.LoaiGhe,
    v.ThanhTien,
    v.TrangThai
FROM Ve v
JOIN SuatChieu sc       ON sc.MaSchieu = v.MaSchieu
JOIN Phim pm            ON pm.MaPhim   = sc.MaPhim
JOIN Phong p            ON p.MaPhong   = v.MaPhong
JOIN RapChieuPhim r     ON r.MaRap     = p.MaRap
JOIN Ghe g              ON g.MaPhong   = v.MaPhong
                       AND g.ViTri     = v.ViTri
WHERE v.MaKH = 'KH003'
ORDER BY v.NgayDat DESC;
GO
 
-- Truy vấn 8: Báo cáo doanh thu theo thành phố và theo tháng

SELECT
    tp.TenTP,
    YEAR(sc.NgayChieu)  AS Nam,
    MONTH(sc.NgayChieu) AS Thang,
    COUNT(v.MaVe)       AS TongVe,
    SUM(v.ThanhTien)    AS DoanhThu
FROM ThanhPho tp
JOIN RapChieuPhim r ON r.MaTP    = tp.MaTP
JOIN Phong p        ON p.MaRap   = r.MaRap
JOIN SuatChieu sc   ON sc.MaPhong = p.MaPhong
JOIN Ve v           ON v.MaSchieu = sc.MaSchieu
                   AND v.TrangThai = N'Đã đặt'
GROUP BY tp.TenTP, YEAR(sc.NgayChieu), MONTH(sc.NgayChieu)
ORDER BY tp.TenTP, Nam, Thang;
GO

-- Truy vấn 9: Phòng chiếu nào có tỷ lệ sử dụng cao nhất (tổng số vé / (tổng ghế × số suất chiếu))
SELECT
    p.MaPhong,
    p.TenPhong,
    r.TenRap,
    tp.TenTP,
    COUNT(DISTINCT sc.MaSchieu)              AS TongSuatChieu,
    COUNT(DISTINCT g.MaGhe)                 AS TongGhe,
    COUNT(v.MaVe)                           AS TongVeDaBan,
    COUNT(DISTINCT sc.MaSchieu) * COUNT(DISTINCT g.MaGhe)  AS NangSuatToiDa,
    CAST(COUNT(v.MaVe) * 100.0 /
         NULLIF(COUNT(DISTINCT sc.MaSchieu) * COUNT(DISTINCT g.MaGhe), 0)
         AS DECIMAL(5,1))                   AS TyLeSuDung_Pct
FROM Phong p
JOIN RapChieuPhim r    ON r.MaRap   = p.MaRap
JOIN ThanhPho tp        ON tp.MaTP   = r.MaTP
JOIN Ghe g              ON g.MaPhong = p.MaPhong
LEFT JOIN SuatChieu sc  ON sc.MaPhong = p.MaPhong
LEFT JOIN Ve v          ON v.MaSchieu = sc.MaSchieu
                       AND v.TrangThai = N'Đã đặt'
GROUP BY p.MaPhong, p.TenPhong, r.TenRap, tp.TenTP
ORDER BY TyLeSuDung_Pct DESC;
GO

-- Truy vấn 10: Ghế VIP vs Thường — so sánh doanh thu và số lượng đặt theo từng rạp

SELECT
    r.TenRap,
    g.LoaiGhe,
    COUNT(v.MaVe)    AS TongVe,
    SUM(v.ThanhTien) AS TongDoanhThu,
    AVG(v.ThanhTien) AS GiaTrungBinh,
    MIN(v.ThanhTien) AS GiaThapNhat,
    MAX(v.ThanhTien) AS GiaCaoNhat
FROM Ghe g
JOIN Phong p            ON p.MaPhong  = g.MaPhong
JOIN RapChieuPhim r     ON r.MaRap    = p.MaRap
JOIN Ve v               ON v.MaPhong  = g.MaPhong
                       AND v.ViTri    = g.ViTri
                       AND v.TrangThai = N'Đã đặt'
GROUP BY r.TenRap, g.LoaiGhe
ORDER BY r.TenRap, g.LoaiGhe;
GO