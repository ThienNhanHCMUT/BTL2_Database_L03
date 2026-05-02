import { MapPin, Calendar, Clock, Armchair, Ticket } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateVi, formatTime, formatWeekday } from '../../utils/formatDate';
import Timer from '../common/Timer';

export default function BookingSummary({ onContinue, continueLabel = 'Tiếp tục', disabled = false, showTimer = true }) {
  const { movie, cinema, showtime, selectedSeats, selectedCombos, ticketTotal, comboTotal, discount, grandTotal } = useBooking();

  if (!movie) {
    return (
      <div className="bg-dark-800 rounded-2xl p-6 border border-white/5 text-center text-gray-400">
        <Ticket size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">Chưa có thông tin đặt vé</p>
      </div>
    );
  }

  return (
    <aside className="bg-dark-800 rounded-2xl border border-white/5 overflow-hidden sticky top-20">
      {/* Movie header */}
      <div className="relative h-32 overflow-hidden">
        <img src={movie.banner || movie.poster} alt={movie.vnTitle} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="inline-block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">
            {movie.formats?.[0] || '2D'} • {movie.ageRating}
          </span>
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{movie.vnTitle}</h3>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-4">
        {cinema && (
          <div className="flex items-start gap-3 text-sm">
            <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">{cinema.name}</p>
              <p className="text-gray-400 text-xs">{cinema.address}</p>
            </div>
          </div>
        )}

        {showtime && (
          <>
            <div className="flex items-start gap-3 text-sm">
              <Calendar size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">
                  {formatWeekday(showtime.startTime)}, {formatDateVi(showtime.startTime)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Clock size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">
                  Suất {formatTime(showtime.startTime)} • Phòng {showtime.roomNumber?.split('_').pop()}
                </p>
                <p className="text-gray-400 text-xs">
                  {showtime.format} • {showtime.language}
                </p>
              </div>
            </div>
          </>
        )}

        {selectedSeats.length > 0 && (
          <div className="flex items-start gap-3 text-sm">
            <Armchair size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-medium mb-1">
                {selectedSeats.length} ghế:{' '}
                <span className="text-primary">
                  {selectedSeats.map((s) => s.label).join(', ')}
                </span>
              </p>
              <p className="text-gray-400 text-xs">
                {[...new Set(selectedSeats.map((s) => s.type))].join(', ')}
              </p>
            </div>
          </div>
        )}

        {selectedCombos.length > 0 && (
          <div className="pt-3 border-t border-white/5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Combo</p>
            {selectedCombos.map((c) => (
              <div key={c.productId} className="flex justify-between text-sm py-1">
                <span className="text-gray-300">{c.name} × {c.quantity}</span>
                <span className="text-white">{formatCurrency(c.unitPrice * c.quantity)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="px-5 py-4 bg-dark-900/50 border-t border-white/5 space-y-2">
        {ticketTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Vé xem phim</span>
            <span className="text-white">{formatCurrency(ticketTotal)}</span>
          </div>
        )}
        {comboTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Combo bắp nước</span>
            <span className="text-white">{formatCurrency(comboTotal)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Giảm giá</span>
            <span className="text-green-400">-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
          <span className="text-white font-semibold">Tổng cộng</span>
          <span className="text-primary font-bold text-xl">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {/* Timer + CTA */}
      <div className="p-5 space-y-3">
        {showTimer && <Timer className="w-full justify-center" />}
        {onContinue && (
          <button
            onClick={onContinue}
            disabled={disabled}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
              disabled
                ? 'bg-dark-600 text-gray-500 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20'
            }`}
          >
            {continueLabel}
          </button>
        )}
      </div>
    </aside>
  );
}
