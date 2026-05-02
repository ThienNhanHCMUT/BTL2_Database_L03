import { Link } from 'react-router-dom';
import { Play, Ticket, Clock } from 'lucide-react';
import Badge from '../common/Badge';
import { formatDuration } from '../../utils/formatDate';
import { DEFAULT_MOVIE_POSTER } from '../../utils/movieImages';

export default function MovieCard({ movie, showTrailer = true }) {
  const isComingSoon = movie.status === 'Sắp chiếu';

  return (
    <div className="group relative flex flex-col h-full rounded-xl overflow-hidden bg-dark-800 border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
      {/* Poster */}
      <Link to={`/movie/${movie.movieId}`} className="relative aspect-[2/3] overflow-hidden bg-dark-700">
        <img
          src={movie.poster}
          alt={movie.vnTitle}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_MOVIE_POSTER;
          }}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top-left badge */}
        <div className="absolute top-2 left-2">
          <Badge rating={movie.ageRating} size="xs" />
        </div>

        {/* Format badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {movie.formats.slice(0, 2).map((f) => (
            <span key={f} className="text-[10px] bg-black/60 backdrop-blur text-white px-1.5 py-0.5 rounded font-medium">
              {f}
            </span>
          ))}
        </div>

        {/* Trailer button on hover */}
        {showTrailer && movie.trailer && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center animate-pulse-glow">
              <Play size={22} className="text-white ml-1" fill="currentColor" />
            </div>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <Link to={`/movie/${movie.movieId}`}>
          <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug min-h-[2.5rem] hover:text-primary transition-colors">
            {movie.vnTitle}
          </h3>
        </Link>

        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDuration(movie.duration)}
          </span>
          <span>•</span>
          <span className="truncate">{movie.genres[0]}</span>
        </div>

        <Link
          to={isComingSoon ? `/movie/${movie.movieId}` : `/booking/showtime/${movie.movieId}`}
          className={`mt-auto inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            isComingSoon
              ? 'bg-dark-600 text-gray-300 hover:bg-dark-500'
              : 'bg-primary text-white hover:bg-primary-hover'
          }`}
        >
          <Ticket size={14} />
          {isComingSoon ? 'Xem chi tiết' : 'Đặt vé ngay'}
        </Link>
      </div>
    </div>
  );
}
