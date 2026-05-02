import { NavLink } from 'react-router-dom';

const PRODUCT_MANAGEMENT_TABS = [
  { to: '/database/products', label: 'Danh sách & thống kê' },
  { to: '/database/products/crud', label: 'CRUD sản phẩm' },
  { to: '/database/products/analytics', label: 'Hàm & phân tích' },
];

export default function ProductManagementTabs() {
  return (
    <nav className="flex flex-wrap gap-2">
      {PRODUCT_MANAGEMENT_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/database/products'}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-dark-800 text-gray-300 hover:text-white hover:bg-dark-700'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
