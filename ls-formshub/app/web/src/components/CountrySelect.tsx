import React from 'react';
import { COUNTRIES } from '../utils/countries';

type Props = {
  name: string;
  label: string;
  value?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
};

export default function CountrySelect({ name, label, value = '', error, required, disabled, onChange, onBlur }: Props) {
  const hasAsterisk = required || label.endsWith(' *');
  const labelText = label.endsWith(' *') ? label.slice(0, -2) : label;
  
  return (
    <div className="form-field">
      <label className="form-label">
        {labelText}
        {hasAsterisk && <span style={{ color: '#F26522', marginLeft: 2 }}> *</span>}
      </label>
      <select
        className={`select${error ? ' error' : ''}`}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        style={{
          background: disabled ? '#f5f5f5' : '#fff',
          cursor: disabled ? 'not-allowed' : undefined,
        }}
        disabled={disabled}
      >
        <option value="">Please select</option>
        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
