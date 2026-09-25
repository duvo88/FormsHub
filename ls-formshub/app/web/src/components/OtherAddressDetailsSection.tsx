import React, { useState } from 'react';
import FormField from './FormField';
import CountrySelect from './CountrySelect';

type Props = {
  sectionTitle?: string;
  formData?: Record<string, string>;
  errors?: Record<string, string>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
};

export default function OtherAddressDetailsSection({ sectionTitle, formData, errors, onChange, onBlur }: Props) {
  const [addressForService, setAddressForService] = useState('');
  const [addressForServiceError, setAddressForServiceError] = useState('');
  const [preferredPostalAddress, setPreferredPostalAddress] = useState('');
  const [preferredPostalError, setPreferredPostalError] = useState('');

  const handleBlur = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onBlur) onBlur(fieldName, e.target.value);
  };

  const addressBlock = (prefix: string, heading: string, mandatory?: boolean) => (
    <div style={{ marginTop: heading ? 20 : 12 }}>
      {heading && (
        <h3 style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 8 }}>
          {heading}{mandatory && <span style={{ color: '#F26522' }}> *</span>}
        </h3>
      )}
      <FormField name={`${prefix}Street`} label={mandatory ? 'Street address: *' : 'Street address:'} placeholder=""
        value={formData?.[`${prefix}Street`] || ''} onChange={onChange as any}
        onBlur={handleBlur(`${prefix}Street`)}
        error={errors?.[`${prefix}Street`]} />
      <div style={{ marginTop: 8 }}>
        <FormField name={`${prefix}Street2`} label="Street address line 2:" placeholder=""
          value={formData?.[`${prefix}Street2`] || ''} onChange={onChange as any} />
      </div>
      <div className="grid" style={{ marginTop: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
        <FormField name={`${prefix}City`} label={mandatory ? 'City: *' : 'City:'} placeholder=""
          value={formData?.[`${prefix}City`] || ''} onChange={onChange as any}
          onBlur={handleBlur(`${prefix}City`)} error={errors?.[`${prefix}City`]} />
        <FormField name={`${prefix}State`} label={mandatory ? 'State: *' : 'State:'} placeholder=""
          value={formData?.[`${prefix}State`] || ''} onChange={onChange as any}
          onBlur={(e: any) => { if (onBlur) onBlur(`${prefix}State`, e.target.value); }}
          error={errors?.[`${prefix}State`]} />
        <FormField name={`${prefix}Postcode`} label={mandatory ? 'Postcode: *' : 'Postcode:'} placeholder=""
          value={formData?.[`${prefix}Postcode`] || ''} onChange={onChange as any}
          onBlur={handleBlur(`${prefix}Postcode`)} error={errors?.[`${prefix}Postcode`]} />
      </div>
      <div style={{ marginTop: 8 }}>
        <CountrySelect name={`${prefix}Country`} label={mandatory ? 'Country: *' : 'Country:'}
          value={formData?.[`${prefix}Country`] || ''} onChange={onChange as any}
          error={errors?.[`${prefix}Country`]} />
      </div>
    </div>
  );

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '5. Other address details'}</h2>

      {addressBlock('residential', 'Residential address:', true)}

      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 16, color: '#0b1220', marginBottom: 8, fontWeight: 600 }}>
          Address for service (must be a street address): <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
            <input type="radio" name="addressForService" value="practice" onChange={() => { setAddressForService('practice'); setAddressForServiceError(''); if (onChange) onChange({ target: { name: 'addressForService', value: 'practice', type: 'radio' } } as any); if (onBlur) onBlur('addressForService', 'practice'); }} />
            <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>Place of practice</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
            <input type="radio" name="addressForService" value="residential" onChange={() => { setAddressForService('residential'); setAddressForServiceError(''); if (onChange) onChange({ target: { name: 'addressForService', value: 'residential', type: 'radio' } } as any); if (onBlur) onBlur('addressForService', 'residential'); }} />
            <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>Residential</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
            <input type="radio" name="addressForService" value="other" onChange={() => { setAddressForService('other'); setAddressForServiceError(''); if (onChange) onChange({ target: { name: 'addressForService', value: 'other', type: 'radio' } } as any); if (onBlur) onBlur('addressForService', 'other'); }} />
            <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>Other (specify)</span>
          </label>
        </div>
        {addressForServiceError && <span className="error-message">{addressForServiceError}</span>}
        {addressForService === 'other' && addressBlock('serviceOther', '', true)}
      </div>

      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 16, color: '#0b1220', marginBottom: 8, fontWeight: 600 }}>
          Preferred postal address: <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
            <input type="radio" name="preferredPostalAddress" value="practice" onChange={() => { setPreferredPostalAddress('practice'); setPreferredPostalError(''); if (onChange) onChange({ target: { name: 'preferredPostalAddress', value: 'practice', type: 'radio' } } as any); if (onBlur) onBlur('preferredPostalAddress', 'practice'); }} />
            <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>Place of practice</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
            <input type="radio" name="preferredPostalAddress" value="residential" onChange={() => { setPreferredPostalAddress('residential'); setPreferredPostalError(''); if (onChange) onChange({ target: { name: 'preferredPostalAddress', value: 'residential', type: 'radio' } } as any); if (onBlur) onBlur('preferredPostalAddress', 'residential'); }} />
            <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>Residential</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
            <input type="radio" name="preferredPostalAddress" value="addressForService" onChange={() => { setPreferredPostalAddress('addressForService'); setPreferredPostalError(''); if (onChange) onChange({ target: { name: 'preferredPostalAddress', value: 'addressForService', type: 'radio' } } as any); if (onBlur) onBlur('preferredPostalAddress', 'addressForService'); }} />
            <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>Address for service</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
            <input type="radio" name="preferredPostalAddress" value="other" onChange={() => { setPreferredPostalAddress('other'); setPreferredPostalError(''); if (onChange) onChange({ target: { name: 'preferredPostalAddress', value: 'other', type: 'radio' } } as any); if (onBlur) onBlur('preferredPostalAddress', 'other'); }} />
            <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>Other/PO Box (specify)</span>
          </label>
        </div>
        {preferredPostalError && <span className="error-message">{preferredPostalError}</span>}
        {preferredPostalAddress === 'other' && addressBlock('postalOther', '', true)}
      </div>
    </>
  );
}

