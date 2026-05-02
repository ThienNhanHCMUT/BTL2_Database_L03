import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Shield,
  Star,
  Coins,
  BadgeCheck,
  LogOut,
  Ticket,
  CreditCard,
  Film,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ACCESS_TOKEN_KEY, requestJson } from '../services/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, authLoading, reloadMe, logout } = useAuth();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const syncProfileAndBookings = async () => {
      try {
        setLoadingProfile(true);
        setLoadingBookings(true);
        setError('');

        await reloadMe();

        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const data = await requestJson('/users/me/bookings', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Không thể tải thông tin tài khoản');
      } finally {
        setLoadingProfile(false);
        setLoadingBookings(false);
      }
    };

    syncProfileAndBookings();
  }, [authLoading, isLoggedIn, navigate, reloadMe]);

  const displayUser = user;

  if (authLoading || loadingProfile) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="bg-dark-800 rounded-2xl border border-white/5 p-8 text-center text-gray-400">
            Đang tải thông tin tài khoản...
          </div>
        </div>
      </motion.div>
    );
  }

  if (!displayUser) return null;

  const addressText =
    displayUser.address?.fullAddress ||
    [
      displayUser.address?.houseNo,
      displayUser.address?.street,
      displayUser.address?.ward,
      displayUser.address?.city,
    ]
      .filter(Boolean)
      .join(', ') ||
    'Chưa cập nhật';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
            Tài khoản của tôi
          </h1>
          <p className="text-gray-400">
            Xem thông tin cá nhân và lịch sử đặt vé của bạn
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-yellow-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <div className="bg-dark-800 rounded-2xl border border-white/5 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
                <User size={36} className="text-primary" />
              </div>

              <h2 className="text-white text-xl font-semibold mb-1">
                {displayUser.fullName || 'Chưa có tên'}
              </h2>

              <p className="text-sm text-gray-400 mb-4">
                @{displayUser.username || 'username'}
              </p>

              <div className="w-full space-y-3">
                <StatCard
                  icon={Coins}
                  label="Điểm thưởng"
                  value={displayUser.currentPoints ?? 0}
                />
                <StatCard
                  icon={Star}
                  label="Hạng thành viên"
                  value={displayUser.rank || 'Bronze'}
                />
                <StatCard
                  icon={BadgeCheck}
                  label="Trạng thái"
                  value={displayUser.accountStatus || 'Active'}
                />
              </div>

              <button
                onClick={handleLogout}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl font-semibold text-sm transition-colors"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-dark-800 rounded-2xl border border-white/5 p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Thông tin cá nhân</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <InfoCard icon={User} label="Họ và tên" value={displayUser.fullName} />
                <InfoCard icon={User} label="Tên đăng nhập" value={displayUser.username} />
                <InfoCard icon={Mail} label="Email" value={displayUser.email} />
                <InfoCard icon={Phone} label="Số điện thoại" value={displayUser.phone} />
                <InfoCard
                  icon={CalendarDays}
                  label="Ngày sinh"
                  value={formatDate(displayUser.dateOfBirth)}
                />
                <InfoCard icon={Shield} label="Giới tính" value={displayUser.gender} />
              </div>
            </div>

            <div className="bg-dark-800 rounded-2xl border border-white/5 p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Địa chỉ</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <InfoCard
                  icon={MapPin}
                  label="Số nhà"
                  value={displayUser.address?.houseNo || 'Chưa cập nhật'}
                />
                <InfoCard
                  icon={MapPin}
                  label="Đường"
                  value={displayUser.address?.street || 'Chưa cập nhật'}
                />
                <InfoCard
                  icon={MapPin}
                  label="Phường/Xã"
                  value={displayUser.address?.ward || 'Chưa cập nhật'}
                />
                <InfoCard
                  icon={MapPin}
                  label="Thành phố"
                  value={displayUser.address?.city || 'Chưa cập nhật'}
                />
              </div>

              <div className="mt-4 rounded-xl bg-dark-900/50 border border-white/5 p-4">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Địa chỉ đầy đủ</p>
                <p className="text-white">{addressText}</p>
              </div>
            </div>

            <div className="bg-dark-800 rounded-2xl border border-white/5 p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Thông tin hệ thống</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <InfoCard icon={Shield} label="Person ID" value={displayUser.personId} />
                <InfoCard icon={Shield} label="Customer ID" value={displayUser.customerId} />
                <InfoCard icon={Shield} label="Role" value={displayUser.role} />
                <InfoCard
                  icon={CalendarDays}
                  label="Ngày đăng ký"
                  value={formatDate(displayUser.registrationDate)}
                />
              </div>
            </div>

            <div className="bg-dark-800 rounded-2xl border border-white/5 p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-white text-lg font-semibold">Lịch sử đặt vé</h3>
                  <p className="text-sm text-gray-400">
                    Xem lại các đơn hàng bạn đã đặt gần đây
                  </p>
                </div>
              </div>

              {loadingBookings ? (
                <div className="rounded-xl bg-dark-900/40 border border-white/5 p-6 text-center text-gray-400">
                  Đang tải lịch sử đặt vé...
                </div>
              ) : bookings.length === 0 ? (
                <div className="rounded-xl bg-dark-900/40 border border-white/5 p-6 text-center text-gray-400">
                  Bạn chưa có đơn hàng nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.orderId}
                      className="rounded-2xl bg-dark-900/40 border border-white/5 p-5"
                    >
                      <div className="grid lg:grid-cols-[1fr_auto] gap-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-white text-lg font-semibold">
                              {booking.booking?.movie?.vnTitle || 'Đơn hàng'}
                            </p>
                            <p className="text-sm text-gray-400">
                              Mã đơn: {booking.orderId}
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <MiniInfo
                              icon={Film}
                              label="Rạp"
                              value={booking.booking?.cinema?.name || '—'}
                            />
                            <MiniInfo
                              icon={Ticket}
                              label="Ghế"
                              value={booking.seatLabels || '—'}
                            />
                            <MiniInfo
                              icon={CalendarDays}
                              label="Suất chiếu"
                              value={formatDateTime(booking.booking?.showtime?.startTime)}
                            />
                            <MiniInfo
                              icon={CreditCard}
                              label="Thanh toán"
                              value={booking.payment?.paymentStatus || '—'}
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs">
                            <Tag text={`${booking.ticketCount || 0} vé`} />
                            <Tag text={`${booking.comboCount || 0} combo`} />
                            <Tag text={booking.booking?.showtime?.format || '—'} />
                            <Tag text={booking.booking?.showtime?.language || '—'} />
                          </div>
                        </div>

                        <div className="flex flex-col justify-between gap-3 lg:items-end">
                          <div className="text-left lg:text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                              Tổng tiền
                            </p>
                            <p className="text-primary text-2xl font-bold">
                              {formatCurrency(booking.summary?.grandTotal || 0)}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                            <Link
                              to={`/booking/${booking.orderId}`}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 border border-white/10 text-white rounded-xl font-semibold text-sm transition-colors"
                            >
                              Xem chi tiết
                            </Link>
                            <Link
                              to={`/booking/confirmation/${booking.orderId}`}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-colors"
                            >
                              Vé điện tử
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-dark-900/40 border border-white/5 p-4">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 uppercase tracking-wide">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className="text-white font-medium break-words">{value || 'Chưa cập nhật'}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-dark-900/40 border border-white/5 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="text-left">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-white font-semibold">{value}</p>
      </div>
    </div>
  );
}

function MiniInfo({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-dark-800/70 border border-white/5 p-3">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1 uppercase tracking-wide">
        <Icon size={12} />
        <span>{label}</span>
      </div>
      <p className="text-white font-medium">{value || '—'}</p>
    </div>
  );
}

function Tag({ text }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
      {text}
    </span>
  );
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return date.toLocaleDateString('vi-VN');
}

function formatDateTime(value) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}
