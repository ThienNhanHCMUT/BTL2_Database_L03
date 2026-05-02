import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking } from '../context/BookingContext';
import DatePicker from '../components/booking/DatePicker';
import ShowtimeGrid from '../components/booking/ShowtimeGrid';
import ProgressStepper from '../components/common/ProgressStepper';
import { getNextDays } from '../utils/formatDate';
import { requestJson } from '../services/api';

function getDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildDateOption(value) {
  const date = new Date(value);
  const todayKey = getDateKey(new Date());
  const dateKey = getDateKey(value);

  return {
    date: dateKey,
    weekday: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
    day: date.getDate(),
    month: date.getMonth() + 1,
    isToday: dateKey === todayKey,
    timestamp: date.getTime(),
  };
}

export default function ShowtimePage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { selectMovie, selectCinema, selectShowtime } = useBooking();

  const [movie, setMovie] = useState(null);
  const [showtimesData, setShowtimesData] = useState([]);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true);
  const [error, setError] = useState('');

  const [selectedCity, setSelectedCity] = useState('Tất cả');
  const [selectedDate, setSelectedDate] = useState(() => getNextDays(1)[0].date);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [movieId]);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoadingMovie(true);
        setError('');

        const data = await requestJson(`/movies/${movieId}`);

        const mappedMovie = {
          ...data,
          poster: data.poster || '/posters/default.jpg',
          formats: data.formats || [],
        };

        setMovie(mappedMovie);
        selectMovie(mappedMovie);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoadingMovie(false);
      }
    };

    fetchMovie();
  }, [movieId, selectMovie]);

  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        setLoadingShowtimes(true);
        setError('');

        const data = await requestJson(`/movies/${movieId}/showtimes`);
        setShowtimesData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoadingShowtimes(false);
      }
    };

    fetchShowtimes();
  }, [movieId]);

  const cities = useMemo(() => {
    return ['Tất cả', ...new Set(showtimesData.map((c) => c.city).filter(Boolean))];
  }, [showtimesData]);

  const availableDates = useMemo(() => {
    const map = new Map();

    for (const cinema of showtimesData) {
      for (const showtime of cinema.showtimes || []) {
        const dateKey = getDateKey(showtime.startTime);
        if (!dateKey || map.has(dateKey)) continue;
        map.set(dateKey, buildDateOption(showtime.startTime));
      }
    }

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [showtimesData]);

  useEffect(() => {
    if (availableDates.length === 0) return;
    if (availableDates.some((date) => date.date === selectedDate)) return;
    setSelectedDate(availableDates[0].date);
  }, [availableDates, selectedDate]);

  const cinemasWithShowtimes = useMemo(() => {
    return showtimesData
      .map((cinema) => ({
        ...cinema,
        showtimes: (cinema.showtimes || []).filter(
          (showtime) => getDateKey(showtime.startTime) === selectedDate
        ),
      }))
      .filter(
        (cinema) =>
          cinema.showtimes.length > 0 &&
          (selectedCity === 'Tất cả' || cinema.city === selectedCity)
      );
  }, [showtimesData, selectedCity, selectedDate]);

  const handleSelectShowtime = (showtime, cinema) => {
    selectCinema(cinema);
    selectShowtime(showtime);
    navigate(`/booking/seats/${showtime.showtimeId}`);
  };

  if (loadingMovie) {
    return <div className="text-center py-20 text-gray-400">Đang tải phim...</div>;
  }

  if (error && !movie) {
    return <div className="text-center py-20 text-red-400">{error}</div>;
  }

  if (!movie) {
    return <div className="text-center py-20">Không tìm thấy phim</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ProgressStepper currentStep={2} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
          <img
            src={movie.poster}
            alt={movie.vnTitle}
            className="w-16 h-24 object-cover rounded-lg"
          />
          <div>
            <p className="text-xs uppercase tracking-wider text-primary mb-1">Đặt vé cho</p>
            <h1 className="font-display text-xl sm:text-2xl text-white">{movie.vnTitle}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {(movie.formats || []).join(' • ')} • {movie.ageRating}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            Chọn ngày
          </h2>
          <DatePicker
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            days={7}
            dates={availableDates}
          />
        </div>

        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Thành phố
          </h2>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCity === city
                  ? 'bg-primary text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            Suất chiếu khả dụng
          </h2>

          {loadingShowtimes ? (
            <div className="text-center py-16 text-gray-400 bg-dark-800/30 rounded-xl border border-white/5">
              <p>Đang tải suất chiếu...</p>
            </div>
          ) : (
            <ShowtimeGrid
              cinemasWithShowtimes={cinemasWithShowtimes}
              onSelect={handleSelectShowtime}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
