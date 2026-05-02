import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ProductPageShell from '../components/product/ProductPageShell';
import ProductSalesSummaryTable from '../components/product/ProductSalesSummaryTable';
import ProductSummaryFilters from '../components/product/ProductSummaryFilters';
import {
  MetricCard,
  NoticeBanner,
  RoutineBadge,
} from '../components/product/ProductUi';
import { EMPTY_PRODUCT_SUMMARY_FILTERS } from '../constants/productManagementOptions';
import { useProductSalesSummary } from '../hooks/useProductSalesSummary';
import { deleteProduct } from '../services/productApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  filterProductSummaryRows,
  getErrorMessage,
  sortProductSummaryRows,
} from '../utils/productManagementMappers';
import { validateProductSummaryFilters } from '../utils/productManagementValidation';

export default function ProductSalesSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [notice, setNotice] = useState(location.state?.notice || null);
  const [filters, setFilters] = useState(EMPTY_PRODUCT_SUMMARY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_PRODUCT_SUMMARY_FILTERS);
  const [filterErrors, setFilterErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalRevenue');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { rows, meta, loading, error, refresh } = useProductSalesSummary(appliedFilters);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!location.state?.notice) return;

    setNotice(location.state.notice);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const visibleRows = useMemo(() => {
    const filteredRows = filterProductSummaryRows(rows, searchTerm);
    return sortProductSummaryRows(filteredRows, sortBy, sortOrder);
  }, [rows, searchTerm, sortBy, sortOrder]);

  const metrics = useMemo(() => {
    return rows.reduce(
      (accumulator, row) => ({
        totalProducts: accumulator.totalProducts + 1,
        totalOrders: accumulator.totalOrders + row.totalOrders,
        totalQuantitySold: accumulator.totalQuantitySold + row.totalQuantitySold,
        totalRevenue: accumulator.totalRevenue + row.totalRevenue,
      }),
      {
        totalProducts: 0,
        totalOrders: 0,
        totalQuantitySold: 0,
        totalRevenue: 0,
      }
    );
  }, [rows]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
    setFilterErrors((currentValue) => ({
      ...currentValue,
      [name]: '',
    }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();

    const errors = validateProductSummaryFilters(filters);
    setFilterErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_PRODUCT_SUMMARY_FILTERS);
    setAppliedFilters(EMPTY_PRODUCT_SUMMARY_FILTERS);
    setFilterErrors({});
    setSearchTerm('');
    setSortBy('totalRevenue');
    setSortOrder('desc');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      await deleteProduct(deleteTarget.productId);
      setDeleteTarget(null);
      setNotice({
        type: 'success',
        message: `Đã xóa sản phẩm ${deleteTarget.productId}.`,
      });
      refresh();
    } catch (requestError) {
      setNotice({
        type: 'error',
        message: getErrorMessage(requestError, 'Không thể xóa sản phẩm.'),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <ProductPageShell
      title="Danh sách sản phẩm và thống kê bán hàng"
      description="Route 3.2 dùng để xem dữ liệu từ thủ tục thống kê sản phẩm, lọc theo tham số đầu vào và thao tác nhanh thêm, sửa, xóa."
      actions={
        <>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-white border border-white/10 transition-colors"
          >
            <RefreshCw size={16} />
            Tải lại
          </button>

          <button
            type="button"
            onClick={() => navigate('/database/products/crud')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors"
          >
            <Plus size={16} />
            Thêm sản phẩm
          </button>
        </>
      }
    >
      {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Sản phẩm" value={metrics.totalProducts} />
        <MetricCard label="Tổng đơn hàng" value={metrics.totalOrders} />
        <MetricCard label="Tổng số lượng bán" value={metrics.totalQuantitySold} />
        <MetricCard label="Tổng doanh thu" value={formatCurrency(metrics.totalRevenue)} />
      </div>

      <section className="bg-dark-800 rounded-xl border border-white/5 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Bộ lọc thủ tục thống kê</h2>
            <p className="text-sm text-gray-400 mt-1">
              Frontend gọi theo contract `GET /api/products/sales-summary`.
            </p>
          </div>

          <RoutineBadge label={meta?.routine || 'sp_GetProductSalesSummary'} />
        </div>

        <ProductSummaryFilters
          filters={filters}
          errors={filterErrors}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
        />
      </section>

      <section className="bg-dark-800 rounded-xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Kết quả thống kê</h2>
            <p className="text-sm text-gray-400 mt-1">
              {visibleRows.length} dòng đang hiển thị
              {searchTerm ? ` sau khi tìm kiếm "${searchTerm}"` : ''}.
            </p>
          </div>

          <p className="text-xs text-gray-500">
            Xóa sẽ gọi endpoint thật, sau đó tải lại bảng.
          </p>
        </div>

        <ProductSalesSummaryTable
          rows={visibleRows}
          loading={loading}
          error={error}
          onRetry={refresh}
          onCreate={() => navigate('/database/products/crud')}
          onEdit={(product) =>
            navigate(`/database/products/crud?productId=${encodeURIComponent(product.productId)}`, {
              state: { product, mode: 'edit' },
            })
          }
          onDelete={setDeleteTarget}
        />
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa sản phẩm"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xóa ${deleteTarget.productId} - ${deleteTarget.productName}?`
            : ''
        }
        confirmLabel="Xóa sản phẩm"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </ProductPageShell>
  );
}
