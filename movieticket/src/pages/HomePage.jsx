import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Ticket, ChevronRight, Star } from 'lucide-react';
import MovieCard from '../components/movie/MovieCard';
import Badge from '../components/common/Badge';
import { formatDuration } from '../utils/formatDate';
import { requestJson } from '../services/api';
import { DEFAULT_MOVIE_POSTER, applyMovieImages } from '../utils/movieImages';

export default function HomePage() {
  const [moviesData, setMoviesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  const showing = moviesData.filter((m) => m.status === 'Đang chiếu');
  const comingSoon = moviesData.filter((m) => m.status === 'Sắp chiếu');
  const featured = showing.slice(0, 4);
  const current = featured[heroIndex];

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await requestJson('/movies');
        const mappedMovies = Array.isArray(data)
          ? data.map((movie) =>
              applyMovieImages({
                ...movie,
                formats: Array.isArray(movie.formats) ? movie.formats : [],
                genres: Array.isArray(movie.genres) ? movie.genres : [],
              })
            )
          : [];

        setMoviesData(mappedMovies);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Không thể tải danh sách phim');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  useEffect(() => {
    if (featured.length === 0 || heroIndex < featured.length) return;
    setHeroIndex(0);
  }, [featured.length, heroIndex]);

  useEffect(() => {
    if (featured.length <= 1) return undefined;

    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % featured.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featured.length]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
        Đang tải phim từ backend...
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/movies" className="text-primary hover:underline">
          Xem danh sách phim
        </Link>
      </motion.div>
    );
  }

  if (!current) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
        Chưa có phim đang chiếu từ backend.
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* HERO */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {/* Background layers */}
        {featured.map((movie, idx) => (
          <div
            key={movie.movieId}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === heroIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={movie.banner}
              alt={movie.vnTitle}
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = DEFAULT_MOVIE_POSTER;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex items-end pb-20">
          <motion.div
            key={current?.movieId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge rating={current?.ageRating} size="md" />
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                {current?.formats.join(' • ')}
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl text-white leading-tight mb-4">
              {current?.vnTitle}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-gold text-gold" />
                <span>8.5</span>
              </span>
              <span>•</span>
              <span>{formatDuration(current?.duration || 0)}</span>
              <span>•</span>
              <span>{current?.genres.join(', ')}</span>
            </div>
            <p className="text-gray-300 text-base mb-8 leading-relaxed line-clamp-3">
              {current?.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/booking/showtime/${current?.movieId}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30"
              >
                <Ticket size={18} />
                Đặt vé ngay
              </Link>
              <Link
                to={`/movie/${current?.movieId}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold rounded-xl transition-colors border border-white/20"
              >
                <Play size={18} />
                Xem trailer
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`h-1 rounded-full transition-all ${
                i === heroIndex ? 'w-8 bg-primary' : 'w-4 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* NOW SHOWING */}
      <MovieSection title="Phim đang chiếu" subtitle="Đặt vé ngay hôm nay" movies={showing} />

      {/* COMING SOON */}
      <MovieSection title="Phim sắp chiếu" subtitle="Đón chờ những bom tấn mới" movies={comingSoon} />

      {/* PROMO BANNER */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'U22 giảm 50%', desc: 'Sinh viên dưới 22 tuổi', emoji: '🎓', color: 'from-red-500/20 to-orange-500/20' },
            { title: 'Combo tiết kiệm', desc: 'Bắp + nước chỉ 69k', emoji: '🍿', color: 'from-yellow-500/20 to-red-500/20' },
            { title: 'Thứ Ba vui vẻ', desc: 'Giảm 30% toàn hệ thống', emoji: '🎬', color: 'from-purple-500/20 to-pink-500/20' },
          ].map((p, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${p.color} border border-white/10 hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <div className="absolute top-4 right-4 text-5xl opacity-50">{p.emoji}</div>
              <h3 className="font-bold text-xl text-white mb-1">{p.title}</h3>
              <p className="text-sm text-gray-300">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function MovieSection({ title, subtitle, movies }) {
  if (movies.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-white">{title}</h2>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>
        <Link to="/movies" className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover font-medium">
          Xem tất cả
          <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.slice(0, 5).map((movie) => (
          <MovieCard key={movie.movieId} movie={movie} />
        ))}
      </div>
    </section>
  );
}
