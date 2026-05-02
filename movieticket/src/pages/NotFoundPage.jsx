import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Film } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4"
    >
      <div className="text-center max-w-md">
        <div className="relative inline-block mb-8">
          <div className="font-display text-[10rem] sm:text-[12rem] leading-none text-primary/20 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Film size={80} className="text-primary animate-pulse" />
          </div>
        </div>

        <h1 className="font-display text-3xl text-white mb-3">Trang không tồn tại</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Có vẻ như trang bạn đang tìm đã bị cắt ra khỏi bộ phim. 🎬
          <br />Hãy quay về trang chủ để tiếp tục khám phá nhé!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20"
          >
            <Home size={18} /> Về trang chủ
          </Link>
          <Link
            to="/movies"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 border border-white/10 text-white font-semibold rounded-xl transition-colors"
          >
            <Film size={18} /> Xem phim
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
