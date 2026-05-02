import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Gauge,
  Loader2,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  FieldError,
  NoticeBanner,
} from '../components/product/ProductUi';
import { formatCurrencyFull } from '../utils/formatCurrency';
import { fetchEventMetrics } from '../services/eventApi';

function validateEventId(value) {
  const trimmed = value.trim();

  if (!trimmed) return 'EventID không được để trống.';
  if (trimmed.length > 20) return 'EventID tối đa 20 ký tự.';

  return '';
}

export default function EventAnalyticsPage() {
  const [eventId, setEventId] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const eventIdError = validateEventId(eventId);
  const showEventIdError = touched || submitAttempted;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (eventIdError) return;

    try {
      setLoading(true);
      setNotice(null);
      const data = await fetchEventMetrics(eventId.trim());
      setMetrics(data);
    } catch (error) {
      setMetrics(null);
      setNotice({
        type: 'error',
        message:
          error?.data?.message ||
          error?.message ||
          'Không thể gọi API contract GET /api/events/:eventId/metrics.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEventId('');
    setTouched(false);
    setSubmitAttempted(false);
    setMetrics(null);
    setNotice(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <section className="mb-8">
        <div className="flex items-center gap-3 text-primary mb-3">
          <Calculator size={22} />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Phần 3.3
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Phân tích sự kiện
        </h1>
        <p className="text-gray-400 max-w-3xl">
          Minh họa function câu 2.4 bằng cách nhập EventID và hiển thị kết quả
          tính toán do backend trả về từ các function SQL.
        </p>
      </section>

      <div className="space-y-5">
        {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}

        <section className="grid lg:grid-cols-[420px_1fr] gap-6">
          <form
            onSubmit={handleSubmit}
            className="bg-dark-800 border border-white/5 rounded-2xl p-5 h-fit"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white">Tra cứu function</h2>
              <p className="text-sm text-gray-400 mt-1">
                API contract đề xuất: GET /api/events/:eventId/metrics.
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-300 mb-1">
              EventID <span className="text-red-300">*</span>
            </label>
            <input
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Ví dụ: EV003"
              className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
            />
            <FieldError message={showEventIdError ? eventIdError : ''} />

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading || Boolean(eventIdError)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Tính toán
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors disabled:opacity-60"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </form>

          <section className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Gauge size={20} className="text-primary" />
              <h2 className="text-xl font-semibold text-white">Kết quả</h2>
            </div>

            {loading ? (
              <div className="py-14 flex flex-col items-center justify-center gap-3 text-gray-400">
                <Loader2 className="animate-spin text-primary" size={28} />
                <p>Đang gọi function qua API contract...</p>
              </div>
            ) : metrics ? (
              <div className="grid md:grid-cols-2 gap-4">
                <ResultBlock
                  label="Mức bao phủ sức chứa"
                  value={metrics.capacityCoverageLabel || 'Chưa có kết quả'}
                  helper="fn_Event_CapacityCoverageLabel(@EventID)"
                />
                <ResultBlock
                  label="Tổng phí thuê đã xác nhận"
                  value={formatCurrencyFull(metrics.totalConfirmedRentalFee)}
                  helper="fn_Event_TotalConfirmedRentalFee(@EventID)"
                />
              </div>
            ) : (
              <div className="py-14 text-center text-gray-400">
                <p>Nhập EventID và bấm Tính toán để xem kết quả function.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </motion.div>
  );
}

function ResultBlock({ label, value, helper }) {
  return (
    <div className="rounded-xl bg-dark-700 border border-white/5 px-4 py-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-2 break-words">{value}</p>
      <p className="text-xs text-gray-500 mt-2">{helper}</p>
    </div>
  );
}