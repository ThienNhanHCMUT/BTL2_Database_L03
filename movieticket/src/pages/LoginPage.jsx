import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Mail,
  Phone,
  Film,
  ArrowRight,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Nam',
    houseNo: '',
    street: '',
    ward: '',
    city: '',
  });
  const [error, setError] = useState('');

  const update = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        if (!formData.identifier || !formData.password) {
          setError('Vui lòng nhập tên đăng nhập/email và mật khẩu');
          return;
        }

        const result = await login(formData.identifier, formData.password);

        if (result.success) {
          navigate('/');
        } else {
          setError(result.error);
        }
      } else {
        const requiredFields = [
          'fullName',
          'email',
          'phone',
          'username',
          'password',
          'dateOfBirth',
          'gender',
          'street',
          'ward',
          'city',
        ];

        const missing = requiredFields.some((key) => !String(formData[key] || '').trim());

        if (missing) {
          setError('Vui lòng điền đầy đủ thông tin đăng ký');
          return;
        }

        const result = await register({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          username: formData.username,
          password: formData.password,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          houseNo: formData.houseNo,
          street: formData.street,
          ward: formData.ward,
          city: formData.city,
        });

        if (result.success) {
          navigate('/');
        } else {
          setError(result.error);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8"
    >
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/30">
            <Film size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl text-white">
            <span className="text-primary">Movie</span>Ticket
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {mode === 'login' ? 'Chào mừng bạn trở lại' : 'Tạo tài khoản mới'}
          </p>
        </div>

        <div className="grid grid-cols-2 p-1 bg-dark-800 rounded-lg mb-6 border border-white/5">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError('');
              }}
              className={`py-2.5 text-sm font-semibold rounded transition-colors ${
                mode === m ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-dark-800 rounded-2xl p-6 border border-white/5 space-y-4"
        >
          {mode === 'register' && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  icon={User}
                  placeholder="Họ và tên"
                  value={formData.fullName}
                  onChange={(v) => update('fullName', v)}
                />
                <Field
                  icon={Mail}
                  placeholder="Email"
                  value={formData.email}
                  onChange={(v) => update('email', v)}
                  type="email"
                />
                <Field
                  icon={Phone}
                  placeholder="Số điện thoại"
                  value={formData.phone}
                  onChange={(v) => update('phone', v)}
                />
                <Field
                  icon={CalendarDays}
                  placeholder="Ngày sinh"
                  value={formData.dateOfBirth}
                  onChange={(v) => update('dateOfBirth', v)}
                  type="date"
                />
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    value={formData.gender}
                    onChange={(e) => update('gender', e.target.value)}
                    className="w-full bg-dark-700 text-white pl-10 pr-3 py-3 rounded-lg border border-white/5 focus:border-primary outline-none transition-colors"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <Field
                  icon={MapPin}
                  placeholder="Số nhà"
                  value={formData.houseNo}
                  onChange={(v) => update('houseNo', v)}
                />
                <Field
                  icon={MapPin}
                  placeholder="Đường"
                  value={formData.street}
                  onChange={(v) => update('street', v)}
                />
                <Field
                  icon={MapPin}
                  placeholder="Phường/Xã"
                  value={formData.ward}
                  onChange={(v) => update('ward', v)}
                />
                <Field
                  icon={MapPin}
                  placeholder="Thành phố"
                  value={formData.city}
                  onChange={(v) => update('city', v)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  icon={User}
                  placeholder="Tên đăng nhập"
                  value={formData.username}
                  onChange={(v) => update('username', v)}
                />
                <Field
                  icon={Lock}
                  placeholder="Mật khẩu"
                  value={formData.password}
                  onChange={(v) => update('password', v)}
                  type="password"
                />
              </div>
            </>
          )}

          {mode === 'login' && (
            <>
              <Field
                icon={User}
                placeholder="Tên đăng nhập hoặc email"
                value={formData.identifier}
                onChange={(v) => update('identifier', v)}
              />
              <Field
                icon={Lock}
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={(v) => update('password', v)}
                type="password"
              />
            </>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {mode === 'login' && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs text-blue-300 leading-relaxed">
              💡 Dùng tài khoản đã có trong DB hoặc đăng ký mới ngay bên dưới.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            {submitting
              ? mode === 'login'
                ? 'Đang đăng nhập...'
                : 'Đang tạo tài khoản...'
              : mode === 'login'
                ? 'Đăng nhập'
                : 'Tạo tài khoản'}
            <ArrowRight size={16} />
          </button>

          <p className="text-center text-xs text-gray-500">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-primary hover:underline font-medium"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          <Link to="/" className="hover:text-white">
            ← Quay về trang chủ
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

function Field({ icon: Icon, placeholder, value, onChange, type = 'text' }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-dark-700 text-white placeholder-gray-500 pl-10 pr-3 py-3 rounded-lg border border-white/5 focus:border-primary outline-none transition-colors"
      />
    </div>
  );
}