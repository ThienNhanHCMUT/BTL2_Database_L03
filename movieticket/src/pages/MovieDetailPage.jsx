import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Ticket, Clock, Calendar, Globe, ArrowLeft, Star } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import Badge from '../components/common/Badge';
import { formatDuration, formatDateVi } from '../utils/formatDate';
import { requestJson } from '../services/api';
import { DEFAULT_MOVIE_POSTER, applyMovieImages } from '../utils/movieImages';

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { selectMovie } = useBooking();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [movieId]);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await requestJson(`/movies/${movieId}`);

        setMovie(
          applyMovieImages({
            ...data,
            genres: data.genres || [],
            formats: data.formats || [],
            directors: data.directors || [],
            actors: data.actors || [],
          })
        );
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
        Đang tải chi tiết phim...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl text-white mb-4">{error}</h1>
        <Link to="/movies" className="text-primary hover:underline">
          Quay lại danh sách phim
        </Link>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl text-white mb-4">Không tìm thấy phim</h1>
        <Link to="/movies" className="text-primary hover:underline">
          Quay lại danh sách phim
        </Link>
      </div>
    );
  }

  const handleBook = () => {
    selectMovie(movie);
    navigate(`/booking/showtime/${movie.movieId}`);
  };

  const isComingSoon = movie.status === 'Sắp chiếu';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src={movie.banner}
          alt={movie.vnTitle}
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_MOVIE_POSTER;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-dark-900/30" />
        <Link
          to="/movies"
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur rounded-lg text-white text-sm hover:bg-black/70 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10 pb-12">
        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mx-auto md:mx-0"
          >
            <div className="aspect-[2/3] w-64 md:w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
              <img
                src={movie.poster}
                alt={movie.vnTitle}
                className="w-full h-full object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = DEFAULT_MOVIE_POSTER;
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3 mb-3">
              <Badge rating={movie.ageRating} size="lg" />
              {movie.formats.map((f) => (
                <span key={f} className="px-2.5 py-1 text-xs font-bold bg-primary/20 text-primary border border-primary/30 rounded">
                  {f}
                </span>
              ))}
              {isComingSoon && (
                <span className="px-3 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
                  SẮP CHIẾU
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-5xl text-white leading-tight mb-2">
              {movie.vnTitle}
            </h1>

            {movie.originTitle && movie.originTitle !== movie.vnTitle && (
              <p className="text-lg text-gray-400 italic mb-4">{movie.originTitle}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-6">
              <span className="flex items-center gap-1.5">
                <Star size={14} className="fill-gold text-gold" /> 8.5/10
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {formatDuration(movie.duration)}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe size={14} /> {movie.country}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> Khởi chiếu {formatDateVi(movie.releaseDate)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.map((g) => (
                <span key={g} className="px-3 py-1 text-xs bg-dark-700 border border-white/10 text-gray-300 rounded-full">
                  {g}
                </span>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-2">Nội dung phim</h3>
              <p className="text-gray-300 leading-relaxed">{movie.description}</p>
            </div>

            {(movie.directors.length > 0 || movie.actors.length > 0) && (
              <div className="mb-8 space-y-3">
                {movie.directors.length > 0 && (
                  <p className="text-sm">
                    <span className="text-gray-400">Đạo diễn: </span>
                    <span className="text-white">{movie.directors.map((d) => d.name).join(', ')}</span>
                  </p>
                )}
                {movie.actors.length > 0 && (
                  <p className="text-sm">
                    <span className="text-gray-400">Diễn viên: </span>
                    <span className="text-white">{movie.actors.map((a) => a.name).join(', ')}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-auto">
              <button
                onClick={handleBook}
                disabled={isComingSoon}
                className={`inline-flex items-center gap-2 px-8 py-4 font-bold rounded-xl transition-all text-lg ${
                  isComingSoon
                    ? 'bg-dark-600 text-gray-500 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 hover:scale-[1.02]'
                }`}
              >
                <Ticket size={22} />
                {isComingSoon ? 'Chưa mở đặt vé' : 'Đặt vé ngay'}
              </button>

              {movie.trailer && (
                <a
                  href={movie.trailer}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
                >
                  <Play size={22} />
                  Xem trailer
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
