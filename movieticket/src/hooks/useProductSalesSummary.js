import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProductSalesSummary } from '../services/productApi';
import { getErrorMessage } from '../utils/productManagementMappers';

export function useProductSalesSummary(filters) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const filterKey = useMemo(() => JSON.stringify(filters ?? {}), [filters]);

  const refresh = useCallback(() => {
    setRefreshToken((currentValue) => currentValue + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSalesSummary() {
      try {
        setLoading(true);
        setError('');

        const response = await fetchProductSalesSummary(filters);

        if (cancelled) return;

        setRows(response.items);
        setMeta(response.meta);
      } catch (requestError) {
        if (cancelled) return;

        setRows([]);
        setMeta(null);
        setError(
          getErrorMessage(
            requestError,
            'Không thể tải dữ liệu từ thủ tục thống kê sản phẩm.'
          )
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSalesSummary();

    return () => {
      cancelled = true;
    };
  }, [filters, filterKey, refreshToken]);

  return {
    rows,
    meta,
    loading,
    error,
    refresh,
  };
}
