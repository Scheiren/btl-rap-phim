# Bài 5:
## 5.1. 10 Truy vấn nghiệp vụ (10truyvan.sql):
|STT| Nội dung|
|:-:|:--|
|1|Phim đang chiếu hôm nay + số suất + tên rạp|
|2|Doanh thu từng phim theo từng rạp|
|3|Top 5 khách VIP theo điểm tích lũy|
|4|Tỷ lệ lấp đầy ghế (occupancy rate) mỗi suất|
|5|Thể loại phim được đặt vé nhiều nhất|
|6|Suất chiếu còn ghế trống trong 7 ngày tới|
|7|Lịch sử đặt vé chi tiết của khách hàng|
|8|Doanh thu theo thành phố và tháng|
|9|Phòng chiếu có tỷ lệ sử dụng cao nhất|
|10|So sánh doanh thu VIP vs Thường theo rạp|
## 5.2. View để xử lý truy vấn phức tạp (view.sql): 

- 5 Views: 
    - vw_SuatChieuChiTiet
    - vw_VeChiTiet 
    - vw_DoanhThuTheoPhim 
    - vw_TinhTrangGhe
    - vw_ThongKeKhachHang
## 5.3. tạo Index tăng tốc độ truy vấn (view.sql):
7 Indexes bổ sung: Tất cả là composite/covering index trên bảng Ve và SuatChieu
## 5.4. Stored procedue cho thêm sửa xoá tìm kiếm:
- sp_DoanhThuTheoRap
- sp_GheTrongSuatChieu
- sp_HuySuatChieu
- sp_HuyVe
- sp_SuaKhachHang
- sp_SuaPhim
- sp_TimKiemKhachHang
- sp_TimKiemPhim
- sp_ThemKhachHang
- sp_ThemPhim
- sp_ThemSuatChieu
- sp_XoaPhim

# Bài 6: Phân tích so sánh hiệu năng: trước và sau khi thêm index/view/procedure.
# Thử nghiệm: Tỷ lệ lấp đầy ghế theo suất chiếu

## Trường hợp 1 (baseline) - query trực tiếp:
Elapsed time: 4 ms\
Logical reads:\
- Worktable: 1079 reads (rất cao)
- Ghe: 25
- Phim: 24
- SuatChieu: 2
- Ve: 2

## Trường hợp 2 - Qua view vw_TinhTrangGhe:
Elapsed time: 2 ms\
Logical reads:\
- KHÔNG còn Worktable reads
- Các bảng khác y hệt


## So sánh tổng quan:

| Tiêu chí           | TH1 (Trực tiếp) | TH2 (View)    |
| ------------------ | -------------- | ------------ |
| Elapsed Time       | 4 ms           | 2 ms         |
| CPU Time           | 0 ms           | 0 ms         |
| Worktable Reads    | 1079         | 0          |
| Reads bảng dữ liệu | ≈ giống nhau   | ≈ giống nhau |
| Warning NULL       | Có             | Có           |

## Giải thích:
Trường hợp 2 nhanh hơn vì:
- Cấu trúc view:
  - rõ ràng hơn
  - ít expression lặp
- Optimizer:
  - loại bỏ được Worktable
  - chọn execution plan tốt hơn