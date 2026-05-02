import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { formatTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ShowtimeGrid({ cinemasWithShowtimes, onSelect, selectedShowtimeId }) {
  const [expandedCinemas, setExpandedCinemas] = useState(new Set());

  useEffect(() => {
    setExpandedCinemas(new Set(cinemasWithShowtimes.map((c) => c.cinemaId)));
  }, [cinemasWithShowtimes]);

  if (!Array.isArray(cinemasWithShowtimes) || cinemasWithShowtimes.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 bg-dark-800/30 rounded-xl border border-white/5">
        <p className="text-lg mb-2">😔 Không có suất chiếu nào</p>
        <p className="text-sm">Hãy chọn ngày khác hoặc phim khác</p>
      </div>
    );
  }

  const toggleCinema = (cinemaId) => {
    setExpandedCinemas((prev) => {
      const next = new Set(prev);
      if (next.has(cinemaId)) next.delete(cinemaId);
      else next.add(cinemaId);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {cinemasWithShowtimes.map((cinema) => {
        const isExpanded = expandedCinemas.has(cinema.cinemaId);

        return (
          <div key={cinema.cinemaId} className="bg-dark-800 rounded-xl border border-white/5 overflow-hidden">
            <button
              onClick={() => toggleCinema(cinema.cinemaId)}
              className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{cinema.name}</h3>
                <p className="text-xs text-gray-400 truncate">{cinema.address}</p>
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-white/5">
                {Object.entries(
                  cinema.showtimes.reduce((acc, st) => {
                    (acc[st.format] = acc[st.format] || []).push(st);
                    return acc;
                  }, {})
                ).map(([format, times]) => (
                  <div key={format} className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">{format}</span>
                      <span className="text-xs text-gray-500">• {times[0]?.language}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {times.map((st) => {
                        const isSelected = st.showtimeId === selectedShowtimeId;
                        const isFull = st.status === 'Đã đầy';

                        return (
                          <button
                            key={st.showtimeId}
                            disabled={isFull}
                            onClick={() => onSelect(st, cinema)}
                            className={`group relative px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                              isFull
                                ? 'bg-dark-700 border-white/5 text-gray-500 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-dark-700 border-white/10 text-white hover:border-primary hover:text-primary'
                            }`}
                          >
                            <div>{formatTime(st.startTime)}</div>
                            <div className="text-[10px] opacity-70 font-normal">
                              {formatCurrency(st.basePrice)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}