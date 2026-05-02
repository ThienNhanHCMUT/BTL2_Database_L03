import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Home, Receipt } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import ETicket from '../components/checkout/ETicket';
import ProgressStepper from '../components/common/ProgressStepper';
import { requestJson } from '../services/api';

function mapBookingResponseToOrder(booking, fallbackOrder = null) {
  if (!booking) return fallbackOrder;

  const seats = Array.isArray(booking.tickets)
    ? booking.tickets.map((ticket) => ({
        row: ticket.seat?.row,
        col: ticket.seat?.col,
        label: ticket.seat?.label || `${ticket.seat?.row}${ticket.seat?.col}`,
        type: ticket.type || 'Thường',
        surcharge:
          fallbackOrder?.seats?.find((s) => s.label === ticket.seat?.label)?.surcharge || 1,
      }))
    : [];

  const combos = Array.isArray(booking.combos)
    ? booking.combos.map((combo) => ({
        productId: combo.productId,
        name: combo.name,
        quantity: combo.quantity,
        unitPrice: combo.unitPrice,
        subtotal: combo.subtotal,
      }))
    : [];

  return {
    ...(fallbackOrder || {}),
    orderId: booking.orderId,
    movie: booking.booking?.movie
      ? {
          ...(fallbackOrder?.movie || {}),
          movieId: booking.booking.movie.movieId,
          vnTitle: booking.booking.movie.vnTitle,
          originTitle: booking.booking.movie.originTitle,
        }
      : fallbackOrder?.movie || null,
    cinema: booking.booking?.cinema
      ? {
          ...(fallbackOrder?.cinema || {}),
          cinemaId: booking.booking.cinema.cinemaId,
          name: booking.booking.cinema.name,
          address: booking.booking.cinema.address,
          city: booking.booking.cinema.city,
        }
      : fallbackOrder?.cinema || null,
    showtime: booking.booking?.showtime
      ? {
          ...(fallbackOrder?.showtime || {}),
          showtimeId: booking.booking.showtime.showtimeId,
          startTime: booking.booking.showtime.startTime,
          language: booking.booking.showtime.language,
          format: booking.booking.showtime.format,
          roomNumber: booking.booking.showtime.roomNumber,
        }
      : fallbackOrder?.showtime || null,
    seats,
    combos,
    ticketTotal: booking.summary?.ticketTotal ?? fallbackOrder?.ticketTotal ?? 0,
    comboTotal: booking.summary?.comboTotal ?? fallbackOrder?.comboTotal ?? 0,
    discount: booking.summary?.discountAmount ?? fallbackOrder?.discount ?? 0,
    grandTotal: booking.summary?.grandTotal ?? fallbackOrder?.grandTotal ?? 0,
    transactionId: booking.payment?.transactionId || fallbackOrder?.transactionId || null,
    paymentStatus: booking.payment?.paymentStatus || fallbackOrder?.paymentStatus || null,
    paymentMethod: booking.payment?.paymentMethod || fallbackOrder?.paymentMethod || null,
    voucherId: booking.voucher?.voucherId || fallbackOrder?.voucherId || null,
    createdAt: booking.orderDate || fallbackOrder?.createdAt || new Date().toISOString(),
    tickets: booking.tickets || fallbackOrder?.tickets || [],
    customer: fallbackOrder?.customer || null,
  };
}

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { order, resetBooking } = useBooking();

  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveOrderId = orderId || order?.orderId || null;

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!effectiveOrderId && !order) {
      navigate('/');
      return;
    }

    if (!effectiveOrderId) return;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await requestJson(`/bookings/${effectiveOrderId}`);

        setBookingData(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [effectiveOrderId, order, navigate]);

  const displayOrder = useMemo(() => {
    if (bookingData) {
      return mapBookingResponseToOrder(bookingData, order || null);
    }
    return order || null;
  }, [bookingData, order]);

  if (!displayOrder && loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <ProgressStepper currentStep={6} />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-400">
          Đang tải vé điện tử...
        </div>
      </motion.div>
    );
  }

  if (!displayOrder) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <ProgressStepper currentStep={6} />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-red-400 mb-4">{error || 'Không tìm thấy thông tin vé'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </motion.div>
    );
  }

  const handleDone = () => {
    resetBooking();
    navigate('/');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ProgressStepper currentStep={6} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-4 border-green-500 mb-4">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
            Vé điện tử
          </h1>
          <p className="text-gray-400">
            Đây là vé điện tử của bạn. Vui lòng xuất trình mã QR khi cần check-in.
          </p>
        </motion.div>

        {error && (
          <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm">
            Không thể đồng bộ lại toàn bộ dữ liệu từ server: {error}
          </div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ETicket order={displayOrder} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-md mx-auto mt-8 flex flex-col sm:flex-row gap-3"
        >
          <Link
            to={`/booking/${displayOrder.orderId}`}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-dark-800 hover:bg-dark-700 border border-white/10 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <Receipt size={16} /> Xem chi tiết đơn
          </Link>
          <button
            onClick={handleDone}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <Home size={16} /> Về trang chủ
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
