import { Check } from 'lucide-react';
import { PAYMENT_METHODS } from '../../utils/constants';

export default function PaymentMethods({ selected, onSelect }) {
  return (
    <div className="space-y-2">
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selected === method.id;
        return (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              isSelected
                ? 'bg-primary/5 border-primary'
                : 'bg-dark-800 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="text-3xl w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
              {method.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{method.name}</p>
              <p className="text-xs text-gray-400">{method.desc}</p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'bg-primary border-primary' : 'border-gray-600'
              }`}
            >
              {isSelected && <Check size={12} className="text-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
