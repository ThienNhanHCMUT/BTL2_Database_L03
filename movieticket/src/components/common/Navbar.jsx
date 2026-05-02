import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, Menu, X, Film } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { path: '/', label: 'Trang chủ' },
  { path: '/movies', label: 'Phim' },
  { path: '/cinemas', label: 'Rạp chiếu' },
  { path: '/events', label: 'Sự kiện' },
  { path: '/event-organizer-summary', label: 'Tổng hợp tổ chức' },
  { path: '/event-analytics', label: 'Phân tích sự kiện' },
  { path: '/products-management', label: 'Quản lý sản phẩm' },
  { path: '/product-sales-summary', label: 'Thống kê sản phẩm' },
  { path: '/customer-net-value', label: 'Giá trị khách hàng' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isLoggedIn, logout, authLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActiveLink = (path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Film size={20} className="text-white" />
          </div>
          <span className="font-display text-lg tracking-tight hidden sm:block">
            <span className="text-primary">Movie</span>
            <span className="text-white">Ticket</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActiveLink(link.path)
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm phim..."
                className="bg-dark-700 text-white text-sm px-3 py-1.5 rounded-lg border border-white/10 focus:border-primary outline-none w-40 sm:w-56"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Search size={20} />
            </button>
          )}

          {authLoading ? (
            <div className="px-3 py-1.5 text-sm text-gray-400">...</div>
          ) : isLoggedIn ? (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
                <span className="text-sm text-gray-300 hidden sm:block">
                  {user?.fullName || 'Tài khoản'}
                </span>
              </button>

              <div className="absolute right-0 top-full mt-1 w-56 py-2 bg-dark-600 rounded-lg border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="px-4 py-2 border-b border-white/5">
                  <p className="text-sm text-white font-medium line-clamp-1">
                    {user?.fullName || 'Người dùng'}
                  </p>
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {user?.email || ''}
                  </p>
                </div>

                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5"
                >
                  Tài khoản
                </Link>

                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
            >
              <User size={16} />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-white/5 px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                isActiveLink(link.path)
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isLoggedIn && (
            <>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white"
              >
                Tài khoản
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300"
              >
                Đăng xuất
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
