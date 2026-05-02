import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Phone, Clock, Building } from 'lucide-react';
import { requestJson } from '../services/api';

export default function CinemaDetailPage() {
  const { cinemaId } = useParams();
  const navigate = useNavigate();

  const [cinema, setCinema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchCinema = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await requestJson(`/cinemas/${cinemaId}`);
        setCinema(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    if (cinemaId) {
      fetchCinema();
    }
  }, [cinemaId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/cinemas')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại danh sách rạp
        </button>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p>Đang tải thông tin rạp...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">
            <p>{error}</p>
          </div>
        ) : !cinema ? (
          <div className="text-center py-16 text-gray-400">
            <p>Không tìm thấy rạp</p>
          </div>
        ) : (
          <div className="bg-dark-800 rounded-2xl overflow-hidden border border-white/5">
            <div
              className={`h-40 relative overflow-hidden ${
                cinema.type === 'Cụm rạp cao cấp'
                  ? 'bg-gradient-to-br from-yellow-600/30 to-orange-600/30'
                  : 'bg-gradient-to-br from-red-600/30 to-purple-600/30'
              }`}
            >
              <Building size={100} className="absolute -right-4 -bottom-4 text-white/10" />
              <div className="absolute top-6 left-6">
                <span className="text-xs uppercase tracking-wider text-white/60 font-bold">
                  {cinema.type}
                </span>
                <h1 className="font-display text-3xl text-white mt-2">{cinema.name}</h1>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <InfoRow icon={MapPin} text={cinema.address} />
              <InfoRow
                icon={Clock}
                text={`${cinema.operatingHours?.open || '--:--'} - ${cinema.operatingHours?.close || '--:--'}`}
              />
              <InfoRow
                icon={Phone}
                text={Array.isArray(cinema.phones) && cinema.phones.length > 0 ? cinema.phones.join(' • ') : 'Chưa có số điện thoại'}
              />

              {cinema.status && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Trạng thái</p>
                  <span className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary border border-primary/30 rounded-lg font-medium">
                    {cinema.status}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-white/5">
                <Link
                  to="/cinemas"
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  Xem các rạp khác
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon size={16} className="text-primary mt-0.5 flex-shrink-0" />
      <span className="text-gray-300 leading-snug">{text}</span>
    </div>
  );
}
