import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import CustomerNetValueLookup from '../components/product/CustomerNetValueLookup';
import ProductPageShell from '../components/product/ProductPageShell';
import ProductSalesSummaryTable from '../components/product/ProductSalesSummaryTable';
import ProductSummaryFilters from '../components/product/ProductSummaryFilters';
import { NoticeBanner, RoutineBadge } from '../components/product/ProductUi';
import {
  EMPTY_CUSTOMER_NET_VALUE_FORM,
  EMPTY_PRODUCT_SUMMARY_FILTERS,
} from '../constants/productManagementOptions';
import { useProductSalesSummary } from '../hooks/useProductSalesSummary';
import { fetchCustomerNetValue } from '../services/productApi';
import {
  getErrorMessage,
  sortProductSummaryRows,
} from '../utils/productManagementMappers';
import {
  isValidForm,
  validateCustomerNetValueLookup,
  validateProductSummaryFilters,
} from '../utils/productManagementValidation';

export default function ProductAnalyticsPage() {
  const [lookupForm, setLookupForm] = useState(EMPTY_CUSTOMER_NET_VALUE_FORM);
  const [lookupTouched, setLookupTouched] = useState({});
  const [lookupSubmitAttempted, setLookupSubmitAttempted] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);

  const [summaryFilters, setSummaryFilters] = useState(EMPTY_PRODUCT_SUMMARY_FILTERS);
  const [appliedSummaryFilters, setAppliedSummaryFilters] = useState(
    EMPTY_PRODUCT_SUMMARY_FILTERS
  );
  const [summaryFilterErrors, setSummaryFilterErrors] = useState({});
  const [notice, setNotice] = useState(null);

  const summaryState = useProductSalesSummary(appliedSummaryFilters);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lookupValidationErrors = useMemo(
    () => validateCustomerNetValueLookup(lookupForm),
    [lookupForm]
  );
  const lookupFormValid = isValidForm(lookupValidationErrors);

  const displayedLookupErrors = useMemo(() => {
    return Object.keys(lookupValidationErrors).reduce((accumulator, key) => {
      if (lookupSubmitAttempted || lookupTouched[key]) {
        accumulator[key] = lookupValidationErrors[key];
      }
      return accumulator;
    }, {});
  }, [lookupSubmitAttempted, lookupTouched, lookupValidationErrors]);

  const summaryRows = useMemo(
    () => sortProductSummaryRows(summaryState.rows, 'totalRevenue', 'desc'),
    [summaryState.rows]
  );

  const handleLookupChange = (event) => {
    const { name, value } = event.target;

    setLookupForm((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  };

  const handleLookupBlur = (event) => {
    const { name } = event.target;

    setLookupTouched((currentValue) => ({
      ...currentValue,
      [name]: true,
    }));
  };

  const handleLookupSubmit = async (event) => {
    event.preventDefault();
    setLookupSubmitAttempted(true);

    if (!lookupFormValid) return;

    try {
      setLookupLoading(true);
      setLookupError('');

      const response = await fetchCustomerNetValue(lookupForm.personId, {
        fromDate: lookupForm.fromDate,
        toDate: lookupForm.toDate,
      });

      setLookupResult(response);
      setNotice({
        type: 'success',
        message: 'Đã lấy kết quả net value từ API contract.',
      });
    } catch (requestError) {
      setLookupResult(null);
      setLookupError(
        getErrorMessage(
          requestError,
          'Không thể tra cứu hàm tính Customer Net Value.'
        )
      );
      setNotice(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSummaryFilterChange = (event) => {
    const { name, value } = event.target;

    setSummaryFilters((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
    setSummaryFilterErrors((currentValue) => ({
      ...currentValue,
      [name]: '',
    }));
  };

  const handleApplySummaryFilters = (event) => {
    event.preventDefault();

    const errors = validateProductSummaryFilters(summaryFilters);
    setSummaryFilterErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setAppliedSummaryFilters({ ...summaryFilters });
  };

  const handleResetSummaryFilters = () => {
    setSummaryFilters(EMPTY_PRODUCT_SUMMARY_FILTERS);
    setAppliedSummaryFilters(EMPTY_PRODUCT_SUMMARY_FILTERS);
    setSummaryFilterErrors({});
  };

  return (
    <ProductPageShell
      title="Hàm và phân tích sản phẩm"
      description="Route 3.3 ghép hai phần: tra cứu giá trị ròng khách hàng bằng function và panel minh họa thủ tục thống kê sản phẩm để dễ demo trên lớp."
      actions={
        <button
          type="button"
          onClick={summaryState.refresh}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-white border border-white/10 transition-colors"
        >
          <RefreshCw size={16} />
          Làm mới panel thủ tục
        </button>
      }
    >
      {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}

      <div className="grid xl:grid-cols-[420px_1fr] gap-6">
        <CustomerNetValueLookup
          form={lookupForm}
          errors={displayedLookupErrors}
          loading={lookupLoading}
          result={lookupResult}
          requestError={lookupError}
          onChange={handleLookupChange}
          onBlur={handleLookupBlur}
          onSubmit={handleLookupSubmit}
          submitDisabled={!lookupFormValid}
        />

        <section className="bg-dark-800 rounded-xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Summary / Procedure Panel</h2>
              <p className="text-sm text-gray-400 mt-1">
                Dùng lại logic `sp_GetProductSalesSummary` để minh họa phần thủ tục ngay trên cùng route.
              </p>
            </div>

            <RoutineBadge label={summaryState.meta?.routine || 'sp_GetProductSalesSummary'} />
          </div>

          <div className="p-5 border-b border-white/5">
            <ProductSummaryFilters
              filters={summaryFilters}
              errors={summaryFilterErrors}
              onFilterChange={handleSummaryFilterChange}
              onApply={handleApplySummaryFilters}
              onReset={handleResetSummaryFilters}
              showSearchSort={false}
            />
          </div>

          <ProductSalesSummaryTable
            rows={summaryRows}
            loading={summaryState.loading}
            error={summaryState.error}
            onRetry={summaryState.refresh}
            showActions={false}
            emptyTitle="Chưa có dữ liệu thủ tục"
            emptyDescription="Thử đổi khoảng thời gian hoặc ProductType để xem dữ liệu tóm tắt."
          />
        </section>
      </div>
    </ProductPageShell>
  );
}
