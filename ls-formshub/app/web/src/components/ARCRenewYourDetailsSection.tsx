import React from 'react';
import FormField from './FormField';
import DateField from './DateField';

type Props = {
  formData: any;
  errors: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (field: string, value: string) => void;
  readOnlyFields?: { lawID?: boolean; firstName?: boolean; surname?: boolean };
};

const roStyle = { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' as const };

export default function ARCRenewYourDetailsSection({ formData, errors, onChange, onBlur, readOnlyFields }: Props) {
  const handleBlur = (field: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onBlur) onBlur(field, e.target.value);
  };

  return (
    <>
      <h2 className="section-title">1. Your Details</h2>

      {/* LawID hidden from UI but still in formData for PDF */}
      <div style={{ display: 'none' }}>
        <FormField
          label="LawID *"
          name="lawID"
          placeholder=""
          value={formData.lawID || ''}
          onChange={onChange}
          readOnly={readOnlyFields?.lawID}
        />
      </div>

      {/* Row 1: First name and Surname */}
      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField
          label="First name *"
          name="firstName"
          value={formData.firstName || ''}
          onChange={onChange}
          onBlur={handleBlur('firstName')}
          error={errors.firstName}
          readOnly={readOnlyFields?.firstName}
          style={readOnlyFields?.firstName ? roStyle : undefined}
        />
        <FormField
          label="Surname *"
          name="surname"
          value={formData.surname || ''}
          onChange={onChange}
          onBlur={handleBlur('surname')}
          error={errors.surname}
          readOnly={readOnlyFields?.surname}
          style={readOnlyFields?.surname ? roStyle : undefined}
        />
      </div>

      {/* Row 2: Date of Birth | Current registration certificate type */}
      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
        <DateField
          label="Date of birth *"
          name="dateOfBirth"
          value={formData.dateOfBirth || ''}
          onChange={onChange}
          onBlur={onBlur}
          error={errors.dateOfBirth}
        />
        <FormField
          label="Current registration certificate type *"
          name="currentRegCertificateType"
          value={formData.currentRegCertificateType || ''}
          onChange={onChange}
          onBlur={handleBlur('currentRegCertificateType')}
          error={errors.currentRegCertificateType}
        />
      </div>

      {/* Row 3: Foreign jurisdictions */}
      <div style={{ marginTop: 12 }}>
        <FormField
          label="Place of foreign jurisdiction/s where you are entitled to practise *"
          name="foreignLawJurisdictions"
          value={formData.foreignLawJurisdictions || ''}
          onChange={onChange}
          onBlur={handleBlur('foreignLawJurisdictions')}
          error={errors.foreignLawJurisdictions}
        />
      </div>
    </>
  );
}
