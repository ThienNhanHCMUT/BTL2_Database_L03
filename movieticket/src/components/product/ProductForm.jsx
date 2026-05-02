import { Loader2, RotateCcw, Save, Trash2 } from 'lucide-react';
import {
  PRODUCT_STATUS_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
} from '../../constants/productManagementOptions';
import { FieldError } from './ProductUi';

export default function ProductForm({
  form,
  errors,
  editing,
  submitting,
  submitDisabled,
  onChange,
  onBlur,
  onSubmit,
  onReset,
  onDelete,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-300 mb-1">ProductID</label>
        <input
          name="productId"
          value={form.productId}
          onChange={onChange}
          onBlur={onBlur}
          disabled={editing}
          className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary disabled:opacity-60"
          placeholder="VD: P001"
        />
        <FieldError message={errors.productId} />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">ProductName</label>
        <input
          name="productName"
          value={form.productName}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
          placeholder="Ví dụ: Combo bắp nước lớn"
        />
        <FieldError message={errors.productName} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">ProductType</label>
          <select
            name="productType"
            value={form.productType}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
          >
            {PRODUCT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.productType} />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">BasePrice</label>
          <input
            type="number"
            name="basePrice"
            min="0"
            step="1000"
            value={form.basePrice}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
            placeholder="0"
          />
          <FieldError message={errors.basePrice} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">ProductStatus</label>
        <select
          name="productStatus"
          value={form.productStatus}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
        >
          {PRODUCT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError message={errors.productStatus} />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={submitDisabled || submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 transition-colors disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {editing ? 'Lưu cập nhật' : 'Tạo sản phẩm'}
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white px-4 py-2.5 transition-colors disabled:opacity-60"
        >
          <RotateCcw size={16} />
          {editing ? 'Khôi phục' : 'Làm trống'}
        </button>

        {editing && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            <Trash2 size={16} />
            Xóa sản phẩm
          </button>
        ) : null}
      </div>
    </form>
  );
}
