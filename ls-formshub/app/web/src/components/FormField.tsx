import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export default function FormField({ label, name, error, onBlur, ...rest }: Props) {
  const hasAsterisk = label.endsWith(' *');
  const labelText = hasAsterisk ? label.slice(0, -2) : label;
  
  return (
    <label className="form-field">
      <span className="form-label">
        {labelText}
        {hasAsterisk && <span style={{color:'#F26522'}}> *</span>}
      </span>
      <input 
        className={`form-input${error ? ' error' : ''}`}
        name={name} 
        onBlur={onBlur}
        {...rest} 
      />
      {error && (
        <span className="error-message">
          {error}
        </span>
      )}
    </label>
  );
}
