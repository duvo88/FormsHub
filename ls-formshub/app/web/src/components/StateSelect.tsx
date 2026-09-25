import React from 'react';
import { AUSTRALIAN_STATES } from '../utils/states';

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

export default function StateSelect({ name, label, value = '', error, required, disabled, onChange, onBlur }: Props) {
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
        {AUSTRALIAN_STATES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
