import { AGE_RATINGS } from '../../utils/constants';

export default function Badge({ rating, size = 'sm', showDesc = false }) {
  const config = AGE_RATINGS[rating] || AGE_RATINGS.P;
  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex items-center justify-center ${config.color} text-white font-bold rounded ${sizes[size]}`}>
        {config.label}
      </span>
      {showDesc && <span className="text-xs text-gray-400">{config.desc}</span>}
    </div>
  );
}
