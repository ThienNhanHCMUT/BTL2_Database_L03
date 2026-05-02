import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import SeatMap from '../components/booking/SeatMap';
import BookingSummary from '../components/booking/BookingSummary';
import ProgressStepper from '../components/common/ProgressStepper';
import { requestJson } from '../services/api';

export default function SeatSelectionPage() {
  const navigate = useNavigate();
  const {
    movie,
    cinema,
    showtime,
    selectedSeats,
    setHold,
  } = useBooking();

  const [seatGrid, setSeatGrid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [holdLoading, setHoldLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!movie || !showtime) {
      navigate('/movies');
    }
  }, [movie, showtime, navigate]);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        if (!showtime?.showtimeId) return;

        setLoading(true);
        setError('');

        const data = await requestJson(`/showtimes/${showtime.showtimeId}/seats`);
        setSeatGrid(Array.isArray(data.grid) ? data.grid : []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [showtime?.showtimeId]);

  const handleContinue = async () => {
    if (selectedSeats.length === 0 || !showtime?.showtimeId) return;

    try {
      setHoldLoading(true);
      setError('');

      const data = await requestJson('/bookings/hold-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId: showtime.showtimeId,
          selectedSeats,
        }),
      });

      setHold({
        holdToken: data.holdToken,
        holdExpiresAt: data.holdExpiresAt,
      });

      navigate('/booking/combo');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi giữ ghế');
    } finally {
      setHoldLoading(false);
    }
  };

  if (!movie || !showtime) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ProgressStepper currentStep={3} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại chọn suất
        </button>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div>
            <div className="mb-6">
              <h1 className="font-display text-2xl sm:text-3xl text-white mb-1">
                Chọn ghế ngồi
              </h1>
              <p className="text-sm text-gray-400">
                Bạn có thể chọn tối đa 8 ghế — đã chọn {selectedSeats.length}/8
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {cinema?.name ? `${cinema.name} • ` : ''}
                {showtime?.roomNumber ? `Phòng ${showtime.roomNumber} • ` : ''}
                {showtime?.format ? `${showtime.format} • ` : ''}
                {showtime?.language || ''}
              </p>
            </div>

            {loading ? (
              <div className="w-full bg-dark-800/50 rounded-2xl p-8 border border-white/5 text-center text-gray-400">
                Đang tải sơ đồ ghế...
              </div>
            ) : error ? (
              <div className="w-full bg-dark-800/50 rounded-2xl p-8 border border-white/5 text-center text-red-400">
                {error}
              </div>
            ) : (
              <SeatMap grid={seatGrid} />
            )}

            <p className="text-xs text-gray-500 mt-4 text-center">
              💡 Mẹo: Ghế VIP và ghế đôi có giá cao hơn. Chọn ghế chính giữa hàng để có góc nhìn đẹp nhất.
            </p>
          </div>

          <div>
            <BookingSummary
              onContinue={handleContinue}
              continueLabel={
                selectedSeats.length === 0
                  ? 'Vui lòng chọn ghế'
                  : holdLoading
                    ? 'Đang giữ ghế...'
                    : 'Tiếp tục chọn combo'
              }
              disabled={selectedSeats.length === 0 || holdLoading}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
