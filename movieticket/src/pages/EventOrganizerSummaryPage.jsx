import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Filter, RefreshCw, RotateCcw, Search } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  FieldError,
  LoadingState,
} from '../components/product/ProductUi';
import { formatCurrencyFull } from '../utils/formatCurrency';
import { fetchOrganizerEventSummary } from '../services/eventApi';

const EVENT_STATUSES = ['Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Đã hoàn thành'];

const EMPTY_FILTERS = {
  eventStatus: '',
  budgetFloor: '0',
  minEventCount: '1',
  minConfirmedRentalFee: '0',
};

const SORT_OPTIONS = [
  { value: 'sql', label: 'Theo ORDER BY của procedure' },
  { value: 'rentalFeeDesc', label: 'Phí thuê xác nhận giảm dần' },
  { value: 'eventCountDesc', label: 'Số sự kiện giảm dần' },
  { value: 'budgetDesc', label: 'Ngân sách kế hoạch giảm dần' },
  { value: 'orgNameAsc', label: 'Tên tổ chức A-Z' },
];

function validateFilters(filters) {
  const errors = {};
  const budgetFloor = Number(filters.budgetFloor);
  const minEventCount = Number(filters.minEventCount);
  const minConfirmedRentalFee = Number(filters.minConfirmedRentalFee);

  if (filters.eventStatus && !EVENT_STATUSES.includes(filters.eventStatus)) {
    errors.eventStatus = 'Trạng thái lọc không hợp lệ.';
  }

  if (Number.isNaN(budgetFloor) || budgetFloor < 0) {
    errors.budgetFloor = 'Ngân sách tối thiểu phải lớn hơn hoặc bằng 0.';
  }

  if (!Number.isInteger(minEventCount) || minEventCount < 1) {
    errors.minEventCount = 'Số sự kiện tối thiểu phải là số nguyên từ 1.';
  }

  if (Number.isNaN(minConfirmedRentalFee) || minConfirmedRentalFee < 0) {
    errors.minConfirmedRentalFee = 'Phí thuê xác nhận tối thiểu không được âm.';
  }

  return errors;
}

function sortRows(rows, sortKey) {
  const sorted = [...rows];

  if (sortKey === 'rentalFeeDesc') {
    return sorted.sort((a, b) => b.totalConfirmedRentalFee - a.totalConfirmedRentalFee);
  }

  if (sortKey === 'eventCountDesc') {
    return sorted.sort((a, b) => b.eventCount - a.eventCount);
  }

  if (sortKey === 'budgetDesc') {
    return sorted.sort((a, b) => b.totalPlannedBudget - a.totalPlannedBudget);
  }

  if (sortKey === 'orgNameAsc') {
    return sorted.sort((a, b) => a.orgName.localeCompare(b.orgName, 'vi'));
  }

  return sorted;
}

function getErrorMessage(error, fallback) {
  return error?.data?.message || error?.message || fallback;
}

export default function EventOrganizerSummaryPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [filterErrors, setFilterErrors] = useState({});
  const [sortKey, setSortKey] = useState('sql');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sortedRows = useMemo(() => sortRows(rows, sortKey), [rows, sortKey]);

  const loadSummary = async (filtersToUse = activeFilters) => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchOrganizerEventSummary(filtersToUse);
      setRows(data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Không thể tải tổng hợp nhà tổ chức từ API contract GET /api/event-organizer-summary.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadSummary(EMPTY_FILTERS);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
    setFilterErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextFilters = {
      eventStatus: filters.eventStatus,
      budgetFloor: filters.budgetFloor === '' ? '0' : filters.budgetFloor,
      minEventCount: filters.minEventCount === '' ? '1' : filters.minEventCount,
      minConfirmedRentalFee:
        filters.minConfirmedRentalFee === '' ? '0' : filters.minConfirmedRentalFee,
    };
    const errors = validateFilters(nextFilters);

    if (Object.keys(errors).length > 0) {
      setFilterErrors(errors);
      return;
    }

    setFilterErrors({});
    setActiveFilters(nextFilters);
    loadSummary(nextFilters);
  };

  const resetFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setActiveFilters({ ...EMPTY_FILTERS });
    setFilterErrors({});
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
            Procedure 2.3
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Tổng hợp nhà tổ chức
        </h1>
        <p className="text-gray-400 max-w-3xl">
          Giao diện gọi usp_Organizer_Event_Summary để xem tổng hợp số sự kiện,
          ngân sách kế hoạch và phí thuê đã xác nhận theo từng nhà tổ chức.
        </p>
      </section>

      <section className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="p-5 border-b border-white/5 bg-dark-900/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-white">
              Bộ lọc WHERE/HAVING
            </h2>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Trạng thái sự kiện
              </label>
              <select
                name="eventStatus"
                value={filters.eventStatus}
                onChange={handleChange}
                className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
              >
                <option value="">Tất cả trạng thái</option>
                {EVENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <FieldError message={filterErrors.eventStatus} />
            </div>

            <NumberField
              name="budgetFloor"
              label="Ngân sách tối thiểu"
              value={filters.budgetFloor}
              error={filterErrors.budgetFloor}
              onChange={handleChange}
            />
            <NumberField
              name="minEventCount"
              label="Số sự kiện tối thiểu"
              value={filters.minEventCount}
              error={filterErrors.minEventCount}
              min="1"
              step="1"
              onChange={handleChange}
            />
            <NumberField
              name="minConfirmedRentalFee"
              label="Phí thuê xác nhận tối thiểu"
              value={filters.minConfirmedRentalFee}
              error={filterErrors.minConfirmedRentalFee}
              onChange={handleChange}
            />
          </div>

          <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sắp xếp phía frontend
              </label>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value)}
                className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors"
              >
                <Search size={16} />
                Xem tổng hợp
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
              >
                <RotateCcw size={16} />
                Reset
              </button>
              <button
                type="button"
                onClick={() => loadSummary()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <LoadingState label="Đang tải tổng hợp nhà tổ chức..." />
        ) : error ? (
          <ErrorState description={error} onRetry={() => loadSummary()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu tổng hợp"
            description="API đã phản hồi nhưng không có nhà tổ chức nào đạt điều kiện lọc."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-dark-700/70 text-gray-400">
                <tr>
                  <TableHeader>Mã tổ chức</TableHeader>
                  <TableHeader>Tên tổ chức</TableHeader>
                  <TableHeader>Loại</TableHeader>
                  <TableHeader>Số sự kiện</TableHeader>
                  <TableHeader>Ngân sách kế hoạch</TableHeader>
                  <TableHeader>Phí thuê xác nhận</TableHeader>
                  <TableHeader>Phiên xác nhận</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedRows.map((row) => (
                  <tr key={row.organizerId} className="hover:bg-white/[0.03]">
                    <TableCell className="font-semibold text-white">
                      {row.organizerId}
                    </TableCell>
                    <TableCell>{row.orgName}</TableCell>
                    <TableCell>{row.organizerType}</TableCell>
                    <TableCell>{row.eventCount}</TableCell>
                    <TableCell>{formatCurrencyFull(row.totalPlannedBudget)}</TableCell>
                    <TableCell>{formatCurrencyFull(row.totalConfirmedRentalFee)}</TableCell>
                    <TableCell>{row.totalConfirmedSessionCount}</TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
}

function NumberField({ name, label, value, error, min = '0', step = '1000000', onChange }) {
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
        className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
      />
      <FieldError message={error} />
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}

function TableCell({ children, className = '' }) {
  return <td className={`px-4 py-3 align-top text-gray-300 ${className}`}>{children}</td>;
}
