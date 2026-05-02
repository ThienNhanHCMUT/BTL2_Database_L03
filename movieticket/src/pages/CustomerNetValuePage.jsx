import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calculator,
  Loader2,
  RotateCcw,
  Search,
  User,
} from 'lucide-react';
import { fetchCustomerNetValue } from '../services/productApi';

const EMPTY_FORM = {
  personId: '',
  fromDate: '',
  toDate: '',
};

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function validateForm(form) {
  const errors = {};
  const personId = String(form.personId || '').trim();

  if (!personId) {
    errors.personId = 'Vui lòng nhập PersonID.';
  } else if (personId.length > 20) {
    errors.personId = 'PersonID tối đa 20 ký tự.';
  }

  if (!form.fromDate) {
    errors.fromDate = 'Vui lòng chọn FromDate.';
  }

  if (!form.toDate) {
    errors.toDate = 'Vui lòng chọn ToDate.';
  }

  if (form.fromDate && form.toDate && new Date(form.fromDate) > new Date(form.toDate)) {
    errors.toDate = 'ToDate phải lớn hơn hoặc bằng FromDate.';
  }

  return errors;
}

function normalizeFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return {};

  const map = {
    PersonID: 'personId',
    personId: 'personId',
    FromDate: 'fromDate',
    fromDate: 'fromDate',
    ToDate: 'toDate',
    toDate: 'toDate',
  };

  return Object.entries(fieldErrors).reduce((acc, [key, value]) => {
    acc[map[key] || key] = value;
    return acc;
  }, {});
}

function getErrorMessage(error, fallback) {
  return error?.data?.message || error?.message || fallback;
}

export default function CustomerNetValuePage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);

  const clientErrors = useMemo(() => validateForm(form), [form]);
  const displayErrors = {
    ...clientErrors,
    ...serverFieldErrors,
  };

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setServerFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

    setLoadError('');
    setNotice('');
  }

  function handleBlur(event) {
    const { name } = event.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setTouched({});
    setServerFieldErrors({});
    setResult(null);
    setNotice('');
    setLoadError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validateForm(form);
    setTouched({
      personId: true,
      fromDate: true,
      toDate: true,
    });
    setServerFieldErrors({});
    setNotice('');
    setLoadError('');

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      const data = await fetchCustomerNetValue(form.personId, {
        fromDate: form.fromDate,
        toDate: form.toDate,
      });

      setResult(data);

      if (data.netValue === null || data.netValue === undefined) {
        setNotice(
          'Function trả NULL. Có thể PersonID không tồn tại, tham số không hợp lệ hoặc không đủ dữ liệu hợp lệ.'
        );
      } else {
        setNotice('');
      }
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tính giá trị khách hàng.'));
      setServerFieldErrors(normalizeFieldErrors(error?.fieldErrors || error?.data?.fieldErrors));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const hasResult = result && result.netValue !== null && result.netValue !== undefined;

  return (
    <motion.div
      className="px-8 py-10 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-primary font-bold text-sm tracking-wide uppercase mb-3">
          <Calculator size={18} />
          PRODUCT - PHẦN 3.3
        </div>

        <h1 className="font-display text-4xl md:text-5xl text-white mb-3">
          Giá trị khách hàng
        </h1>

        <p className="text-gray-300 max-w-3xl leading-relaxed">
          Minh họa function dbo.fn_CalculateCustomerNetValue với PersonID, FromDate và
          ToDate. Kết quả chính là NetValue dạng DECIMAL(18,2).
        </p>
      </div>

      {loadError ? (
        <NoticeBanner
          type="error"
          message={loadError}
          onClose={() => setLoadError('')}
        />
      ) : null}

      {notice ? (
        <NoticeBanner
          type="warning"
          message={notice}
          onClose={() => setNotice('')}
        />
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[356px_1fr] gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="bg-dark-800 border border-white/10 rounded-2xl p-5 shadow-lg"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Tham số function</h2>
              <p className="text-gray-400 mt-2 leading-relaxed">
                API contract: GET /api/customers/net-value.
              </p>
            </div>

            <span className="inline-flex items-center rounded-md border border-blue-400/40 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-200 whitespace-nowrap">
              dbo.fn_CalculateCustomerNetValue
            </span>
          </div>

          <Field
            name="personId"
            label="PersonID"
            placeholder="VD: PER001"
            value={form.personId}
            error={touched.personId ? displayErrors.personId : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            icon={<User size={16} />}
            required
          />

          <Field
            name="fromDate"
            label="FromDate"
            type="date"
            value={form.fromDate}
            error={touched.fromDate ? displayErrors.fromDate : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />

          <Field
            name="toDate"
            label="ToDate"
            type="date"
            value={form.toDate}
            error={touched.toDate ? displayErrors.toDate : ''}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />

          <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-blue-100 leading-relaxed mb-5">
            Backend gọi:
            <br />
            <strong>
              dbo.fn_CalculateCustomerNetValue(@PersonID, @FromDate, @ToDate)
            </strong>
            . Nếu function trả NULL, giao diện sẽ hiển thị trường hợp không có kết quả
            hợp lệ.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Tính giá trị
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-dark-700 px-4 py-3 font-semibold text-white hover:bg-dark-600 disabled:opacity-60 transition-colors"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </form>

        <section className="bg-dark-800 border border-white/10 rounded-2xl p-6 min-h-[240px]">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Kết quả NetValue</h2>
              <p className="text-gray-400 mt-2">
                Nguồn dữ liệu: dbo.fn_CalculateCustomerNetValue.
              </p>
            </div>

            {result?.routine ? (
              <span className="rounded-md border border-blue-400/40 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-200">
                {result.routine}
              </span>
            ) : null}
          </div>

          {!result ? (
            <EmptyResult
              title="Chưa có kết quả"
              description="Nhập PersonID, FromDate, ToDate rồi bấm Tính giá trị."
            />
          ) : hasResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResultTile label="PersonID" value={result.personId || form.personId} />

              <ResultTile
                label="Khoảng ngày"
                value={`${result.fromDate || form.fromDate} → ${result.toDate || form.toDate}`}
              />

              <div className="md:col-span-2 rounded-2xl border border-primary/30 bg-primary/10 p-6">
                <div className="text-sm uppercase tracking-wide text-red-200 mb-2">
                  NetValue
                </div>

                <div className="text-4xl font-extrabold text-white">
                  {moneyFormatter.format(result.netValue)}
                </div>

                <div className="text-gray-300 mt-3">
                  Function trả về DECIMAL(18,2), frontend format lại theo VND.
                </div>
              </div>
            </div>
          ) : (
            <EmptyResult
              title="Không có kết quả hợp lệ"
              description="Function trả NULL. Kiểm tra PersonID, FromDate, ToDate hoặc dữ liệu CUSTOMER/ORDER/PAYMENT_TRANSACTION."
            />
          )}
        </section>
      </div>
    </motion.div>
  );
}

function Field({
  name,
  label,
  value,
  error,
  type = 'text',
  placeholder,
  icon,
  required = false,
  onChange,
  onBlur,
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-200 mb-2">
        {label}
        {required ? <span className="text-red-300"> *</span> : null}
      </label>

      <div className="relative">
        {icon ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        ) : null}

        <input
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full rounded-lg bg-dark-700 border px-3 py-3 text-white outline-none focus:border-primary ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-red-400/70' : 'border-white/10'}`}
        />
      </div>

      {error ? <p className="text-sm text-red-300 mt-1">{error}</p> : null}
    </div>
  );
}

function ResultTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-dark-700/60 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function EmptyResult({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[150px]">
      <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-300 flex items-center justify-center mb-4">
        <AlertCircle size={22} />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md">{description}</p>
    </div>
  );
}

function NoticeBanner({ type = 'error', message, onClose }) {
  const styles =
    type === 'warning'
      ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-100'
      : 'border-red-500/40 bg-red-500/10 text-red-100';

  return (
    <div className={`mb-5 rounded-xl border px-4 py-3 flex items-start justify-between gap-4 ${styles}`}>
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="mt-0.5 shrink-0" />
        <div className="font-medium">{message}</div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-white/70 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}