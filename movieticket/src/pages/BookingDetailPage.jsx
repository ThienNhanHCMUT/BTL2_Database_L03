import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Ticket,
  MapPin,
  Calendar,
  Clock,
  Armchair,
  CreditCard,
  Receipt,
  Gift,
  Popcorn,
  Home,
  Film,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { formatDateVi, formatTime, formatWeekday } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
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
    rawBooking: booking,
  };
}

export default function BookingDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, resetBooking } = useBooking();

  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await requestJson(`/bookings/${orderId}`);

        setBookingData(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchBooking();
    }
  }, [orderId]);

  const displayOrder = useMemo(() => {
    if (bookingData) {
      return mapBookingResponseToOrder(bookingData, order || null);
    }
    return order || null;
  }, [bookingData, order]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">
          Đang tải chi tiết đơn hàng...
        </div>
      </motion.div>
    );
  }

  if (!displayOrder) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <p className="text-red-400 mb-4">{error || 'Không tìm thấy đơn hàng'}</p>
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

  const booking = displayOrder.rawBooking || null;
  const seatLabels = displayOrder.seats?.map((s) => s.label).join(', ') || '—';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
            Chi tiết đơn hàng
          </h1>
          <p className="text-gray-400">
            Mã đơn: <span className="text-white font-medium">{displayOrder.orderId}</span>
          </p>
        </div>

        <div className="grid gap-6">
          <section className="bg-dark-800 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={18} className="text-primary" />
              <h2 className="font-semibold text-white">Thông tin đơn</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Mã đơn hàng" value={displayOrder.orderId} />
              <InfoRow
                label="Ngày tạo"
                value={
                  displayOrder.createdAt
                    ? `${formatWeekday(displayOrder.createdAt)}, ${formatDateVi(displayOrder.createdAt)} ${formatTime(displayOrder.createdAt)}`
                    : '—'
                }
              />
              <InfoRow
                label="Trạng thái thanh toán"
                value={displayOrder.paymentStatus || '—'}
              />
              <InfoRow
                label="Phương thức thanh toán"
                value={displayOrder.paymentMethod || '—'}
              />
              <InfoRow
                label="Mã giao dịch"
                value={displayOrder.transactionId || '—'}
              />
              <InfoRow
                label="Voucher"
                value={displayOrder.voucherId || 'Không áp dụng'}
              />
            </div>
          </section>

          <section className="bg-dark-800 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Ticket size={18} className="text-primary" />
              <h2 className="font-semibold text-white">Thông tin vé xem phim</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-2xl font-display text-white mb-1">
                  {displayOrder.movie?.vnTitle || '—'}
                </p>
                <p className="text-sm text-gray-400">
                  {displayOrder.showtime?.format || '—'} •{' '}
                  {displayOrder.showtime?.language || '—'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Detail icon={MapPin} label="Rạp" value={displayOrder.cinema?.name || '—'} />
                <Detail
                  icon={Calendar}
                  label="Ngày"
                  value={
                    displayOrder.showtime?.startTime
                      ? `${formatWeekday(displayOrder.showtime.startTime)}, ${formatDateVi(displayOrder.showtime.startTime)}`
                      : '—'
                  }
                />
                <Detail
                  icon={Clock}
                  label="Giờ chiếu"
                  value={
                    displayOrder.showtime?.startTime
                      ? formatTime(displayOrder.showtime.startTime)
                      : '—'
                  }
                />
                <Detail
                  icon={Armchair}
                  label="Phòng"
                  value={displayOrder.showtime?.roomNumber || '—'}
                />
              </div>

              <div className="bg-dark-900/50 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-gray-400 mb-1">Địa chỉ rạp</p>
                <p className="text-white">{displayOrder.cinema?.address || '—'}</p>
              </div>

              <div className="bg-dark-900/50 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-gray-400 mb-1">Ghế đã đặt</p>
                <p className="text-white font-semibold">{seatLabels}</p>
              </div>
            </div>
          </section>

          <section className="bg-dark-800 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Popcorn size={18} className="text-primary" />
              <h2 className="font-semibold text-white">Combo bắp nước</h2>
            </div>

            {Array.isArray(displayOrder.combos) && displayOrder.combos.length > 0 ? (
              <div className="space-y-3">
                {displayOrder.combos.map((combo) => (
                  <div
                    key={`${combo.productId}-${combo.orderDetailId}`}
                    className="flex items-center justify-between gap-4 bg-dark-900/50 rounded-xl p-4 border border-white/5"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {combo.name} × {combo.quantity}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatCurrency(combo.unitPrice)} / món
                      </p>
                    </div>
                    <p className="text-white font-semibold">
                      {formatCurrency(combo.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Không có combo đi kèm.</p>
            )}
          </section>

          <section className="bg-dark-800 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-primary" />
              <h2 className="font-semibold text-white">Thanh toán & tổng kết</h2>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="Tiền vé" value={formatCurrency(displayOrder.ticketTotal || 0)} />
              <Row label="Tiền combo" value={formatCurrency(displayOrder.comboTotal || 0)} />
              <Row
                label="Giảm giá"
                value={
                  displayOrder.discount > 0
                    ? `- ${formatCurrency(displayOrder.discount)}`
                    : formatCurrency(0)
                }
                valueClass={displayOrder.discount > 0 ? 'text-green-400' : 'text-white'}
              />
              <div className="border-t border-white/10 pt-3 mt-3 flex items-center justify-between">
                <span className="text-white font-semibold text-lg">Tổng cộng</span>
                <span className="text-primary font-bold text-3xl">
                  {formatCurrency(displayOrder.grandTotal || 0)}
                </span>
              </div>
            </div>

            {booking?.voucher?.voucherId && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={16} className="text-green-400" />
                  <span className="text-green-300 font-medium">Voucher đã áp dụng</span>
                </div>
                <p className="text-sm text-green-200">
                  {booking.voucher.voucherId} — giảm {formatCurrency(booking.voucher.discountAmount || 0)}
                </p>
              </div>
            )}
          </section>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              to={`/booking/confirmation/${displayOrder.orderId}`}
              className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <Ticket size={16} /> Xem vé điện tử
            </Link>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-dark-800 hover:bg-dark-700 border border-white/10 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <Receipt size={16} /> Tải bill
            </button>

            <Link
              to="/movies"
              onClick={resetBooking}
              className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-dark-800 hover:bg-dark-700 border border-white/10 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <Film size={16} /> Đặt vé phim khác
            </Link>

            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-dark-800 hover:bg-dark-700 border border-white/10 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <Home size={16} /> Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="bg-dark-900/40 rounded-xl p-4 border border-white/5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white font-medium break-all">{value}</p>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="bg-dark-900/40 rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-2 uppercase tracking-wide">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
