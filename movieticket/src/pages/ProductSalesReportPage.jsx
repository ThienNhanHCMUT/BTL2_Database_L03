import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  FieldError,
  LoadingState,
  MetricCard,
  RoutineBadge,
  StatusBadge,
} from '../components/product/ProductUi';
import { fetchProductSalesSummary } from '../services/productApi';
import { formatCurrencyFull } from '../utils/formatCurrency';
import {
  filterProductSummaryRows,
  getErrorMessage,
  sortProductSummaryRows,
} from '../utils/productManagementMappers';

const PRODUCT_TYPES = ['Bắp', 'Nước', 'Combo', 'Khác'];

const EMPTY_FILTERS = {
  productType: '',
  fromDate: '',
  toDate: '',
  minTotalQuantity: '0',
  minTotalRevenue: '0',
};

const SORT_OPTIONS = [
  {
    value: 'procedure',
    label: 'Theo ORDER BY procedure',
  },
  {
    value: 'totalRevenue-desc',
    label: 'TotalRevenue giảm dần',
  },
  {
    value: 'totalQuantitySold-desc',
    label: 'TotalQuantitySold giảm dần',
  },
  {
    value: 'productName-asc',
    label: 'ProductName A-Z',
  },
];

function validateFilters(filters) {
  const errors = {};
  const minTotalQuantity = Number(filters.minTotalQuantity);
  const minTotalRevenue = Number(filters.minTotalRevenue);

  if (filters.productType && !PRODUCT_TYPES.includes(filters.productType)) {
    errors.productType = 'ProductType không hợp lệ theo CHECK constraint.';
  }

  if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
    errors.toDate = 'ToDate phải lớn hơn hoặc bằng FromDate.';
  }

  if (filters.minTotalQuantity !== '') {
    if (!Number.isFinite(minTotalQuantity)) {
      errors.minTotalQuantity = 'MinTotalQuantity phải là số hợp lệ.';
    } else if (!Number.isInteger(minTotalQuantity)) {
      errors.minTotalQuantity = 'MinTotalQuantity phải là số nguyên.';
    } else if (minTotalQuantity < 0) {
      errors.minTotalQuantity = 'MinTotalQuantity phải lớn hơn hoặc bằng 0.';
    }
  }

  if (filters.minTotalRevenue !== '') {
    if (!Number.isFinite(minTotalRevenue)) {
      errors.minTotalRevenue = 'MinTotalRevenue phải là số hợp lệ.';
    } else if (minTotalRevenue < 0) {
      errors.minTotalRevenue = 'MinTotalRevenue phải lớn hơn hoặc bằng 0.';
    }
  }

  return errors;
}

function normalizeFilters(filters) {
  return {
    productType: filters.productType || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    minTotalQuantity:
      filters.minTotalQuantity === '' ? undefined : Number(filters.minTotalQuantity),
    minTotalRevenue:
      filters.minTotalRevenue === '' ? undefined : Number(filters.minTotalRevenue),
  };
}

function applySort(rows, sortValue) {
  if (sortValue === 'procedure') return rows;

  const [sortBy, sortOrder] = sortValue.split('-');
  return sortProductSummaryRows(rows, sortBy, sortOrder);
}

export default function ProductSalesReportPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortValue, setSortValue] = useState('procedure');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const validationErrors = useMemo(() => validateFilters(filters), [filters]);
  const formValid = Object.keys(validationErrors).length === 0;

  const displayErrors = useMemo(() => {
    return Object.keys(validationErrors).reduce((errors, key) => {
      if (touched[key] || submitAttempted) {
        errors[key] = validationErrors[key];
      }
      return errors;
    }, {});
  }, [submitAttempted, touched, validationErrors]);

  const visibleRows = useMemo(() => {
    const searchedRows = filterProductSummaryRows(rows, searchTerm);
    return applySort(searchedRows, sortValue);
  }, [rows, searchTerm, sortValue]);

  const summary = useMemo(() => {
    return visibleRows.reduce(
      (total, row) => ({
        products: total.products + 1,
        quantity: total.quantity + Number(row.totalQuantitySold || 0),
        revenue: total.revenue + Number(row.totalRevenue || 0),
      }),
      { products: 0, quantity: 0, revenue: 0 }
    );
  }, [visibleRows]);

  const loadSummary = async (nextFilters = filters) => {
    const errors = validateFilters(nextFilters);
    setSubmitAttempted(true);

    if (Object.keys(errors).length > 0) return;

    try {
      setLoading(true);
      setLoadError('');
      const data = await fetchProductSalesSummary(normalizeFilters(nextFilters));
      setRows(data.items || []);
      setMeta(data.meta || null);
      setHasLoaded(true);
    } catch (error) {
      setRows([]);
      setMeta(null);
      setLoadError(
        getErrorMessage(
          error,
          'Không thể tải thống kê sản phẩm từ API contract GET /api/products/sales-summary.'
        )
      );
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadSummary(EMPTY_FILTERS);
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((current) => ({
      ...current,
      [name]: true,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    loadSummary(filters);
  };

  const handleReset = () => {
    setFilters({ ...EMPTY_FILTERS });
    setTouched({});
    setSubmitAttempted(false);
    setSearchTerm('');
    setSortValue('procedure');
    loadSummary(EMPTY_FILTERS);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <section className="mb-8">
        <div className="flex items-center gap-3 text-primary mb-3">
          <BarChart3 size={22} />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Product - Phần 3.2
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Thống kê sản phẩm
        </h1>
        <p className="text-gray-400 max-w-3xl">
          Hiển thị dữ liệu từ procedure sp_GetProductSalesSummary với filter theo
          ProductType, khoảng ngày bán, ngưỡng số lượng và ngưỡng doanh thu.
        </p>
      </section>

      <section className="grid lg:grid-cols-[360px_1fr] gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-dark-800 border border-white/5 rounded-2xl p-5 h-fit"
        >
          <div className="flex items-center gap-2 mb-5">
            <Filter size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-white">Bộ lọc</h2>
          </div>

          <div className="space-y-4">
            <SelectField
              name="productType"
              label="ProductType"
              value={filters.productType}
              error={displayErrors.productType}
              onChange={handleFilterChange}
              onBlur={handleBlur}
            />

            <DateField
              name="fromDate"
              label="FromDate"
              value={filters.fromDate}
              error={displayErrors.fromDate}
              onChange={handleFilterChange}
              onBlur={handleBlur}
            />

            <DateField
              name="toDate"
              label="ToDate"
              value={filters.toDate}
              error={displayErrors.toDate}
              onChange={handleFilterChange}
              onBlur={handleBlur}
            />

            <NumberField
              name="minTotalQuantity"
              label="MinTotalQuantity"
              value={filters.minTotalQuantity}
              error={displayErrors.minTotalQuantity}
              min="0"
              step="1"
              onChange={handleFilterChange}
              onBlur={handleBlur}
            />

            <NumberField
              name="minTotalRevenue"
              label="MinTotalRevenue"
              value={filters.minTotalRevenue}
              error={displayErrors.minTotalRevenue}
              min="0"
              step="1000"
              onChange={handleFilterChange}
              onBlur={handleBlur}
            />
          </div>

          <div className="mt-5 rounded-xl border border-info/20 bg-info/10 px-4 py-3 text-sm text-blue-100">
            Backend sau này cần gọi sp_GetProductSalesSummary với các tham số SQL
            tương ứng: @ProductType, @FromDate, @ToDate, @MinTotalQuantity,
            @MinTotalRevenue.
          </div>

          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={loading || !formValid}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors disabled:opacity-60"
            >
              <Search size={16} />
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-200 font-semibold transition-colors disabled:opacity-60"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </form>

        <section className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <MetricCard label="Sản phẩm tìm thấy" value={summary.products} />
            <MetricCard label="Tổng số lượng bán" value={summary.quantity} />
            <MetricCard
              label="Tổng doanh thu"
              value={formatCurrencyFull(summary.revenue)}
            />
          </div>

          <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold text-white">Kết quả thống kê</h2>
                  <RoutineBadge label={meta?.routine || 'sp_GetProductSalesSummary'} />
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  API contract: GET /api/products/sales-summary.
                </p>
              </div>

              <div className="grid sm:grid-cols-[1fr_220px_auto] gap-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm mã, tên, loại..."
                    className="w-full rounded-lg bg-dark-700 border border-white/10 pl-9 pr-3 py-2 text-white outline-none focus:border-primary"
                  />
                </div>
                <select
                  value={sortValue}
                  onChange={(event) => setSortValue(event.target.value)}
                  className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => loadSummary(filters)}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors disabled:opacity-60"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingState label="Đang tải thống kê sản phẩm..." />
            ) : loadError ? (
              <ErrorState description={loadError} onRetry={() => loadSummary(filters)} />
            ) : hasLoaded && visibleRows.length === 0 ? (
              <EmptyState
                title="Không có dữ liệu thống kê"
                description="API đã phản hồi nhưng không có sản phẩm phù hợp với bộ lọc hiện tại."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-dark-700/70 text-gray-400">
                    <tr>
                      <TableHeader>ProductID</TableHeader>
                      <TableHeader>ProductName</TableHeader>
                      <TableHeader>ProductType</TableHeader>
                      <TableHeader>ProductStatus</TableHeader>
                      <TableHeader className="text-right">TotalOrders</TableHeader>
                      <TableHeader className="text-right">TotalQuantitySold</TableHeader>
                      <TableHeader className="text-right">TotalRevenue</TableHeader>
                      <TableHeader>Thao tác</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {visibleRows.map((row) => (
                      <tr key={row.productId} className="hover:bg-white/[0.03]">
                        <TableCell className="font-semibold text-white">
                          {row.productId}
                        </TableCell>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell>{row.productType}</TableCell>
                        <TableCell>
                          <StatusBadge status={row.productStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          {row.totalOrders.toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.totalQuantitySold.toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-white">
                          {formatCurrencyFull(row.totalRevenue)}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => navigate('/products-management')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
                          >
                            Quản lý
                            <ArrowRight size={14} />
                          </button>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </section>
    </motion.div>
  );
}

function SelectField({ name, label, value, error, onChange, onBlur }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
      >
        <option value="">Tất cả</option>
        {PRODUCT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

function DateField({ name, label, value, error, onChange, onBlur }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
      />
      <FieldError message={error} />
    </div>
  );
}

function NumberField({
  name,
  label,
  value,
  error,
  min,
  step,
  onChange,
  onBlur,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        name={name}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
      />
      <FieldError message={error} />
    </div>
  );
}

function TableHeader({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </th>
  );
}

function TableCell({ children, className = '' }) {
  return <td className={`px-4 py-3 align-top text-gray-300 ${className}`}>{children}</td>;
}
