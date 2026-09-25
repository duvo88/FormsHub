import React, { useState } from 'react';
import FormField from './FormField';
import CountrySelect from './CountrySelect';
import DateField from './DateField';

type Props = {
  sectionTitle?: string;
  formData?: Record<string, string>;
  errors?: Record<string, string>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  hidePublicEmailNote?: boolean;
  publicEmailOptional?: boolean;
  commencePracticeDateDisabled?: boolean;
};

export default function PracticeDetailsSection({ sectionTitle, formData, errors, onChange, onBlur, hidePublicEmailNote, publicEmailOptional, commencePracticeDateDisabled }: Props) {
  const [nswPrincipalPlace, setNswPrincipalPlace] = useState(formData?.nswPrincipalPlaceYesNo || '');

  const getEffectiveDateMaxForPcYear = (today: Date) => {
    const current = new Date(today);
    current.setHours(0, 0, 0, 0);
    const year = current.getFullYear();
    const cutoff = new Date(year, 3, 1); // 1 April
    cutoff.setHours(0, 0, 0, 0);

    // After 1 April, allow selecting up to 30 June of next year; otherwise current year.
    const maxYear = current > cutoff ? year + 1 : year;
    return new Date(maxYear, 5, 30); // 30 June
  };

  const commencePracticeDateMax = getEffectiveDateMaxForPcYear(new Date());
  const effectiveDateWarningStart = new Date(commencePracticeDateMax.getFullYear(), 3, 1);
  const effectiveDateWarningEnd = new Date(commencePracticeDateMax.getFullYear(), 5, 30);
  const commencePracticeDate = formData?.commencePracticeDate || '';
  const [day, month, year] = commencePracticeDate.split('/').map(Number);
  const selectedEffectiveDate = day && month && year
    ? new Date(year, month - 1, day)
    : null;
  const showEffectiveDateWarning = selectedEffectiveDate !== null &&
    selectedEffectiveDate.getFullYear() === year &&
    selectedEffectiveDate.getMonth() === month - 1 &&
    selectedEffectiveDate.getDate() === day &&
    selectedEffectiveDate >= effectiveDateWarningStart &&
    selectedEffectiveDate <= effectiveDateWarningEnd;
  const effectiveDateNoticeDetails = {
    financialYear: `${effectiveDateWarningStart.getFullYear() - 1}-${String(effectiveDateWarningEnd.getFullYear()).slice(-2)}`,
    expiryDate: effectiveDateWarningEnd.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    renewalDate: `1 July ${effectiveDateWarningEnd.getFullYear()}`,
  };

  const handleBlur = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onBlur) onBlur(fieldName, e.target.value);
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '4. Details of Principal Place of Practice in Australia'}</h2>

      <div style={{marginTop:12}}>
        <DateField
          name="commencePracticeDate"
          label="Effective date of your certificate: *"
          value={formData?.commencePracticeDate || ''}
          onChange={onChange as any}
          onBlur={(field, val) => { if (onBlur) onBlur(field, val); }}
          error={errors?.commencePracticeDate}
          allowFuture
          minDate={new Date()}
          maxDate={commencePracticeDateMax}
          disabled={commencePracticeDateDisabled}
        />
        {showEffectiveDateWarning && (
          <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginBottom:16}}>
            <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
              <strong>IMPORTANT:</strong> This application is for the {effectiveDateNoticeDetails.financialYear} financial year ending <strong>{effectiveDateNoticeDetails.expiryDate}</strong>. Only complete this application if you need an Australian registration certificate prior to {effectiveDateNoticeDetails.renewalDate}. Once issued, you will need to also submit a separate application for renewal of this certificate, effective from {effectiveDateNoticeDetails.renewalDate}. You will receive a separate email inviting you to renew.
            </p>
          </div>
        )}
      </div>

      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:8,fontWeight:600}}>
          Do you intend that NSW will be your principal place of practice in Australia? <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{display:'flex',flexDirection:'row',gap:24}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input type="radio" name="nswPrincipalPlace" value="yes" checked={nswPrincipalPlace === 'yes'} onChange={() => { setNswPrincipalPlace('yes'); onChange?.({ target: { name: 'nswPrincipalPlaceYesNo', value: 'yes', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input type="radio" name="nswPrincipalPlace" value="no" checked={nswPrincipalPlace === 'no'} onChange={() => { setNswPrincipalPlace('no'); onChange?.({ target: { name: 'nswPrincipalPlaceYesNo', value: 'no', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No</span>
          </label>
        </div>
      </div>

      {nswPrincipalPlace === 'no' && (
        <div style={{marginTop:16}}>
          <FormField
            name="principalJurisdiction"
            label="Provide the name of the jurisdiction you intend to be your principal place of practice: *"
            placeholder=""
            value={formData?.principalJurisdiction || ''}
            onChange={onChange as any}
            onBlur={handleBlur('principalJurisdiction')}
            error={errors?.principalJurisdiction}
          />
        </div>
      )}

      {nswPrincipalPlace === 'yes' && (
        <>
          <div style={{marginTop:8}}>
            <FormField
              name="lawPracticeEmployer"
              label="Name of place of practice/employer: *"
              placeholder=""
              value={formData?.lawPracticeEmployer || ''}
              onChange={onChange as any}
              onBlur={handleBlur('lawPracticeEmployer')}
              error={errors?.lawPracticeEmployer}
              required
            />
          </div>

          <div style={{marginTop:8}}>
            <FormField
              name="officeStreet"
              label="Address of place of practice/employer: *"
              placeholder=""
              value={formData?.officeStreet || ''}
              onChange={onChange as any}
              onBlur={handleBlur('officeStreet')}
              error={errors?.officeStreet}
              required
            />
          </div>
          <div style={{marginTop:8}}>
            <FormField
              name="officeStreet2"
              label="Address line two:"
              placeholder=""
              value={formData?.officeStreet2 || ''}
              onChange={onChange as any}
            />
          </div>
          <div className="grid" style={{marginTop:8, gridTemplateColumns:'1fr 1fr 1fr'}}>
            <FormField name="officeCity" label="City: *" placeholder=""
              value={formData?.officeCity || ''} onChange={onChange as any}
              onBlur={handleBlur('officeCity')} error={errors?.officeCity} required />
            <FormField name="officeState" label="State: *" placeholder=""
              value={formData?.officeState || ''} onChange={onChange as any}
              onBlur={(e: any) => { if (onBlur) onBlur('officeState', e.target.value); }}
              error={errors?.officeState} required />
            <FormField name="officePostcode" label="Postcode: *" placeholder=""
              value={formData?.officePostcode || ''} onChange={onChange as any}
              onBlur={handleBlur('officePostcode')} error={errors?.officePostcode} required />
          </div>
          <div style={{marginTop:8}}>
            <CountrySelect name="officeCountry" label="Country *"
              value={formData?.officeCountry || ''} onChange={onChange as any}
              error={errors?.officeCountry} required />
          </div>

          <div style={{marginTop:16}}>
            <FormField
              name="communicationEmail"
              label="Communication email address for the Law Society:"
              placeholder=""
              type="email"
              value={formData?.communicationEmail || ''}
              onChange={onChange as any}
              onBlur={handleBlur('communicationEmail')}
              error={errors?.communicationEmail}
            />
          </div>

          <div style={{marginTop:16}}>
            <FormField
              name="practicePublicEmail"
              label={publicEmailOptional ? 'Publication email address for the Law Society:' : 'Your email address for publication: *'}
              placeholder=""
              type="email"
              value={formData?.practicePublicEmail || ''}
              onChange={onChange as any}
              onBlur={handleBlur('practicePublicEmail')}
              error={errors?.practicePublicEmail}
            />
            {!hidePublicEmailNote && (
              <p style={{fontSize:14,color:'#394F5A',marginTop:4,fontStyle:'italic'}}>
                This is the email address that will be publicly displayed on the register of solicitors.
              </p>
            )}
          </div>

        </>
      )}
    </>
  );
}
