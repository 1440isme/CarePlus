import { useState } from 'react';

const primary = '#49BCE2';

export function DateInput({ value, onChange, style = {}, error, onErrorChange }) {
  const [focused, setFocused] = useState(false);

  const handleBlur = () => {
    setFocused(false);
    if (value && !/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      onErrorChange?.('Ngày sinh không đúng định dạng dd/mm/yyyy.');
    }
  };

  const handleDatePick = (e) => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-');
      onChange(`${d}/${m}/${y}`);
      onErrorChange?.('');
    }
  };

  const baseStyle = {
    width: '100%', border: `1px solid ${error ? '#EF4444' : focused ? primary : '#ddd'}`,
    borderRadius: 6, padding: '8px 36px 8px 10px', fontSize: 13, color: '#333',
    outline: 'none', fontFamily: 'Roboto, Arial, sans-serif', boxSizing: 'border-box',
    ...style,
  };

  // Convert dd/mm/yyyy to yyyy-mm-dd for native date input default value
  const isoValue = (() => {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [d, m, y] = value.split('/');
      return `${y}-${m}-${d}`;
    }
    return '';
  })();

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); onErrorChange?.(''); }}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder="dd/mm/yyyy"
        style={baseStyle}
      />
      {/* Invisible native date picker overlaying the calendar icon */}
      <input
        type="date"
        value={isoValue}
        onChange={handleDatePick}
        style={{
          position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
          opacity: 0, width: 24, height: 24, cursor: 'pointer', zIndex: 1,
        }}
      />
      <span style={{
        position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
        fontSize: 14, color: '#aaa', pointerEvents: 'none',
      }}>📅</span>
    </div>
  );
}
