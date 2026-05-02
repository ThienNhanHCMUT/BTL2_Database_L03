import { Calculator, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { EmptyState, FieldError, InfoValue, NoticeBanner } from './ProductUi';

function formatCurrencyOrDash(value) {
  return value == null ? '-' : formatCurrency(value);
}

export default function CustomerNetValueLookup({
  form,
  errors,
  loading,
  result,
  requestError,
  onChange,
  onBlur,
  onSubmit,
  submitDisabled,
}) {
  return (
    <section className="bg-dark-800 rounded-xl border border-white/5 p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Calculator size={20} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Customer Net Value Lookup</h2>
          <p className="text-sm text-gray-400">
            Minh họa frontend cho hàm `dbo.fn_CalculateCustomerNetValue`.
          </p>
        </div>
      </div>

      {requestError ? (
        <div className="mb-4">
          <NoticeBanner notice={{ type: 'error', message: requestError }} />
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">PersonID</label>
          <input
            name="personId"
            value={form.personId}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
            placeholder="Ví dụ: 12"
          />
          <FieldError message={errors.personId} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">FromDate</label>
            <input
              type="date"
              name="fromDate"
              value={form.fromDate}
              onChange={onChange}
              onBlur={onBlur}
              className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
            />
            <FieldError message={errors.fromDate} />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">ToDate</label>
            <input
              type="date"
              name="toDate"
              value={form.toDate}
              onChange={onChange}
              onBlur={onBlur}
              className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
            />
            <FieldError message={errors.toDate} />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitDisabled || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2.5 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
          Tra cứu
        </button>
      </form>

      <div className="mt-6 border-t border-white/5 pt-5">
        {result ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-dark-700/70 border border-white/10 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Kết quả chính</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatCurrencyOrDash(result.netValue)}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                PersonID {result.personId || form.personId}
                {result.customerName ? ` - ${result.customerName}` : ''}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <InfoValue label="Từ ngày" value={result.fromDate || form.fromDate || '-'} />
              <InfoValue label="Đến ngày" value={result.toDate || form.toDate || '-'} />
              <InfoValue label="Tổng đơn hàng" value={result.totalOrders ?? '-'} />
              <InfoValue label="Gross Value" value={formatCurrencyOrDash(result.grossValue)} />
              <InfoValue
                label="Discount Amount"
                value={formatCurrencyOrDash(result.discountAmount)}
              />
              <InfoValue
                label="Refund Amount"
                value={formatCurrencyOrDash(result.refundAmount)}
              />
              <InfoValue
                label="Đơn hàng gần nhất"
                value={result.lastOrderDate || '-'}
              />
              <InfoValue label="Nguồn phản hồi" value={result.source || 'API contract'} />
            </div>
          </div>
        ) : (
          <EmptyState
            title="Chưa có kết quả tra cứu"
            description="Nhập PersonID và khoảng thời gian, sau đó bấm Tra cứu để xem giá trị ròng của khách hàng."
          />
        )}
      </div>
    </section>
  );
}
