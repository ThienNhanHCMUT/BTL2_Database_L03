# 🎬 MovieTicket — Frontend Web App
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned


> Dự án đặt vé xem phim trực tuyến — Môn Hệ CSDL, Nhóm 4, ĐHBK TP.HCM

## 🚀 Bắt đầu

### Yêu cầu
- **Node.js** ≥ 18.0 ([tải tại đây](https://nodejs.org))
- **npm** ≥ 9.0 (có sẵn khi cài Node.js)

### Cài đặt & chạy

```bash
# 1. Cài dependencies (lần đầu)
npm install

# 2. API backend mặc định
# .env đã trỏ VITE_API_BASE_URL=http://localhost:5000

# 3. Chạy dev server
npm run dev
```

Sau đó mở trình duyệt tại **http://localhost:5173**

### Build production

```bash
npm run build      # Tạo thư mục dist/
npm run preview    # Preview bản build
```

## 🛠️ Tech Stack

- **React 18** + **Vite 6** — SPA, HMR nhanh
- **React Router v6** — client-side routing
- **Tailwind CSS v4** — utility-first styling, dark theme
- **Framer Motion** — page transitions, animations
- **Lucide React** — icon library
- **React Context + useReducer** — state management

## 📁 Cấu trúc dự án

```
movieticket/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── common/           # Navbar, Footer, Badge, Timer, ProgressStepper
│   │   ├── movie/            # MovieCard
│   │   ├── booking/          # SeatMap, ShowtimeGrid, DatePicker, BookingSummary
│   │   ├── combo/            # ComboCard
│   │   └── checkout/         # PaymentMethods, ETicket
│   ├── pages/                # Tất cả các trang
│   ├── context/              # BookingContext, AuthContext
│   ├── data/                 # Mock JSON (chuyển từ FULL.sql)
│   ├── hooks/                # useCountdown
│   ├── utils/                # Helpers & constants
│   ├── styles/index.css      # Global Tailwind + custom CSS
│   ├── App.jsx               # Router root
│   └── main.jsx              # Entry point
├── index.html
├── vite.config.js
├── tailwind.config.js (không cần — dùng @theme trong CSS)
└── package.json
```

## 🎯 Flow đặt vé

```
Trang chủ → Danh sách phim → Chi tiết phim →
Chọn rạp + giờ → Chọn ghế ⭐ → Combo bắp nước →
Thanh toán → E-Ticket (QR code)
```

## 🗺️ Routes

| Path                                | Page                |
|-------------------------------------|---------------------|
| `/`                                 | HomePage            |
| `/movies`                           | MoviesPage          |
| `/movie/:movieId`                   | MovieDetailPage     |
| `/booking/showtime/:movieId`        | ShowtimePage        |
| `/booking/seats/:showtimeId`        | SeatSelectionPage ⭐ |
| `/booking/combo`                    | ComboPage           |
| `/booking/checkout`                 | CheckoutPage        |
| `/booking/confirmation`             | ConfirmationPage    |
| `/cinemas`                          | CinemasPage         |
| `/login`                            | LoginPage           |

## 🧪 Test accounts

Để đăng nhập, dùng một trong các username sau (password bất kỳ):
- `nguyenvana`
- `tranthib`

## 🎟️ Mã giảm giá để test

- `SV50` — Giảm 50k cho sinh viên
- `NEWUSER` — Giảm 30k cho người mới
- `HAPPYHOUR` — Giảm 10% tổng hóa đơn

## 💡 Công thức tính giá vé

```
Giá 1 vé = BasePrice × PolicyMultiplier × SeatSurcharge

Ví dụ:
  Base 75,000đ × 1.2 (cuối tuần) × 1.5 (VIP) = 135,000đ
```

## 📊 Mapping SQL → Frontend

| SQL Table           | Frontend Data File    | Dùng ở đâu               |
|---------------------|-----------------------|---------------------------|
| MOVIE, GENRE, ACTOR | `src/data/movies.json`| MovieCard, MovieDetailPage|
| CINEMA, ROOM        | `src/data/cinemas.json`| ShowtimePage, CinemasPage|
| SHOWTIME            | `src/data/showtimes.json`| ShowtimeGrid           |
| SEAT                | `utils/seatUtils.js` (generate) | SeatMap         |
| PRODUCT             | `src/data/products.json`| ComboCard              |
| PRICING_POLICY      | `utils/priceCalculator.js` | Auto apply         |

## 🎨 Design System

- **Font chính:** Be Vietnam Pro (body), Dela Gothic One (headings)
- **Màu chủ đạo:** Đỏ rạp phim (`#E50914`) + Vàng (`#FFD700`) trên dark theme
- **Breakpoints:** sm:640 / md:768 / lg:1024 / xl:1280

## ⚠️ Lưu ý

- Frontend hiện gọi backend Express qua `VITE_API_BASE_URL`
- Dữ liệu phim/rạp/suất chiếu/ghế/combo/đơn hàng lấy từ SQL Server qua API
- Timer 10 phút giữ ghế bắt đầu từ lúc chọn suất chiếu
- LocalStorage dùng để lưu trạng thái đăng nhập

## 📚 Tham khảo

- Figma: [Cinema City](https://www.figma.com/community/file/1343177833673552909)
- Inspired by: CGV Vietnam, Galaxy Cinema, TIX ID

---

Made with ❤️ by Nhóm 4 — HK2 2025-2026
