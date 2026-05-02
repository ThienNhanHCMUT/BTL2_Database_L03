import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import MovieCard from '../components/movie/MovieCard';
import { requestJson } from '../services/api';
import { applyMovieImages } from '../utils/movieImages';

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'now-showing';

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('all');

  const [moviesData, setMoviesData] = useState([]);
  const [genresData, setGenresData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [movies, genres] = await Promise.all([
          requestJson('/movies'),
          requestJson('/genres'),
        ]);

        const mappedMovies = Array.isArray(movies)
          ? movies.map((movie) =>
              applyMovieImages({
                ...movie,
                formats: Array.isArray(movie.formats) ? movie.formats : [],
                genres: Array.isArray(movie.genres) ? movie.genres : [],
              })
            )
          : [];

        const mappedGenres = Array.isArray(genres)
          ? genres
              .filter((g) => g?.genreName)
              .map((g) => ({
                genreId: g.genreId,
                genreName: g.genreName,
                movieCount: Number(g.movieCount || 0),
              }))
          : [];

        setMoviesData(mappedMovies);
        setGenresData(mappedGenres);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleGenre = (genreName) => {
    setSelectedGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName)
        : [...prev, genreName]
    );
  };

  const clearGenres = () => {
    setSelectedGenres([]);
  };

  const filtered = useMemo(() => {
    const status = activeTab === 'now-showing' ? 'Đang chiếu' : 'Sắp chiếu';

    return moviesData.filter((m) => {
      if (m.status !== status) return false;

      const movieGenres = Array.isArray(m.genres) ? m.genres : [];
      const movieFormats = Array.isArray(m.formats) ? m.formats : [];

      if (
        selectedGenres.length > 0 &&
        !selectedGenres.some((genre) => movieGenres.includes(genre))
      ) {
        return false;
      }

      if (selectedFormat !== 'all' && !movieFormats.includes(selectedFormat)) {
        return false;
      }

      return true;
    });
  }, [moviesData, activeTab, selectedGenres, selectedFormat]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Danh sách phim
        </h1>
        <p className="text-gray-400">Chọn phim bạn yêu thích và đặt vé ngay</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-white/5">
        {[
          { id: 'now-showing', label: 'Đang chiếu' },
          { id: 'coming-soon', label: 'Sắp chiếu' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Filter size={14} />
            <span>Lọc:</span>
          </div>

          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="bg-dark-700 text-white text-sm px-3 py-2 rounded-lg border border-white/5 focus:border-primary outline-none"
          >
            <option value="all">Tất cả định dạng</option>
            <option value="2D">2D</option>
            <option value="3D">3D</option>
            <option value="IMAX">IMAX</option>
            <option value="4DX">4DX</option>
          </select>

          <span className="ml-auto text-sm text-gray-400">
            {filtered.length} phim
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={clearGenres}
            className={`px-3 py-2 rounded-full text-sm border transition-colors ${
              selectedGenres.length === 0
                ? 'bg-primary text-white border-primary'
                : 'bg-dark-700 text-gray-300 border-white/10 hover:border-primary/50'
            }`}
          >
            Tất cả thể loại
          </button>

          {genresData.map((genre) => {
            const active = selectedGenres.includes(genre.genreName);

            return (
              <button
                key={genre.genreId || genre.genreName}
                onClick={() => toggleGenre(genre.genreName)}
                className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-dark-700 text-gray-300 border-white/10 hover:border-primary/50'
                }`}
              >
                {genre.genreName}
                {genre.movieCount > 0 ? ` (${genre.movieCount})` : ''}
              </button>
            );
          })}
        </div>

        {selectedGenres.length > 0 && (
          <p className="text-sm text-gray-400">
            Đang lọc theo: {selectedGenres.join(', ')}
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <p>Đang tải danh sách phim...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>Không tìm thấy phim phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((movie, idx) => (
            <motion.div
              key={movie.movieId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
