import React from 'react';

export type FormErrorSummaryItem = {
  field: string;
  label: string;
  message: string;
};

type FormErrorSummaryProps = {
  items: FormErrorSummaryItem[];
  onSelect: (field: string) => void;
};

const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({ items, onSelect }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="submit-error-banner"
      role="alert"
      aria-live="assertive"
      style={{ marginTop: 12, marginBottom: 16 }}
    >
      <strong>Please fix the following {items.length} field{items.length === 1 ? '' : 's'}:</strong>
      <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
        {items.map((item) => (
          <li key={item.field} style={{ marginBottom: 4 }}>
            <button
              type="button"
              onClick={() => onSelect(item.field)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0b1220',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit',
                textAlign: 'left',
              }}
            >
              {item.label}: {item.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FormErrorSummary;
