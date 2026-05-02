import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ProductForm from '../components/product/ProductForm';
import ProductPageShell from '../components/product/ProductPageShell';
import { InfoValue, NoticeBanner } from '../components/product/ProductUi';
import { createEmptyProductForm } from '../constants/productManagementOptions';
import { createProduct, deleteProduct, updateProduct } from '../services/productApi';
import {
  getErrorMessage,
  mapProductFormToPayload,
  mapProductToForm,
  normalizeFieldErrors,
} from '../utils/productManagementMappers';
import { isValidForm, validateProductForm } from '../utils/productManagementValidation';

function buildInitialForm(productId, productFromState) {
  if (productFromState) {
    return mapProductToForm(productFromState);
  }

  return createEmptyProductForm(productId || '');
}

export default function ProductCrudPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const productIdFromQuery = searchParams.get('productId') || '';
  const productFromState = location.state?.product || null;
  const editingProductId = productIdFromQuery || productFromState?.productId || '';
  const editing = Boolean(editingProductId);

  const [form, setForm] = useState(() => buildInitialForm(editingProductId, productFromState));
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setForm(buildInitialForm(editingProductId, productFromState));
    setTouched({});
    setSubmitAttempted(false);
    setServerErrors({});
    setNotice(null);
  }, [editingProductId, location.key, productFromState]);

  const validationErrors = useMemo(() => validateProductForm(form), [form]);
  const formValid = isValidForm(validationErrors);

  const displayErrors = useMemo(() => {
    return Object.keys({ ...validationErrors, ...serverErrors }).reduce((accumulator, key) => {
      if (serverErrors[key] || submitAttempted || touched[key]) {
        accumulator[key] = serverErrors[key] || validationErrors[key];
      }
      return accumulator;
    }, {});
  }, [serverErrors, submitAttempted, touched, validationErrors]);

  const missingEditSnapshot = editing && !productFromState;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
    setServerErrors((currentValue) => ({
      ...currentValue,
      [name]: '',
    }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((currentValue) => ({
      ...currentValue,
      [name]: true,
    }));
  };

  const handleReset = () => {
    setForm(buildInitialForm(editingProductId, productFromState));
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

      if (editing) {
        await updateProduct(editingProductId, payload);
      } else {
        await createProduct(payload);
      }

      navigate('/database/products', {
        state: {
          notice: {
            type: 'success',
            message: editing
              ? `Đã cập nhật sản phẩm ${payload.ProductID}.`
              : `Đã tạo sản phẩm ${payload.ProductID}.`,
          },
        },
      });
    } catch (requestError) {
      setServerErrors(normalizeFieldErrors(requestError.fieldErrors));
      setNotice({
        type: 'error',
        message: getErrorMessage(requestError, 'Không thể lưu sản phẩm.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingProductId) return;

    try {
      setDeleteLoading(true);
      await deleteProduct(editingProductId);
      navigate('/database/products', {
        state: {
          notice: {
            type: 'success',
            message: `Đã xóa sản phẩm ${editingProductId}.`,
          },
        },
      });
    } catch (requestError) {
      setDeleteDialogOpen(false);
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
      title={editing ? 'Cập nhật hoặc xóa sản phẩm' : 'Tạo sản phẩm mới'}
      description="Route 3.1 dành cho thêm, sửa và xóa PRODUCT. Form được tách riêng để backend team có thể nối trực tiếp vào contract CRUD thật."
      actions={
        <button
          type="button"
          onClick={() => navigate('/database/products')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-white border border-white/10 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </button>
      }
    >
      {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}

      {missingEditSnapshot ? (
        <NoticeBanner
          notice={{
            type: 'error',
            message:
              'Bạn đang mở chế độ sửa trực tiếp nhưng chưa có dữ liệu nền từ danh sách. Frontend vẫn sẵn sàng cập nhật qua PUT, tuy nhiên để mở trực tiếp theo ProductID thì backend team nên cung cấp thêm GET /api/products/:id.',
          }}
        />
      ) : null}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <section className="bg-dark-800 rounded-xl border border-white/5 p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              {editing ? 'Biểu mẫu chỉnh sửa' : 'Biểu mẫu thêm mới'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Submit chỉ bật khi form hợp lệ và không có request đang chạy.
            </p>
          </div>

          <ProductForm
            form={form}
            errors={displayErrors}
            editing={editing}
            submitting={submitting}
            submitDisabled={!formValid}
            onChange={handleChange}
            onBlur={handleBlur}
            onSubmit={handleSubmit}
            onReset={handleReset}
            onDelete={editing ? () => setDeleteDialogOpen(true) : null}
          />
        </section>

        <section className="bg-dark-800 rounded-xl border border-white/5 p-5 h-fit">
          <h2 className="text-lg font-semibold text-white">Tóm tắt phiên làm việc</h2>
          <div className="mt-4 space-y-4">
            <InfoValue label="Chế độ" value={editing ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'} />
            <InfoValue
              label="ProductID hiện tại"
              value={form.productId || 'Chưa nhập'}
            />
            <InfoValue label="ProductType" value={form.productType || '-'} />
            <InfoValue label="ProductStatus" value={form.productStatus || '-'} />
            <InfoValue
              label="Nguồn dữ liệu"
              value={productFromState ? 'Điều hướng từ danh sách' : 'Nhập trực tiếp trên form'}
            />
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Xóa sản phẩm"
        description={`Bạn có chắc muốn xóa ${form.productId || editingProductId}? Thao tác này sẽ gọi DELETE tới API contract và không dùng dữ liệu giả ở local.`}
        confirmLabel="Xóa sản phẩm"
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </ProductPageShell>
  );
}
