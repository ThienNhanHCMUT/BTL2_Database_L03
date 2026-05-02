const express = require("express");
const cors = require("cors");
require("dotenv").config({ quiet: true });

const { connectDB } = require("./config/db");

const healthRoutes = require("./routes/health.routes");
const productRoutes = require("./routes/product.routes");
const customerRoutes = require("./routes/customer.routes");
const movieRoutes = require("./routes/movie.routes");
const showtimeRoutes = require("./routes/showtime.routes");
const promotionRoutes = require("./routes/promotion.routes");
const bookingRoutes = require("./routes/booking.routes");
const genreRoutes = require("./routes/genre.routes");
const cinemaRoutes = require("./routes/cinema.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const eventRoutes = require("./routes/event.routes");
const organizerSummaryRoutes = require("./routes/organizerSummary.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);

app.use("/api/products", productRoutes);
app.use("/products", productRoutes);

app.use("/api/customers", customerRoutes);
app.use("/customers", customerRoutes);

app.use("/movies", movieRoutes);
app.use("/showtimes", showtimeRoutes);
app.use("/promotions", promotionRoutes);
app.use("/bookings", bookingRoutes);
app.use("/genres", genreRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.use("/api/events", eventRoutes);
app.use("/events", eventRoutes);

app.use("/api/event-organizer-summary", organizerSummaryRoutes);
app.use("/event-organizer-summary", organizerSummaryRoutes);

app.use("/", cinemaRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Backend đang chạy",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  const status = err.status || err.statusCode || 500;

  return res.status(status).json({
    message: err.message || "Internal server error",
    error: err.message || "Internal server error",
    code: err.code || "INTERNAL_SERVER_ERROR",
    fieldErrors: err.fieldErrors || null,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);

  connectDB()
    .then(() => {
      console.log("Database connection is ready");
    })
    .catch((err) => {
      console.error("Database connection is not ready:", err.message);
    });
});