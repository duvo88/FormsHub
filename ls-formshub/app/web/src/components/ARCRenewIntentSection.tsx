import React from 'react';

type Props = {
  formData: any;
  errors: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ARCRenewIntentSection({ formData, errors, onChange }: Props) {
  return (
    <>
      <h2 className="section-title">2. Intent to Renew</h2>
      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 16, color: '#0b1220', marginBottom: 12, lineHeight: '24px', fontWeight: 700 }}>
          Do you wish to renew your registration certificate? <span style={{ color: '#F26522' }}>*</span>
        </p>
        <div style={{ display: 'flex', gap: 32 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#0b1220', cursor: 'pointer', fontWeight: 400 }}>
            <input
              type="radio"
              name="intentToRenew"
              value="yes"
              checked={formData.intentToRenew === 'yes'}
              onChange={onChange}
            />
            Yes
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#0b1220', cursor: 'pointer', fontWeight: 400 }}>
            <input
              type="radio"
              name="intentToRenew"
              value="no"
              checked={formData.intentToRenew === 'no'}
              onChange={onChange}
            />
            No
          </label>
        </div>
        {errors.intentToRenew && <span className="error-message">{errors.intentToRenew}</span>}
      </div>

      {formData.intentToRenew === 'no' && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="notRenewAcknowledged"
              checked={formData.notRenewAcknowledged === 'yes'}
              onChange={onChange}
              style={{ width: 18, height: 18, marginTop: 3, cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: 16, color: '#0b1220', lineHeight: '24px', fontWeight: 400 }}>
              You have indicated that you do not wish to renew your registration certificate. Please submit this form to notify the Law Society. <span style={{ color: '#F26522' }}>*</span>
            </span>
          </label>
          {errors.notRenewAcknowledged && <span className="error-message" style={{ marginLeft: 30 }}>{errors.notRenewAcknowledged}</span>}
        </div>
      )}
    </>
  );
}
