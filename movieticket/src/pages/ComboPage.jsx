import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, SkipForward } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import ComboCard from '../components/combo/ComboCard';
import BookingSummary from '../components/booking/BookingSummary';
import ProgressStepper from '../components/common/ProgressStepper';
import { requestJson } from '../services/api';

export default function ComboPage() {
  const navigate = useNavigate();
  const { movie, selectedSeats } = useBooking();

  const [activeCategory, setActiveCategory] = useState('all');
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!movie || selectedSeats.length === 0) {
      navigate('/movies');
    }
  }, [movie, selectedSeats, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await requestJson('/products');

        const mappedData = data.map((item) => {
          let uiType = 'Snack';
          let image = '🍿';
          let note = '';

          if (item.ProductType === 'Combo') {
            uiType = 'Combo';
            image = '🍿🥤';
            note = 'Combo tiện lợi cho buổi xem phim';
          } else if (item.ProductType === 'Bắp') {
            uiType = 'Bắp rang';
            image = '🍿';
            note = 'Bắp rang giòn, thơm, ăn kèm cực hợp';
          } else if (item.ProductType === 'Nước') {
            uiType = 'Nước uống';
            image = '🥤';
            note = 'Nước uống mát lạnh cho suất chiếu';
          } else {
            uiType = 'Snack';
            image = '🍫';
            note = 'Món ăn nhẹ dùng kèm';
          }

          return {
            productId: item.ProductID,
            name: item.ProductName,
            type: uiType,
            basePrice: item.BasePrice,
            status: item.ProductStatus,
            image,
            note,
          };
        });

        setProductsData(mappedData);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = ['all', 'Combo', 'Bắp rang', 'Nước uống', 'Snack'];

  const filtered =
    activeCategory === 'all'
      ? productsData
      : productsData.filter((p) => p.type === activeCategory);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ProgressStepper currentStep={4} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại chọn ghế
        </button>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl text-white mb-1">
                  Combo bắp nước
                </h1>
                <p className="text-sm text-gray-400">
                  Hoàn thiện trải nghiệm xem phim của bạn
                </p>
              </div>
              <button
                onClick={() => navigate('/booking/checkout')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5"
              >
                <SkipForward size={14} /> Bỏ qua
              </button>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'Tất cả' : cat}
                </button>
              ))}
            </div>

            {loading && (
              <p className="text-gray-400">Đang tải sản phẩm...</p>
            )}

            {error && (
              <p className="text-red-400">{error}</p>
            )}

            {!loading && !error && (
              <div className="grid sm:grid-cols-2 gap-4">
                {filtered.map((p) => (
                  <ComboCard key={p.productId} product={p} />
                ))}
              </div>
            )}
          </div>

          <div>
            <BookingSummary
              onContinue={() => navigate('/booking/checkout')}
              continueLabel="Tiếp tục thanh toán"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
