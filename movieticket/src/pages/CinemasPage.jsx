import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Building } from 'lucide-react';
import { requestJson } from '../services/api';

export default function CinemasPage() {
  const navigate = useNavigate();

  const [selectedCity, setSelectedCity] = useState('Tất cả');
  const [cinemasData, setCinemasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchCinemas = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await requestJson('/cinemas');

        const mapped = Array.isArray(data)
          ? data.map((cinema) => ({
              cinemaId: cinema.cinemaId,
              name: cinema.name || 'Chưa có tên rạp',
              type: cinema.type || 'Cụm rạp',
              status: cinema.status || '',
              address: cinema.address || 'Chưa có địa chỉ',
              city: cinema.city || 'Khác',
              operatingHours: {
                open: cinema.operatingHours?.open || '--:--',
                close: cinema.operatingHours?.close || '--:--',
              },
              phones: Array.isArray(cinema.phones) ? cinema.phones : [],
            }))
          : [];

        setCinemasData(mapped);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    fetchCinemas();
  }, []);

  const cities = useMemo(
    () => ['Tất cả', ...new Set(cinemasData.map((c) => c.city).filter(Boolean))],
    [cinemasData]
  );

  const filtered =
    selectedCity === 'Tất cả'
      ? cinemasData
      : cinemasData.filter((c) => c.city === selectedCity);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Hệ thống rạp
        </h1>
        <p className="text-gray-400">Tìm rạp MovieTicket gần bạn nhất</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <p>Đang tải danh sách rạp...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCity === city
                    ? 'bg-primary text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>Không tìm thấy rạp phù hợp</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((cinema, idx) => (
                <motion.button
                  key={cinema.cinemaId}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/cinemas/${cinema.cinemaId}`)}
                  className="text-left bg-dark-800 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <div
                    className={`h-32 relative overflow-hidden ${
                      cinema.type === 'Cụm rạp cao cấp'
                        ? 'bg-gradient-to-br from-yellow-600/30 to-orange-600/30'
                        : 'bg-gradient-to-br from-red-600/30 to-purple-600/30'
                    }`}
                  >
                    <Building
                      size={80}
                      className="absolute -right-4 -bottom-4 text-white/10"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                        {cinema.type}
                      </span>
                      <h3 className="font-display text-xl text-white mt-1">
                        {cinema.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <InfoRow icon={MapPin} text={cinema.address} />
                    <InfoRow
                      icon={Clock}
                      text={`${cinema.operatingHours.open} - ${cinema.operatingHours.close}`}
                    />
                    <InfoRow
                      icon={Phone}
                      text={
                        cinema.phones.length > 0
                          ? cinema.phones.join(' • ')
                          : 'Chưa có số điện thoại'
                      }
                    />

                    {cinema.status && (
                      <div className="pt-3 border-t border-white/5">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                          Trạng thái
                        </p>
                        <span className="inline-block px-2.5 py-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded font-medium">
                          {cinema.status}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}
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
