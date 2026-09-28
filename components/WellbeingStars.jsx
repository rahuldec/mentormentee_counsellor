'use client';
export default function WellbeingStars({ value, onChange, readOnly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => !readOnly && onChange && onChange(i)}
          className={`text-xl ${i <= (value || 0) ? 'text-yellow-400' : 'text-gray-300'} ${readOnly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
