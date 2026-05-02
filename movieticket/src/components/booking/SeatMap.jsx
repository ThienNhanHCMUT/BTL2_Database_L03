import { memo } from 'react';
import { useBooking } from '../../context/BookingContext';
import { getSeatClass, isSeatSelected } from '../../utils/seatUtils';

const Seat = memo(({ seat, isSelected, onToggle }) => {
  const disabled = seat.status === 'booked' || seat.status === 'broken';
  const width = seat.type === 'Đôi' ? 'w-[4.5rem]' : 'w-8';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onToggle(seat)}
      className={`${getSeatClass(seat, isSelected)} ${width} h-8 flex items-center justify-center text-[10px] font-semibold text-white/90`}
      title={`${seat.label} — ${seat.type} ${disabled ? '(Không thể chọn)' : ''}`}
    >
      {seat.col}
    </button>
  );
});

Seat.displayName = 'Seat';

export default function SeatMap({ grid }) {
  const { selectedSeats, toggleSeat } = useBooking();

  return (
    <div className="w-full bg-dark-800/50 rounded-2xl p-4 sm:p-6 border border-white/5">
      <div className="mb-8">
        <div className="relative">
          <svg viewBox="0 0 600 40" className="w-full h-10" preserveAspectRatio="none">
            <path
              d="M 20 35 Q 300 0 580 35"
              fill="none"
              stroke="url(#screenGradient)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E50914" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#FFD700" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E50914" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
          <p className="text-center text-xs uppercase tracking-[0.3em] text-gray-400 mt-1 font-medium">
            MÀN HÌNH
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1.5 min-w-full items-center">
          {grid.map(({ row, seats, isCouple }) => (
            <div key={row} className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-6 text-xs text-gray-500 font-semibold text-center">{row}</div>

              <div className={`flex gap-1 sm:gap-1.5 ${isCouple ? 'justify-center' : ''}`}>
                {seats.map((seat) =>
                  seat.type === 'empty' ? (
                    <div key={`${seat.row}-${seat.col}`} className="w-8 h-8" />
                  ) : (
                    <Seat
                      key={`${seat.row}-${seat.col}`}
                      seat={seat}
                      isSelected={isSeatSelected(selectedSeats, seat.row, seat.col)}
                      onToggle={toggleSeat}
                    />
                  )
                )}
              </div>

              <div className="w-6 text-xs text-gray-500 font-semibold text-center">{row}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 sm:grid-cols-6 gap-3 text-xs">
        <LegendItem color="bg-[#4A5568]" label="Thường" />
        <LegendItem color="bg-[#D69E2E]" label="VIP" />
        <LegendItem color="bg-[#E53E8C]" label="Đôi" />
        <LegendItem color="bg-[#3B82F6]" label="Đang chọn" />
        <LegendItem color="bg-[#1A202C] border border-white/10" label="Đã đặt" />
        <LegendItem color="bg-[#374151] opacity-30" label="Hỏng" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded ${color}`} />
      <span className="text-gray-400">{label}</span>
    </div>
  );
}