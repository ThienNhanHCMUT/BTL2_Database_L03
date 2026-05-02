import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ShowtimePage from './pages/ShowtimePage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import ComboPage from './pages/ComboPage';
import CheckoutPage from './pages/CheckoutPage';
import ConfirmationPage from './pages/ConfirmationPage';
import BookingDetailPage from './pages/BookingDetailPage';
import CinemasPage from './pages/CinemasPage';
import CinemaDetailPage from './pages/CinemaDetailPage';
import RoomSeatsPage from './pages/RoomSeatsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EventManagementPage from './pages/EventManagementPage';
import EventOrganizerSummaryPage from './pages/EventOrganizerSummaryPage';
import EventAnalyticsPage from './pages/EventAnalyticsPage';
import ProductManagementPage from './pages/ProductManagementPage';
import ProductSalesReportPage from './pages/ProductSalesReportPage';
import CustomerNetValuePage from './pages/CustomerNetValuePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-white">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movie/:movieId" element={<MovieDetailPage />} />

            <Route path="/cinemas" element={<CinemasPage />} />
            <Route path="/cinemas/:cinemaId" element={<CinemaDetailPage />} />
            <Route path="/rooms/:cinemaId/:roomNumber/seats" element={<RoomSeatsPage />} />

            <Route path="/booking/showtime/:movieId" element={<ShowtimePage />} />
            <Route path="/booking/seats/:showtimeId" element={<SeatSelectionPage />} />
            <Route path="/booking/combo" element={<ComboPage />} />
            <Route path="/booking/checkout" element={<CheckoutPage />} />

            <Route path="/booking/:orderId" element={<BookingDetailPage />} />
            <Route path="/booking/confirmation" element={<ConfirmationPage />} />
            <Route path="/booking/confirmation/:orderId" element={<ConfirmationPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/events" element={<EventManagementPage />} />
            <Route path="/event-organizer-summary" element={<EventOrganizerSummaryPage />} />
            <Route path="/event-analytics" element={<EventAnalyticsPage />} />
            <Route path="/products-management" element={<ProductManagementPage />} />
            <Route path="/product-sales-summary" element={<ProductSalesReportPage />} />
            <Route path="/customer-net-value" element={<CustomerNetValuePage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
