# Backend Setup & API List

## 1) Kết nối SQL Server
Dự án dùng cấu hình trong file `.env` và đọc tại `src/config/db.js`.

Bạn sửa file `.env` để đúng thông tin SQL Server trên máy của bạn:

```env
PORT=5000

DB_USER=backend_user
DB_PASSWORD=Backend@12345
DB_SERVER=localhost
DB_DATABASE=BTL2
DB_PORT=1433
```

Lưu ý:
- `DB_SERVER`: đổi thành đúng tên server SQL của bạn (ví dụ: `localhost`, `DESKTOP-ABC123`, hoặc `localhost\\SQLEXPRESS`).
- `DB_DATABASE`: đổi thành đúng tên database bạn đang dùng.
- `DB_USER` / `DB_PASSWORD`: tài khoản đăng nhập SQL Server.
- `DB_PORT`: thường là `1433`.

## 2) Cài package và chạy server
Trong thư mục backend, chạy lần lượt:

```bash
npm install
npm run dev
```

Sau khi chạy thành công, terminal sẽ hiện:

```text
Server running at http://localhost:5000
```

## 3) Ấn vô localhost
Mở trình duyệt và truy cập:

- `http://localhost:5000`

Nên test thêm nhanh:

- `http://localhost:5000/health`

---

## Danh sách đầy đủ API trong dự án
Base URL mặc định:

- `http://localhost:5000`

### Health
- `GET /health`

### Root
- `GET /`

### Products
- `GET /products`
- `GET /products/:productId`

### Movies
- `GET /movies`
- `GET /movies/:movieId`
- `GET /movies/:movieId/showtimes`

### Showtimes
- `GET /showtimes/:showtimeId/seats`
- (dùng ở page user chọn ghế ngồi)


### Promotions
- `POST /promotions/validate`
- `GET /promotions/active`

### Bookings
- `POST /bookings/hold-seats`
- `POST /bookings/calculate-price`
- `POST /bookings/confirm`
- `GET /bookings/:orderId`

### Genres
- `GET /genres`

### Cinemas / Rooms
- `GET /cinemas`
- `GET /cinemas/:cinemaId`
- `GET /rooms/:cinemaId/:roomNumber/seats`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me` (cần token)

### Users
- `GET /users/me/bookings` (cần token)

---

## API cần token
Các API cần đăng nhập:
- `GET /auth/me`
- `GET /users/me/bookings`

Gửi token qua header:

```http
Authorization: Bearer <access_token>
```
