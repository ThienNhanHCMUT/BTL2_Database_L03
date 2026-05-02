import { Link } from 'react-router-dom';
import { Film, Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 bg-dark-800 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Film size={20} className="text-white" />
              </div>
              <span className="font-display text-lg">
                <span className="text-primary">Movie</span>
                <span className="text-white">Ticket</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Hệ thống đặt vé xem phim trực tuyến hàng đầu Việt Nam. Đặt vé nhanh, chọn ghế dễ dàng.
            </p>
            <div className="flex gap-3 mt-4">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Khám phá</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/movies" className="text-gray-400 hover:text-primary transition-colors">Phim đang chiếu</Link></li>
              <li><Link to="/movies?tab=coming-soon" className="text-gray-400 hover:text-primary transition-colors">Phim sắp chiếu</Link></li>
              <li><Link to="/cinemas" className="text-gray-400 hover:text-primary transition-colors">Hệ thống rạp</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Khuyến mãi</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Điều khoản</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="text-gray-400 hover:text-primary transition-colors">Liên hệ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>ĐH Bách Khoa TP.HCM, Q.10</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} />
                <span>1900 0085</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} />
                <span>hello@movieticket.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            © 2026 MovieTicket — Dự án môn Hệ CSDL, Nhóm 4, ĐHBK TP.HCM
          </p>
          <p className="text-xs text-gray-500">
            Made with <span className="text-primary">♥</span> in Vietnam
          </p>
        </div>
      </div>
    </footer>
  );
}
