import { Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useBooking } from '../../context/BookingContext';

export default function ComboCard({ product }) {
  const { selectedCombos, updateCombo } = useBooking();
  const existing = selectedCombos.find((c) => c.productId === product.productId);
  const quantity = existing?.quantity || 0;

  const handleChange = (delta) => {
    updateCombo({
      productId: product.productId,
      name: product.name,
      unitPrice: product.basePrice,
      delta,
    });
  };

  return (
    <div className={`group relative bg-dark-800 rounded-xl p-4 border transition-all ${
      quantity > 0 ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-white/5 hover:border-white/20'
    }`}>
      {/* Badge quantity */}
      {quantity > 0 && (
        <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
          {quantity}
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="text-5xl flex-shrink-0 w-16 h-16 rounded-lg bg-dark-700 flex items-center justify-center">
          {product.image}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white leading-snug">{product.name}</h3>
          {product.note && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{product.note}</p>
          )}
          <p className="text-lg font-bold text-primary mt-2">{formatCurrency(product.basePrice)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-end gap-3">
        {quantity > 0 ? (
          <>
            <button
              onClick={() => handleChange(-1)}
              className="w-9 h-9 rounded-lg bg-dark-700 hover:bg-dark-600 text-white flex items-center justify-center transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-bold text-white">{quantity}</span>
            <button
              onClick={() => handleChange(1)}
              className="w-9 h-9 rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors"
            >
              <Plus size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={() => handleChange(1)}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors"
          >
            + Thêm
          </button>
        )}
      </div>
    </div>
  );
}
