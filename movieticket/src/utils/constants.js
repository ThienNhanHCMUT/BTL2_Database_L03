export const AGE_RATINGS = {
  P: { label: 'P', desc: 'Phổ biến cho mọi lứa tuổi', color: 'bg-green-600' },
  K: { label: 'K', desc: 'Dưới 13 tuổi với phụ huynh', color: 'bg-blue-500' },
  T13: { label: 'T13', desc: 'Từ 13 tuổi trở lên', color: 'bg-yellow-500' },
  T16: { label: 'T16', desc: 'Từ 16 tuổi trở lên', color: 'bg-orange-500' },
  T18: { label: 'T18', desc: 'Từ 18 tuổi trở lên', color: 'bg-red-600' },
  C: { label: 'C', desc: 'Cấm phổ biến', color: 'bg-red-900' },
};

export const SEAT_TYPES = {
  'Thường': { color: '#4A5568', label: 'Thường', surcharge: 1.0 },
  'VIP': { color: '#D69E2E', label: 'VIP', surcharge: 1.5 },
  'Đôi': { color: '#E53E8C', label: 'Ghế đôi', surcharge: 2.0 },
};

export const SEAT_STATUS = {
  AVAILABLE: 'available',
  SELECTED: 'selected',
  BOOKED: 'booked',
  BROKEN: 'broken',
};

export const SHOW_FORMATS = ['2D', '3D', 'IMAX', '4DX'];
export const SHOW_LANGUAGES = ['Lồng tiếng', 'Phụ đề Việt', 'Phụ đề Anh'];

export const DAY_TYPES = {
  'Thường': 1.0,
  'Cuối tuần': 1.2,
  'Ngày lễ': 1.5,
};

export const PAYMENT_METHODS = [
  { id: 'momo', name: 'Ví MoMo', icon: '💜', desc: 'Thanh toán qua ví MoMo' },
  { id: 'domestic', name: 'Thẻ nội địa', icon: '🏦', desc: 'ATM / Internet Banking' },
  { id: 'international', name: 'Thẻ quốc tế', icon: '💳', desc: 'Visa / Mastercard / JCB' },
  { id: 'zalopay', name: 'ZaloPay', icon: '💙', desc: 'Thanh toán qua ZaloPay' },
];

export const BOOKING_STEPS = [
  { step: 1, label: 'Chọn phim' },
  { step: 2, label: 'Suất chiếu' },
  { step: 3, label: 'Chọn ghế' },
  { step: 4, label: 'Combo' },
  { step: 5, label: 'Thanh toán' },
  { step: 6, label: 'Xác nhận' },
];

export const MAX_SEATS = 8;
export const BOOKING_TIMEOUT = 600; // seconds
