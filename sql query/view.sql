USE CinemaDB
GO

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