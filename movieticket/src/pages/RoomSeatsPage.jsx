import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import SeatMap from '../components/booking/SeatMap';
import { requestJson } from '../services/api';

export default function RoomSeatsPage() {
  const { cinemaId, roomNumber } = useParams();
  const navigate = useNavigate();

  const [roomData, setRoomData] = useState(null);
  const [seatGrid, setSeatGrid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchRoomSeats = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await requestJson(`/rooms/${cinemaId}/${roomNumber}/seats`);
        setRoomData(data.room || null);
        setSeatGrid(Array.isArray(data.grid) ? data.grid : []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    if (cinemaId && roomNumber) {
      fetchRoomSeats();
    }
  }, [cinemaId, roomNumber]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl text-white mb-2">
            Sơ đồ ghế phòng chiếu
          </h1>
          <p className="text-gray-400">
            {roomData
              ? `${roomData.cinemaId} • Phòng ${roomData.roomNumber} • ${roomData.roomType || 'Phòng chiếu'}`
              : 'Đang tải thông tin phòng'}
          </p>
        </div>

        {loading ? (
          <div className="w-full bg-dark-800/50 rounded-2xl p-8 border border-white/5 text-center text-gray-400">
            Đang tải sơ đồ ghế...
          </div>
        ) : error ? (
          <div className="w-full bg-dark-800/50 rounded-2xl p-8 border border-white/5 text-center text-red-400">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {roomData && (
              <div className="bg-dark-800 rounded-2xl p-5 border border-white/5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <Info label="Cinema ID" value={roomData.cinemaId} />
                <Info label="Phòng" value={roomData.roomNumber} />
                <Info label="Loại phòng" value={roomData.roomType || '—'} />
                <Info label="Âm thanh" value={roomData.audioSystem || '—'} />
              </div>
            )}

            <SeatMap grid={seatGrid} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  );
}
