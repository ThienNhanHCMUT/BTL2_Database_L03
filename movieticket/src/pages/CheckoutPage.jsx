import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Tag, Info, Check } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import PaymentMethods from '../components/checkout/PaymentMethods';
import BookingSummary from '../components/booking/BookingSummary';
import ProgressStepper from '../components/common/ProgressStepper';
import { requestJson } from '../services/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    movie,
    showtime,
    selectedSeats,
    selectedCombos,
    applyPromo,
    confirmOrder,
    promoCode,
    holdToken,
  } = useBooking();
  const { user, isLoggedIn } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [activePromotions, setActivePromotions] = useState([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promotionsError, setPromotionsError] = useState(null);
  const [showPromotionList, setShowPromotionList] = useState(false);

  const [contactInfo, setContactInfo] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!movie || selectedSeats.length === 0) navigate('/movies');
  }, [movie, selectedSeats, navigate]);

  useEffect(() => {
  fetchActivePromotions();
  }, []);

  const handleSelectPromotion = (voucherId) => {
  setPromoInput(voucherId);
  setShowPromotionList(false);
  };

  const formatPromotionText = (voucher) => {
    const valueText =
    voucher.discountType === 'Percent'
      ? `Giảm ${voucher.value}%`
      : `Giảm ${Number(voucher.value || 0).toLocaleString('vi-VN')}đ`;

    const conditionText = voucher.applyCondition
    ? ` • ${voucher.applyCondition}`
    : '';

    return `${valueText}${conditionText}`;
  };

  const fetchActivePromotions = async () => {
  try {
    setPromotionsLoading(true);
    setPromotionsError(null);

    const data = await requestJson('/promotions/active');

    setActivePromotions(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    setPromotionsError(err.message || 'Không thể tải danh sách voucher');
  } finally {
    setPromotionsLoading(false);
  }
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code || !showtime?.showtimeId) return;

    try {
      setPromoLoading(true);
      setPromoMessage(null);

      const data = await requestJson('/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoCode: code,
          showtimeId: showtime.showtimeId,
          selectedSeats,
          selectedCombos,
          holdToken: holdToken || null,
        }),
      });

      if (data.valid) {
        applyPromo({
          code: data.voucherId || code,
          discountAmount: data.discountAmount,
        });

        setPromoMessage({
          type: 'success',
          text: `✓ Áp dụng thành công${
            data.discountAmount
              ? ` - giảm ${Number(data.discountAmount).toLocaleString('vi-VN')}đ`
              : ''
          }`,
        });
      } else {
        setPromoMessage({
          type: 'error',
          text: data.message || '✗ Mã không hợp lệ',
        });
      }
    } catch (err) {
      console.error(err);
      setPromoMessage({
        type: 'error',
        text: '✗ Không thể kiểm tra mã giảm giá',
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!contactInfo.name || !contactInfo.email || !contactInfo.phone) {
      alert('Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }

    if (!showtime?.showtimeId) {
      alert('Thiếu thông tin suất chiếu');
      return;
    }

    try {
      setConfirmLoading(true);

      const data = await requestJson('/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: user?.personId || null,
          customer: contactInfo,
          paymentMethod,
          promoCode: promoCode || null,
          showtimeId: showtime.showtimeId,
          selectedSeats,
          selectedCombos,
          holdToken: holdToken || null,
          bookingPlatform: 'Website',
          deliveryMethod: 'QR Code',
          orderNote: 'Đặt vé online từ website',
        }),
      });

      confirmOrder({
        orderId: data.orderId,
        customer: contactInfo,
        paymentMethod,
        transactionId: data.transactionId,
        paymentStatus: data.paymentStatus,
        voucherId: data.voucherId || null,
      });

      navigate(`/booking/${data.orderId}`);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Có lỗi xảy ra khi xác nhận thanh toán');
    } finally {
      setConfirmLoading(false);
    }
  };

  if (!movie) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ProgressStepper currentStep={5} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <h1 className="font-display text-2xl sm:text-3xl text-white">Thanh toán</h1>

            <section className="bg-dark-800 rounded-2xl p-6 border border-white/5">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Thông tin khách hàng
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Họ và tên"
                  value={contactInfo.name}
                  onChange={(v) => setContactInfo({ ...contactInfo, name: v })}
                  placeholder="Nguyễn Văn A"
                />
                <Field
                  label="Số điện thoại"
                  value={contactInfo.phone}
                  onChange={(v) => setContactInfo({ ...contactInfo, phone: v })}
                  placeholder="0912345678"
                />
                <Field
                  className="sm:col-span-2"
                  label="Email"
                  value={contactInfo.email}
                  onChange={(v) => setContactInfo({ ...contactInfo, email: v })}
                  placeholder="you@example.com"
                  type="email"
                />
              </div>

              {!isLoggedIn && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2 text-sm text-blue-300">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Đơn guest vẫn thanh toán được. Khi cần chuẩn hơn, bạn có thể làm thêm flow tạo
                    guest customer thật trong DB.
                  </span>
                </div>
              )}
            </section>

            <section className="bg-dark-800 rounded-2xl p-6 border border-white/5">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Mã giảm giá
              </h2>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Nhập VoucherID, ví dụ V001"
                    className="w-full bg-dark-700 text-white placeholder-gray-500 pl-9 pr-3 py-3 rounded-lg border border-white/5 focus:border-primary outline-none uppercase"
                  />
                </div>

                <button
                  onClick={handleApplyPromo}
                  disabled={promoLoading}
                  className="px-5 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
                >
                  {promoLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
              </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowPromotionList((prev) => !prev)}
                className="text-sm text-primary hover:underline"
              >
                {showPromotionList ? 'Ẩn voucher khả dụng' : 'Xem voucher khả dụng'}
              </button>

              {showPromotionList && (
                <div className="mt-3 space-y-2">
                  {promotionsLoading && (
                    <p className="text-sm text-gray-400">Đang tải voucher...</p>
                  )}

                  {promotionsError && (
                    <p className="text-sm text-red-400">{promotionsError}</p>
                  )}

                  {!promotionsLoading && !promotionsError && activePromotions.length === 0 && (
                    <p className="text-sm text-gray-400">Hiện chưa có voucher khả dụng.</p>
                  )}

                  {!promotionsLoading &&
                    !promotionsError &&
                    activePromotions.map((voucher) => (
                      <button
                        key={voucher.voucherId}
                        type="button"
                        onClick={() => handleSelectPromotion(voucher.voucherId)}
                        className="w-full text-left p-3 rounded-lg border border-white/10 bg-dark-700 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{voucher.voucherId}</p>
                            <p className="text-sm text-gray-400">
                              {formatPromotionText(voucher)}
                            </p>
                          </div>

                          <span className="text-sm text-primary font-medium">Chọn</span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

              {promoMessage && (
                <p
                  className={`mt-2 text-sm flex items-center gap-1 ${
                    promoMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {promoMessage.type === 'success' && <Check size={14} />}
                  {promoMessage.text}
                </p>
              )}
            </section>

            <section className="bg-dark-800 rounded-2xl p-6 border border-white/5">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                Phương thức thanh toán
              </h2>

              <PaymentMethods selected={paymentMethod} onSelect={setPaymentMethod} />
            </section>
          </div>

          <div>
            <BookingSummary
              onContinue={handleConfirm}
              continueLabel={confirmLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              disabled={confirmLoading}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-dark-700 text-white placeholder-gray-500 px-3 py-2.5 rounded-lg border border-white/5 focus:border-primary outline-none"
      />
    </div>
  );
}
