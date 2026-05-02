import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  Edit3,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  EmptyState,
  ErrorState,
  FieldError,
  LoadingState,
  NoticeBanner,
} from '../components/product/ProductUi';
import { formatCurrencyFull } from '../utils/formatCurrency';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from '../services/productApi';
import { mapProductFormToPayload } from '../utils/productManagementMappers';

const PRODUCT_TYPES = ['Bắp', 'Nước', 'Combo', 'Khác'];
const PRODUCT_STATUSES = ['Đang bán', 'Tạm ngừng', 'Ngừng kinh doanh'];

const EMPTY_FORM = {
  productId: '',
  productName: '',
  productType: 'Bắp',
  basePrice: '',
  productStatus: 'Đang bán',
};

const FIELD_ERROR_KEYS = {
  ProductID: 'productId',
  productID: 'productId',
  ProductName: 'productName',
  ProductType: 'productType',
  BasePrice: 'basePrice',
  ProductStatus: 'productStatus',
};

function toForm(product) {
  if (!product) return { ...EMPTY_FORM };

  return {
    productId: product.productId || '',
    productName: product.productName || '',
    productType: product.productType || 'Bắp',
    basePrice: product.basePrice === null || product.basePrice === undefined
      ? ''
      : String(product.basePrice),
    productStatus: product.productStatus || 'Đang bán',
  };
}

function validateProductForm(form) {
  const errors = {};
  const productId = form.productId.trim();
  const productName = form.productName.trim();
  const basePrice = Number(form.basePrice);

  if (!productId) {
    errors.productId = 'Mã sản phẩm không được để trống.';
  } else if (productId.length > 20) {
    errors.productId = 'Mã sản phẩm tối đa 20 ký tự.';
  }

  if (!productName) {
    errors.productName = 'Tên sản phẩm không được để trống.';
  } else if (productName.length > 100) {
    errors.productName = 'Tên sản phẩm tối đa 100 ký tự.';
  }

  if (!PRODUCT_TYPES.includes(form.productType)) {
    errors.productType = 'Loại sản phẩm không hợp lệ.';
  }

  if (form.basePrice === '') {
    errors.basePrice = 'Giá cơ bản không được để trống.';
  } else if (!Number.isFinite(basePrice)) {
    errors.basePrice = 'Giá cơ bản phải là số hợp lệ.';
  } else if (basePrice < 0) {
    errors.basePrice = 'Giá cơ bản phải lớn hơn hoặc bằng 0.';
  }

  if (!PRODUCT_STATUSES.includes(form.productStatus)) {
    errors.productStatus = 'Trạng thái sản phẩm không hợp lệ.';
  }

  return errors;
}

function normalizeFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return {};

  return Object.entries(fieldErrors).reduce((errors, [key, value]) => {
    const normalizedKey = FIELD_ERROR_KEYS[key] || key;
    errors[normalizedKey] = Array.isArray(value) ? value.join(' ') : String(value);
    return errors;
  }, {});
}

function getErrorMessage(error, fallback) {
  return error?.data?.message || error?.message || fallback;
}

function filterProducts(products, searchTerm) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return products;

  return products.filter((product) =>
    [
      product.productId,
      product.productName,
      product.productType,
      product.productStatus,
    ].some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch))
  );
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const editing = Boolean(editingId);

  const validationErrors = useMemo(() => validateProductForm(form), [form]);
  const formValid = Object.keys(validationErrors).length === 0;

  const displayErrors = useMemo(() => {
    return Object.keys({ ...validationErrors, ...serverErrors }).reduce((errors, key) => {
      if (serverErrors[key] || touched[key] || submitAttempted) {
        errors[key] = serverErrors[key] || validationErrors[key];
      }
      return errors;
    }, {});
  }, [serverErrors, submitAttempted, touched, validationErrors]);

  const filteredProducts = useMemo(
    () => filterProducts(products, searchTerm),
    [products, searchTerm]
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      setLoadError(
        getErrorMessage(error, 'Không thể tải danh sách PRODUCT từ API contract GET /api/products.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setServerErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((current) => ({
      ...current,
      [name]: true,
    }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId('');
    setTouched({});
    setSubmitAttempted(false);
    setServerErrors({});
  };

  const selectProductForEdit = (product) => {
    setForm(toForm(product));
    setEditingId(product.productId);
    setTouched({});
    setSubmitAttempted(false);
    setServerErrors({});
    setNotice(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (!formValid) return;

    try {
      setSubmitting(true);
      setNotice(null);
      setServerErrors({});

      const payload = mapProductFormToPayload(form);
      const savedProduct = editing
        ? await updateProduct(editingId, payload)
        : await createProduct(payload);

      setNotice({
        type: 'success',
        message: editing
          ? `Đã gửi yêu cầu cập nhật sản phẩm ${payload.ProductID}.`
          : `Đã gửi yêu cầu thêm sản phẩm ${payload.ProductID}.`,
      });

      await loadProducts();

      if (savedProduct) {
        setForm(toForm(savedProduct));
        setEditingId(savedProduct.productId);
      } else if (!editing) {
        resetForm();
      }
    } catch (error) {
      setServerErrors(normalizeFieldErrors(error.fieldErrors));
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Không thể lưu sản phẩm.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.productId) return;

    try {
      setDeleteLoading(true);
      await deleteProduct(deleteTarget.productId);
      setNotice({
        type: 'success',
        message: `Đã gửi yêu cầu xóa sản phẩm ${deleteTarget.productId}.`,
      });
      setDeleteTarget(null);

      if (editingId === deleteTarget.productId) {
        resetForm();
      }

      await loadProducts();
    } catch (error) {
      setDeleteTarget(null);
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Không thể xóa sản phẩm.'),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <section className="mb-8">
        <div className="flex items-center gap-3 text-primary mb-3">
          <Boxes size={22} />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Product - Phần 3.1
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Quản lý sản phẩm
        </h1>
        <p className="text-gray-400 max-w-3xl">
          Thêm, cập nhật và xóa PRODUCT qua API contract tương ứng với
          sp_InsertProduct, sp_UpdateProduct và sp_DeleteProduct.
        </p>
      </section>

      <div className="space-y-5">
        {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}

        <section className="grid xl:grid-cols-[420px_1fr] gap-6">
          <form
            onSubmit={handleSubmit}
            className="bg-dark-800 border border-white/5 rounded-2xl p-5 h-fit"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editing ? `Đang sửa ${editingId}` : 'Tạo bản ghi PRODUCT mới'}
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-200 text-sm transition-colors"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextField
                name="productId"
                label="ProductID"
                value={form.productId}
                error={displayErrors.productId}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={editing}
                required
              />
              <TextField
                name="productName"
                label="ProductName"
                value={form.productName}
                error={displayErrors.productName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <SelectField
                name="productType"
                label="ProductType"
                value={form.productType}
                options={PRODUCT_TYPES}
                error={displayErrors.productType}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <TextField
                name="basePrice"
                label="BasePrice"
                type="number"
                min="0"
                step="1000"
                value={form.basePrice}
                error={displayErrors.basePrice}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <div className="sm:col-span-2">
                <SelectField
                  name="productStatus"
                  label="ProductStatus"
                  value={form.productStatus}
                  options={PRODUCT_STATUSES}
                  error={displayErrors.productStatus}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
              Khi xóa, SQL chỉ cho phép xóa sản phẩm có trạng thái Ngừng kinh doanh
              và không phát sinh đơn hàng trong ngày hiện tại.
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting || !formValid}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editing ? 'Lưu cập nhật' : 'Thêm sản phẩm'}
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ ...form })}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                >
                  <Trash2 size={16} />
                  Xóa sản phẩm
                </button>
              ) : null}
            </div>
          </form>

          <section className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/5">
              <div>
                <h2 className="text-xl font-semibold text-white">Danh sách PRODUCT</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Nguồn dữ liệu từ API contract GET /api/products.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm mã, tên, loại..."
                    className="w-full sm:w-64 rounded-lg bg-dark-700 border border-white/10 pl-9 pr-3 py-2 text-white outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={loadProducts}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingState label="Đang tải danh sách sản phẩm..." />
            ) : loadError ? (
              <ErrorState description={loadError} onRetry={loadProducts} />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                title="Chưa có sản phẩm"
                description="API đã phản hồi nhưng chưa có PRODUCT phù hợp."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-sm">
                  <thead className="bg-dark-700/70 text-gray-400">
                    <tr>
                      <TableHeader>ProductID</TableHeader>
                      <TableHeader>ProductName</TableHeader>
                      <TableHeader>ProductType</TableHeader>
                      <TableHeader>BasePrice</TableHeader>
                      <TableHeader>ProductStatus</TableHeader>
                      <TableHeader>Thao tác</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.productId}
                        className={`hover:bg-white/[0.03] ${
                          editingId === product.productId ? 'bg-primary/5' : ''
                        }`}
                      >
                        <TableCell className="font-semibold text-white">
                          {product.productId}
                        </TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.productType}</TableCell>
                        <TableCell>{formatCurrencyFull(product.basePrice)}</TableCell>
                        <TableCell>
                          <ProductStatusBadge status={product.productStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => selectProductForEdit(product)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
                            >
                              <Edit3 size={14} />
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(product)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white transition-colors"
                            >
                              <Trash2 size={14} />
                              Xóa
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa sản phẩm"
        description={`Bạn có chắc muốn xóa ${
          deleteTarget?.productName || deleteTarget?.productId || 'sản phẩm này'
        }? Theo sp_DeleteProduct, sản phẩm phải ở trạng thái Ngừng kinh doanh và không phát sinh đơn hàng trong ngày hiện tại.`}
        confirmLabel="Xóa sản phẩm"
        cancelLabel="Hủy"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </motion.div>
  );
}

function TextField({
  name,
  label,
  value,
  error,
  type = 'text',
  min,
  step,
  disabled = false,
  required = false,
  onChange,
  onBlur,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
        {required ? <span className="text-red-300"> *</span> : null}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        min={min}
        step={step}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary disabled:opacity-70 disabled:cursor-not-allowed"
      />
      <FieldError message={error} />
    </div>
  );
}

function SelectField({ name, label, value, options, error, onChange, onBlur }) {
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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

function ProductStatusBadge({ status }) {
  const className =
    status === 'Đang bán'
      ? 'bg-success/10 text-green-300 border-success/30'
      : status === 'Tạm ngừng'
        ? 'bg-warning/10 text-yellow-300 border-warning/30'
        : 'bg-red-500/10 text-red-300 border-red-500/30';

  return (
    <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${className}`}>
      {status || 'Chưa rõ'}
    </span>
  );
}
