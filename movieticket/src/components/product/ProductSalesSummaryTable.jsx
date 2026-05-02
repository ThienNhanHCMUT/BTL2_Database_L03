import { Edit3, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from './ProductUi';

export default function ProductSalesSummaryTable({
  rows,
  loading,
  error,
  onRetry,
  showActions = true,
  onCreate,
  onEdit,
  onDelete,
  emptyTitle,
  emptyDescription,
}) {
  if (loading) {
    return <LoadingState label="Đang tải dữ liệu thống kê sản phẩm..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Không thể tải thống kê sản phẩm"
        description={error}
        onRetry={onRetry}
      />
    );
  }

  if (!rows.length) {
    return (
      <EmptyState
        title={emptyTitle || 'Không có dữ liệu phù hợp'}
        description={
          emptyDescription || 'Hãy thay đổi bộ lọc hoặc thêm sản phẩm mới để bắt đầu.'
        }
        action={
          showActions && onCreate ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors"
            >
              <Plus size={16} />
              Thêm sản phẩm
            </button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="bg-dark-700/60 text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="text-left px-5 py-3">ProductID</th>
            <th className="text-left px-5 py-3">ProductName</th>
            <th className="text-left px-5 py-3">ProductType</th>
            <th className="text-left px-5 py-3">ProductStatus</th>
            <th className="text-right px-5 py-3">TotalOrders</th>
            <th className="text-right px-5 py-3">TotalQuantitySold</th>
            <th className="text-right px-5 py-3">TotalRevenue</th>
            {showActions ? <th className="text-right px-5 py-3">Thao tác</th> : null}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr key={row.productId} className="hover:bg-white/[0.03] transition-colors">
              <td className="px-5 py-4 font-semibold text-white">{row.productId}</td>
              <td className="px-5 py-4 text-gray-200">
                <div className="space-y-1">
                  <p>{row.productName}</p>
                  {row.basePrice !== null ? (
                    <p className="text-xs text-gray-500">
                      Giá gốc: {formatCurrency(row.basePrice)}
                    </p>
                  ) : null}
                </div>
              </td>
              <td className="px-5 py-4 text-gray-300">{row.productType || '-'}</td>
              <td className="px-5 py-4">
                <StatusBadge status={row.productStatus} />
              </td>
              <td className="px-5 py-4 text-right text-gray-300">{row.totalOrders}</td>
              <td className="px-5 py-4 text-right text-gray-300">
                {row.totalQuantitySold}
              </td>
              <td className="px-5 py-4 text-right text-gray-200">
                {formatCurrency(row.totalRevenue)}
              </td>
              {showActions ? (
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit?.(row)}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-200 transition-colors"
                      title="Sửa sản phẩm"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete?.(row)}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
