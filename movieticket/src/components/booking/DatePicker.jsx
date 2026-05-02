import { getNextDays } from '../../utils/formatDate';

export default function DatePicker({ selectedDate, onSelect, days = 7, dates = null }) {
  const dateList = Array.isArray(dates) && dates.length > 0 ? dates : getNextDays(days);

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
      {dateList.map((d) => {
        const isSelected = d.date === selectedDate;
        return (
          <button
            key={d.date}
            onClick={() => onSelect(d.date)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-3 rounded-xl border transition-all ${
              isSelected
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105'
                : 'bg-dark-700 border-white/5 text-gray-300 hover:border-primary/50 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-80">
              {d.isToday ? 'Hôm nay' : d.weekday.slice(0, 4)}
            </span>
            <span className="text-2xl font-bold leading-tight">{d.day}</span>
            <span className="text-[10px] opacity-70">Th {d.month}</span>
          </button>
        );
      })}
    </div>
  );
}
