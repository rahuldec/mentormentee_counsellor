'use client';
export default function WellbeingStars({ value, onChange, readOnly }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => !readOnly && onChange && onChange(i)}
          style={{
            fontSize: readOnly ? 16 : 22,
            color: i <= (value || 0) ? '#F59E0B' : '#E2E8F0',
            padding: '0 1px',
            background: 'none',
            border: 'none',
            cursor: readOnly ? 'default' : 'pointer',
            transition: 'color 0.15s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
