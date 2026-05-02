import { Search } from 'lucide-react';
import {
  PRODUCT_TYPE_OPTIONS,
  SUMMARY_SORT_OPTIONS,
} from '../../constants/productManagementOptions';
import { FieldError } from './ProductUi';

export default function ProductSummaryFilters({
  filters,
  errors,
  onFilterChange,
  onApply,
  onReset,
  searchTerm = '',
  onSearchChange,
  sortBy = 'totalRevenue',
  sortOrder = 'desc',
  onSortByChange,
  onSortOrderChange,
  showSearchSort = true,
}) {
  return (
    <div className="space-y-4">
      <form onSubmit={onApply} className="space-y-4">
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">ProductType</label>
            <select
              name="productType"
              value={filters.productType}
              onChange={onFilterChange}
              className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
            >
              <option value="">Tất cả loại</option>
              {PRODUCT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.productType} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">FromDate</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={onFilterChange}
              className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
            />
            <FieldError message={errors.fromDate} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">ToDate</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={onFilterChange}
              className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
            />
            <FieldError message={errors.toDate} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">MinTotalQuantity</label>
            <input
              type="number"
              min="0"
              name="minTotalQuantity"
              value={filters.minTotalQuantity}
              onChange={onFilterChange}
              className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
              placeholder="0"
            />
            <FieldError message={errors.minTotalQuantity} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">MinTotalRevenue</label>
            <input
              type="number"
              min="0"
              name="minTotalRevenue"
              value={filters.minTotalRevenue}
              onChange={onFilterChange}
              className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
              placeholder="0"
            />
            <FieldError message={errors.minTotalRevenue} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2 transition-colors"
          >
            Áp dụng bộ lọc
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-lg bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 transition-colors"
          >
            Đặt lại
          </button>
        </div>
      </form>

      {showSearchSort ? (
        <div className="grid lg:grid-cols-[1fr_220px_160px] gap-3">
          <label className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={searchTerm}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Tìm theo mã, tên, loại hoặc trạng thái"
              className="w-full rounded-lg bg-dark-700 border border-white/10 pl-9 pr-3 py-2 text-white outline-none focus:border-primary"
            />
          </label>

          <select
            value={sortBy}
            onChange={(event) => onSortByChange?.(event.target.value)}
            className="rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
          >
            {SUMMARY_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(event) => onSortOrderChange?.(event.target.value)}
            className="rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>
        </div>
      ) : null}
    </div>
  );
}
