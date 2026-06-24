import { useMemo, useRef } from 'react';

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.25 3.75v2.5M13.75 3.75v2.5M4.75 7.25h10.5M5.75 5.25h8.5A1.75 1.75 0 0 1 16 7v8.25A1.75 1.75 0 0 1 14.25 17h-8.5A1.75 1.75 0 0 1 4 15.25V7A1.75 1.75 0 0 1 5.75 5.25Z" />
    </svg>
  );
}

function isValidDateParts(day, month, year) {
  const parsedDate = new Date(year, month - 1, day);

  return parsedDate.getFullYear() === year
    && parsedDate.getMonth() === month - 1
    && parsedDate.getDate() === day;
}

function normalizeDateInput(value) {
  const trimmedValue = String(value ?? '').trim();

  if (!trimmedValue) {
    return '';
  }

  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, yearText, monthText, dayText] = isoMatch;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);

    return isValidDateParts(day, month, year)
      ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : trimmedValue;
  }

  return trimmedValue;
}

function toNativeDateValue(value) {
  const normalizedValue = normalizeDateInput(value);
  const isoMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!isoMatch) {
    return '';
  }
  return normalizedValue;
}

export default function AdminDatePickerInput({
  value,
  onChange,
  onBlur,
  name,
  className,
  placeholder = 'YYYY-MM-DD',
  disabled = false,
}) {
  const nativeDateInputRef = useRef(null);
  const nativeDateValue = useMemo(() => toNativeDateValue(value), [value]);

  const handleOpenPicker = () => {
    if (disabled) {
      return;
    }

    const input = nativeDateInputRef.current;
    if (!input) {
      return;
    }

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  return (
    <div className="admin-date-picker-input">
      <input
        className={className}
        type="text"
        inputMode="numeric"
        name={name}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => {
          const normalizedValue = normalizeDateInput(event.target.value);
          if (normalizedValue !== event.target.value) {
            onChange(normalizedValue);
          }
          onBlur?.(event);
        }}
        disabled={disabled}
      />

      <button
        className="admin-date-picker-trigger"
        type="button"
        onClick={handleOpenPicker}
        aria-label="Mở lịch"
        disabled={disabled}
      >
        <CalendarIcon />
      </button>

      <input
        ref={nativeDateInputRef}
        className="admin-date-picker-native"
        type="date"
        tabIndex={-1}
        value={nativeDateValue}
        onChange={(event) => {
          onChange(normalizeDateInput(event.target.value));
        }}
        aria-hidden="true"
      />
    </div>
  );
}
