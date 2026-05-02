import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Database,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import {
  createProduct,
  deleteProduct,
  fetchProductCatalog,
  previewProductRevenue,
  updateProduct,
} from '../services/productManagementApi';

const EMPTY_FORM = {
  productId: '',
  productName: '',
  productType: 'Combo',
  basePrice: '',
  productStatus: 'Đang bán',
};

const PRODUCT_TYPES = ['Combo', 'Bắp', 'Nước', 'Snack', 'Khác'];
const PRODUCT_STATUSES = ['Đang bán', 'Ngừng bán', 'Hết hàng', 'Tạm ngưng'];

const SORT_OPTIONS = [
  { value: 'productId', label: 'Mã sản phẩm' },
  { value: 'name', label: 'Tên sản phẩm' },
  { value: 'type', label: 'Loại' },
  { value: 'price', label: 'Giá bán' },
  { value: 'status', label: 'Trạng thái' },
  { value: 'usage', label: 'Lượt dùng' },
  { value: 'revenue', label: 'Doanh thu' },
];

function validateProductForm(form, editing) {
  const errors = {};
  const price = Number(form.basePrice);

  if (!editing) {
    if (!form.productId.trim()) {
      errors.productId = 'Vui lòng nhập mã sản phẩm.';
    } else if (!/^[A-Za-z0-9_-]{2,20}$/.test(form.productId.trim())) {
      errors.productId =
        'Mã dài 2-20 ký tự, chỉ gồm chữ, số, gạch dưới hoặc gạch ngang.';
    }
  }

  if (!form.productName.trim()) {
    errors.productName = 'Vui lòng nhập tên sản phẩm.';
  } else if (form.productName.trim().length < 2) {
    errors.productName = 'Tên sản phẩm phải có ít nhất 2 ký tự.';
  }

  if (!form.productType) {
    errors.productType = 'Vui lòng chọn loại sản phẩm.';
  }

  if (!Number.isFinite(price)) {
    errors.basePrice = 'Giá bán phải là số hợp lệ.';
  } else if (price <= 0) {
    errors.basePrice = 'Giá bán phải lớn hơn 0.';
  } else if (price > 10000000) {
    errors.basePrice = 'Giá bán không được vượt quá 10.000.000đ.';
  }

  if (!form.productStatus) {
    errors.productStatus = 'Vui lòng chọn trạng thái.';
  }

  return errors;
}

function validatePreviewForm(form) {
  const errors = {};
  const quantity = Number(form.quantity);

  if (!form.productId) {
    errors.productId = 'Vui lòng chọn sản phẩm.';
  }

  if (!Number.isInteger(quantity)) {
    errors.quantity = 'Số lượng phải là số nguyên.';
  } else if (quantity <= 0) {
    errors.quantity = 'Số lượng phải lớn hơn 0.';
  } else if (quantity > 500) {
    errors.quantity = 'Số lượng tối đa là 500.';
  }

  return errors;
}

function getServerFieldErrors(error) {
  return error?.fieldErrors && typeof error.fieldErrors === 'object'
    ? error.fieldErrors
    : {};
}

export default function DatabaseDemoPage() {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    sortBy: 'productId',
    sortOrder: 'asc',
  });
  const [products, setProducts] = useState([]);
  const [catalogMeta, setCatalogMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [previewForm, setPreviewForm] = useState({ productId: '', quantity: 1 });
  const [previewErrors, setPreviewErrors] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await fetchProductCatalog(filters);

        if (cancelled) return;
        setProducts(data.items);
        setCatalogMeta({
          routine: data.routine,
          source: data.source,
          filters: data.filters,
        });

        if (data.items[0]?.productId) {
          setPreviewForm((current) => ({
            ...current,
            productId: current.productId || data.items[0].productId,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setNotice({
            type: 'error',
            message:
              error.message ||
              'Không thể tải danh sách sản phẩm từ cơ sở dữ liệu.',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters, refreshKey]);

  const stats = useMemo(() => {
    return products.reduce(
      (acc, product) => ({
        count: acc.count + 1,
        active: acc.active + (product.productStatus === 'Đang bán' ? 1 : 0),
        sold: acc.sold + product.totalSold,
        revenue: acc.revenue + product.totalRevenue,
      }),
      { count: 0, active: 0, sold: 0, revenue: 0 }
    );
  }, [products]);

  const typeOptions = useMemo(
    () => [...new Set([...PRODUCT_TYPES, ...products.map((p) => p.productType).filter(Boolean)])],
    [products]
  );
  const statusOptions = useMemo(
    () => [
      ...new Set([
        ...PRODUCT_STATUSES,
        ...products.map((p) => p.productStatus).filter(Boolean),
      ]),
    ],
    [products]
  );

  const editing = Boolean(editingProductId);

  const resetForm = () => {
    setEditingProductId('');
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const editProduct = (product) => {
    setEditingProductId(product.productId);
    setForm({
      productId: product.productId,
      productName: product.productName,
      productType: product.productType || 'Combo',
      basePrice: String(product.basePrice || ''),
      productStatus: product.productStatus || 'Đang bán',
    });
    setFormErrors({});
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    const errors = validateProductForm(form, editing);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      productId: form.productId.trim(),
      productName: form.productName.trim(),
      productType: form.productType,
      basePrice: Number(form.basePrice),
      productStatus: form.productStatus,
    };

    try {
      setSaving(true);
      setFormErrors({});

      if (editing) {
        await updateProduct(editingProductId, payload);
        setNotice({ type: 'success', message: 'Đã cập nhật sản phẩm.' });
      } else {
        await createProduct(payload);
        setNotice({ type: 'success', message: 'Đã thêm sản phẩm mới.' });
      }

      resetForm();
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setFormErrors(getServerFieldErrors(error));
      setNotice({
        type: 'error',
        message: error.message || 'Không thể lưu sản phẩm.',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    try {
      setDeleteLoading(true);
      await deleteProduct(deleting.productId);
      setNotice({
        type: 'success',
        message: `Đã xóa "${deleting.productName}".`,
      });

      if (editingProductId === deleting.productId) {
        resetForm();
      }

      setDeleting(null);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice({
        type: 'error',
        message:
          error.message ||
          'Không thể xóa sản phẩm do ràng buộc dữ liệu trong cơ sở dữ liệu.',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const submitPreview = async (event) => {
    event.preventDefault();
    const errors = validatePreviewForm(previewForm);

    if (Object.keys(errors).length > 0) {
      setPreviewErrors(errors);
      return;
    }

    try {
      setPreviewLoading(true);
      setPreviewErrors({});
      const data = await previewProductRevenue({
        productId: previewForm.productId,
        quantity: Number(previewForm.quantity),
      });

      setPreviewResult(data);
      setNotice({
        type: 'success',
        message: 'Đã gọi hàm tính doanh thu sản phẩm.',
      });
    } catch (error) {
      setPreviewErrors(getServerFieldErrors(error));
      setNotice({
        type: 'error',
        message: error.message || 'Không thể gọi hàm tính doanh thu.',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Database size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Kết nối CSDL
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white">
            Quản lý sản phẩm
          </h1>
          <p className="text-gray-400 mt-2">
            CRUD bảng PRODUCT, danh sách từ thủ tục và gọi hàm tính doanh thu.
          </p>
        </div>

        <button
          onClick={() => setRefreshKey((value) => value + 1)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white border border-white/10 transition-colors"
        >
          <RefreshCw size={16} />
          Tải lại dữ liệu
        </button>
      </div>

      {notice && (
        <Notice notice={notice} onClose={() => setNotice(null)} />
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Metric label="Sản phẩm" value={stats.count} />
        <Metric label="Đang bán" value={stats.active} />
        <Metric label="Đã bán" value={stats.sold} />
        <Metric label="Doanh thu" value={formatCurrency(stats.revenue)} />
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-6">
        <section className="bg-dark-800 rounded-xl border border-white/5 p-5 h-fit">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Bảng PRODUCT
              </p>
            </div>
            {editing ? (
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-dark-700 hover:bg-dark-600 text-gray-200"
              >
                <Plus size={14} />
                Tạo mới
              </button>
            ) : null}
          </div>

          <form onSubmit={submitProduct} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Mã sản phẩm
              </label>
              <input
                value={form.productId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    productId: event.target.value,
                  }))
                }
                disabled={editing}
                className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary disabled:opacity-60"
                placeholder="VD: P012"
              />
              <FieldError message={formErrors.productId} />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Tên sản phẩm
              </label>
              <input
                value={form.productName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    productName: event.target.value,
                  }))
                }
                className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                placeholder="Combo bắp nước"
              />
              <FieldError message={formErrors.productName} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Loại
                </label>
                <select
                  value={form.productType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      productType: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <FieldError message={formErrors.productType} />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Giá bán
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.basePrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      basePrice: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                  placeholder="75000"
                />
                <FieldError message={formErrors.basePrice} />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Trạng thái
              </label>
              <select
                value={form.productStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    productStatus: event.target.value,
                  }))
                }
                className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <FieldError message={formErrors.productStatus} />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editing ? 'Cập nhật' : 'Thêm sản phẩm'}
            </button>
          </form>

          <div className="mt-6 border-t border-white/5 pt-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calculator size={18} className="text-primary" />
              Hàm tính doanh thu
            </h2>
            <form onSubmit={submitPreview} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Sản phẩm
                </label>
                <select
                  value={previewForm.productId}
                  onChange={(event) =>
                    setPreviewForm((current) => ({
                      ...current,
                      productId: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                >
                  <option value="">Chọn sản phẩm</option>
                  {products.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.productId} - {product.productName}
                    </option>
                  ))}
                </select>
                <FieldError message={previewErrors.productId} />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  value={previewForm.quantity}
                  onChange={(event) =>
                    setPreviewForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                />
                <FieldError message={previewErrors.quantity} />
              </div>

              <button
                type="submit"
                disabled={previewLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-dark-700 hover:bg-dark-600 border border-white/10 text-white font-semibold px-4 py-2.5 transition-colors disabled:opacity-60"
              >
                {previewLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Calculator size={16} />
                )}
                Gọi hàm
              </button>
            </form>

            {previewResult && (
              <div className="mt-4 rounded-lg bg-dark-700/70 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-400">Kết quả</p>
                  <SourceBadge source={previewResult.source} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Routine</p>
                  <p className="text-sm text-gray-200 break-all">
                    {previewResult.routine}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoValue label="Đơn giá" value={formatCurrency(previewResult.unitPrice)} />
                  <InfoValue label="Tạm tính" value={formatCurrency(previewResult.estimatedTotal)} />
                  <InfoValue label="Đã bán" value={previewResult.usage?.totalSold || 0} />
                  <InfoValue
                    label="Doanh thu cũ"
                    value={formatCurrency(previewResult.usage?.totalRevenue || 0)}
                  />
                </div>
                {previewResult.warnings?.map((warning) => (
                  <p key={warning} className="text-xs text-warning">
                    {warning}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-dark-800 rounded-xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Danh sách sản phẩm
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <span>{catalogMeta?.routine || 'dbo.sp_ProductCatalogForManagement'}</span>
                  {catalogMeta?.source && <SourceBadge source={catalogMeta.source} />}
                </div>
              </div>

              <button
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors"
              >
                <Plus size={16} />
                Tạo mới
              </button>
            </div>

            <div className="mt-5 grid md:grid-cols-[1fr_150px_150px] xl:grid-cols-[1fr_150px_150px_160px_120px] gap-3">
              <label className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  placeholder="Tìm theo mã, tên, loại"
                  className="w-full rounded-lg bg-dark-700 border border-white/10 pl-9 pr-3 py-2 text-white outline-none focus:border-primary"
                />
              </label>

              <select
                value={filters.type}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                className="rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
              >
                <option value="">Tất cả loại</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                className="rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
              >
                <option value="">Tất cả trạng thái</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={filters.sortBy}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sortBy: event.target.value,
                  }))
                }
                className="rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.sortOrder}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                className="rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="animate-spin text-primary" size={28} />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p>Không có sản phẩm phù hợp.</p>
              <button
                onClick={resetForm}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white"
              >
                <Plus size={16} />
                Thêm sản phẩm
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-dark-700/60 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="text-left px-5 py-3">Mã</th>
                    <th className="text-left px-5 py-3">Tên sản phẩm</th>
                    <th className="text-left px-5 py-3">Loại</th>
                    <th className="text-right px-5 py-3">Giá</th>
                    <th className="text-left px-5 py-3">Trạng thái</th>
                    <th className="text-right px-5 py-3">Đã bán</th>
                    <th className="text-right px-5 py-3">Doanh thu</th>
                    <th className="text-right px-5 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((product) => (
                    <tr
                      key={product.productId}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-5 py-4 font-semibold text-white">
                        {product.productId}
                      </td>
                      <td className="px-5 py-4 text-gray-200">
                        {product.productName}
                        <p className="text-xs text-gray-500 mt-1">
                          {product.orderUsageCount} chi tiết đơn hàng
                        </p>
                      </td>
                      <td className="px-5 py-4 text-gray-300">
                        {product.productType}
                      </td>
                      <td className="px-5 py-4 text-right text-gray-200">
                        {formatCurrency(product.basePrice)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={product.productStatus} />
                      </td>
                      <td className="px-5 py-4 text-right text-gray-300">
                        {product.totalSold}
                      </td>
                      <td className="px-5 py-4 text-right text-gray-200">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => editProduct(product)}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-200"
                            title="Sửa"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleting(product)}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300"
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {deleting && (
        <ConfirmDialog
          product={deleting}
          loading={deleteLoading}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </motion.div>
  );
}

function Notice({ notice, onClose }) {
  const isSuccess = notice.type === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`mb-5 rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${
        isSuccess
          ? 'bg-success/10 border-success/30 text-green-200'
          : 'bg-error/10 border-error/30 text-red-200'
      }`}
    >
      <div className="flex gap-3">
        <Icon size={18} className="mt-0.5 flex-shrink-0" />
        <p className="text-sm">{notice.message}</p>
      </div>
      <button onClick={onClose} className="text-white/70 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-dark-800 border border-white/5 px-4 py-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;

  return <p className="text-xs text-red-300 mt-1">{message}</p>;
}

function StatusBadge({ status }) {
  const active = status === 'Đang bán';

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${
        active
          ? 'bg-success/10 text-green-300 border-success/30'
          : 'bg-warning/10 text-yellow-300 border-warning/30'
      }`}
    >
      {status || 'Chưa rõ'}
    </span>
  );
}

function SourceBadge({ source }) {
  const isProcedure = source === 'stored_procedure' || source === 'sql_function';

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${
        isProcedure
          ? 'bg-info/10 text-blue-300 border-info/30'
          : 'bg-warning/10 text-yellow-300 border-warning/30'
      }`}
    >
      {isProcedure ? 'DB routine' : 'Fallback query'}
    </span>
  );
}

function InfoValue({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}

function ConfirmDialog({ product, loading, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-dark-800 border border-white/10 shadow-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-300 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Xóa sản phẩm
            </h2>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
              Xóa "{product.productName}" khỏi bảng PRODUCT? Nếu sản phẩm đã
              phát sinh chi tiết đơn hàng, hệ thống sẽ chặn thao tác này.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-200 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
