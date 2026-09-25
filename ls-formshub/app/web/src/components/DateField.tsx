import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type DateFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (name: string, value: string) => void;
  error?: string;
  required?: boolean;
  width?: string;
  disabled?: boolean;
  allowFuture?: boolean;
  minDate?: Date;
  maxDate?: Date;
};

export default function DateField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  width,
  disabled = false,
  allowFuture = false,
  minDate,
  maxDate
}: DateFieldProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Convert DD/MM/YYYY string to Date object
  const parseDateToObject = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  // Convert Date object to DD/MM/YYYY string with leading zeros
  const formatDateToString = (date: Date | null): string => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Update selected date when value prop changes
  React.useEffect(() => {
    const dateObj = parseDateToObject(value);
    if (dateObj) {
      const year = dateObj.getFullYear();
      if (year >= 1900 && year <= 2099) {
        setSelectedDate(dateObj);
      } else {
        setSelectedDate(null);
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateChange = (date: Date | null) => {
    if (date === null || (date.getFullYear() >= 1900 && date.getFullYear() <= 2099)) {
      setSelectedDate(date);
      const formatted = formatDateToString(date);
      const syntheticEvent = {
        target: { name, value: formatted }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
      if (onBlur && formatted) {
        onBlur(name, formatted);
      }
    }
  };

  const handleInputBlur = () => {
    if (onBlur) {
      onBlur(name, value);
    }
  };

  const displayLabel = required ? `${label} *` : label;
  const hasAsterisk = displayLabel.endsWith(' *');
  const labelText = hasAsterisk ? displayLabel.slice(0, -2) : displayLabel;

  const errorMessage = error;

  return (
    <div className="form-field" id={name}>
      <span className="form-label">
        {labelText}
        {hasAsterisk && <span style={{ color: '#F26522' }}> *</span>}
      </span>
      <div style={{ position: 'relative', width: width || '100%' }}>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          placeholderText="DD/MM/YYYY"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          yearDropdownItemNumber={100}
          minDate={minDate ?? new Date(1900, 0, 1)}
          maxDate={maxDate ?? (allowFuture ? new Date(2099, 11, 31) : new Date())}
          disabled={disabled}
          wrapperClassName="date-picker-wrapper"
          disabledKeyboardNavigation
          onChangeRaw={(e) => e?.preventDefault()}
          customInput={
            <input
              type="text"
              className="form-input"
              value={value}
              onBlur={handleInputBlur}
              readOnly
              onKeyDown={(e) => e.preventDefault()}
              onKeyPress={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              style={{ cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
            />
          }
        />
      </div>
      {errorMessage && <span className="error-message">{errorMessage}</span>}
    </div>
  );
}
