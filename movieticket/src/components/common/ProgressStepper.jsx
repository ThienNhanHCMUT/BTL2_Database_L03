import { Check } from 'lucide-react';
import { BOOKING_STEPS } from '../../utils/constants';

export default function ProgressStepper({ currentStep }) {
  return (
    <div className="bg-dark-800/50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar">
          {BOOKING_STEPS.map((s, idx) => {
            const isDone = s.step < currentStep;
            const isActive = s.step === currentStep;
            const isLast = idx === BOOKING_STEPS.length - 1;

            return (
              <div key={s.step} className="flex items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-dark-600 text-gray-500'
                    }`}
                  >
                    {isDone ? <Check size={14} /> : s.step}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`w-8 sm:w-12 h-px mx-2 ${
                      isDone ? 'bg-green-500' : 'bg-dark-600'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
