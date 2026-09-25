import React, { useState } from 'react';
import FormField from './FormField';
import FileUploadField from './FileUploadField';

type EligibilityErrors = {
  foreignRegistrationAuthority?: string;
  foreignJurisdictions?: string;
  registrationDocsAttachment?: string;
  specialCondition?: string;
  specialConditionDetails?: string;
  disciplinaryProceedings?: string;
  disciplinaryProceedingsDetails?: string;
};

type ForeignRegistration = { authority: string; jurisdictions: string };

type Props = {
  sectionTitle?: string;
  formData?: {
    foreignRegistrationAuthority?: string;
    foreignJurisdictions?: string;
    specialCondition?: string;
    specialConditionDetails?: string;
    disciplinaryProceedings?: string;
    disciplinaryProceedingsDetails?: string;
  };
  errors?: EligibilityErrors;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onFileSelect?: (fieldName: string, files: File[] | null) => void;
  existingFiles?: File[];
  existingFilesEligibility?: File[];
  existingFiles2?: File[];
  onForeignRegistrationsChange?: (registrations: ForeignRegistration[]) => void;
};

export default function EligibilitySection({ formData, errors, onChange, onBlur, onFileSelect, existingFiles, existingFilesEligibility, existingFiles2, sectionTitle, onForeignRegistrationsChange }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDisciplinaryDetails, setShowDisciplinaryDetails] = useState(false);
  const [extraRegistrations, setExtraRegistrations] = useState<ForeignRegistration[]>([]);

  const addRegistration = () => {
    const updated = [...extraRegistrations, { authority: '', jurisdictions: '' }];
    setExtraRegistrations(updated);
    if (onForeignRegistrationsChange) onForeignRegistrationsChange(updated);
  };

  const removeRegistration = (index: number) => {
    const updated = extraRegistrations.filter((_, i) => i !== index);
    setExtraRegistrations(updated);
    if (onForeignRegistrationsChange) onForeignRegistrationsChange(updated);
  };

  const updateRegistration = (index: number, field: keyof ForeignRegistration, value: string) => {
    const updated = extraRegistrations.map((r, i) => i === index ? { ...r, [field]: value } : r);
    setExtraRegistrations(updated);
    if (onForeignRegistrationsChange) onForeignRegistrationsChange(updated);
  };

  const handleBlur = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onBlur) onBlur(fieldName, e.target.value);
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '3. Foreign Registration/s'}</h2>

      <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginTop:12,marginBottom:4}}>
        <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
          <strong>NOTE:</strong> A copy of your current registration certificate and certificate of fitness (or its equivalent) is required. A certificate of fitness is considered to be current if it is issued within the last 28 days.
        </p>
      </div>

      <div style={{marginTop:12}}>
        <FormField
          name="foreignRegistrationAuthority"
          label="Name of the foreign registration authority: *"
          placeholder=""
          value={formData?.foreignRegistrationAuthority || ''}
          onChange={onChange!}
          onBlur={handleBlur('foreignRegistrationAuthority')}
          error={errors?.foreignRegistrationAuthority}
        />
      </div>

      <div style={{marginTop:12}}>
        <FormField
          name="foreignJurisdictions"
          label="Foreign jurisdiction where you are registered or authorised to engage in legal practice: *"
          placeholder=""
          value={formData?.foreignJurisdictions || ''}
          onChange={onChange!}
          onBlur={handleBlur('foreignJurisdictions')}
          error={errors?.foreignJurisdictions}
        />
      </div>

      {extraRegistrations.map((reg, i) => (
        <div key={i} style={{marginTop:16, paddingTop:12, borderTop:'1px solid #e0e0e0'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
            <span style={{fontSize:14, color:'#394F5A', fontWeight:600}}>Foreign Registration {i + 2}</span>
            <button type="button" onClick={() => removeRegistration(i)}
              style={{background:'none', border:'none', color:'#F26522', cursor:'pointer', fontSize:13, padding:0}}>
              Remove
            </button>
          </div>
          <FormField
            name={`extraAuthority_${i}`}
            label="Name of the foreign registration authority: *"
            placeholder=""
            value={reg.authority}
            onChange={(e) => updateRegistration(i, 'authority', e.target.value)}
            onBlur={() => {}}
          />
          <div style={{marginTop:12}}>
            <FormField
              name={`extraJurisdictions_${i}`}
              label="Foreign jurisdiction where you are registered or authorised to engage in legal practice: *"
              placeholder=""
              value={reg.jurisdictions}
              onChange={(e) => updateRegistration(i, 'jurisdictions', e.target.value)}
              onBlur={() => {}}
            />
          </div>
        </div>
      ))}

      <div style={{marginTop:12}}>
        <button type="button" onClick={addRegistration}
          style={{marginTop:12, background:'none', border:'1px solid #F26522', color:'#F26522', borderRadius:4, padding:'6px 16px', cursor:'pointer', fontSize:14, fontWeight:400}}>
          + Add more foreign registrations
        </button>
      </div>

      <div id="registrationDocsAttachment" style={{marginTop:20}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:6,fontWeight:400}}>
          Please attach documents verifying your current registration(s): <span style={{color:'#F26522'}}>*</span>
        </p>
        <FileUploadField
          files={existingFiles || null}
          onFilesChange={(f) => { if (onFileSelect) onFileSelect('registrationDocsAttachment', f); }}
          error={errors?.registrationDocsAttachment}
        />
      </div>

      <div style={{marginTop:16}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:600}}>
          Have you had any special conditions or undertakings concerning your engagement in legal practice as a result of criminal, civil or disciplinary proceedings in Australia or a foreign country? <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{display:'flex',gap:20}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input
              type="radio"
              name="specialCondition"
              value="yes"
              checked={formData?.specialCondition === 'yes'}
              onChange={(e) => { setShowDetails(true); onChange && onChange(e); }}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input
              type="radio"
              name="specialCondition"
              value="no"
              checked={formData?.specialCondition === 'no'}
              onChange={(e) => { setShowDetails(false); onChange && onChange(e); }}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No</span>
          </label>
        </div>
        {errors?.specialCondition && <span className="error-message">{errors.specialCondition}</span>}
      </div>

      {(showDetails || formData?.specialCondition === 'yes') && (
        <div style={{marginTop:12}}>
          <label style={{display:'block',fontSize:16,color:'#0b1220',marginBottom:6,fontWeight:400}}>
            Please provide details: <span style={{color:'#F26522'}}>*</span>
          </label>
          <textarea
            name="specialConditionDetails"
            placeholder=""
            value={formData?.specialConditionDetails || ''}
            onChange={onChange}
            onBlur={handleBlur('specialConditionDetails')}
            style={{
              width:'calc(100% - 20px)',
              minHeight:80,
              padding:'8px 10px',
              border:`1px solid ${errors?.specialConditionDetails ? '#C0392B' : '#9EA5AB'}`,
              borderRadius:3,
              fontSize:16,
              lineHeight:'24px',
              background:'#eaf0ff',
              color:'#0b1220',
              fontFamily:'inherit',
              resize:'vertical',
              boxSizing:'content-box'
            }}
          />
          {errors?.specialConditionDetails && <span className="error-message">{errors.specialConditionDetails}</span>}
          <div style={{marginTop:16}}>
            <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:400}}>
              Attach additional page if necessary.
            </p>
            <FileUploadField
              files={existingFilesEligibility || null}
              onFilesChange={(f) => { if (onFileSelect) onFileSelect('eligibilityAttachment', f); }}
            />
          </div>
        </div>
      )}

      {/* Row 5 - Disciplinary proceedings */}
      <div style={{marginTop:20}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:600}}>
          Are you the subject of disciplinary proceedings in Australia or a foreign country (including any preliminary investigations or action that might lead to disciplinary proceedings) in your capacity as a foreign lawyer, an Australian-registered foreign lawyer, or an Australian lawyer? <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{display:'flex',gap:20}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input
              type="radio"
              name="disciplinaryProceedings"
              value="yes"
              checked={formData?.disciplinaryProceedings === 'yes'}
              onChange={(e) => { setShowDisciplinaryDetails(true); onChange && onChange(e); }}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input
              type="radio"
              name="disciplinaryProceedings"
              value="no"
              checked={formData?.disciplinaryProceedings === 'no'}
              onChange={(e) => { setShowDisciplinaryDetails(false); onChange && onChange(e); }}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No</span>
          </label>
        </div>
        {errors?.disciplinaryProceedings && <span className="error-message">{errors.disciplinaryProceedings}</span>}
      </div>

      {(showDisciplinaryDetails || formData?.disciplinaryProceedings === 'yes') && (
        <div style={{marginTop:12}}>
          <label style={{display:'block',fontSize:16,color:'#0b1220',marginBottom:6,fontWeight:400}}>
            Please provide details: <span style={{color:'#F26522'}}>*</span>
          </label>
          <textarea
            name="disciplinaryProceedingsDetails"
            placeholder=""
            value={formData?.disciplinaryProceedingsDetails || ''}
            onChange={onChange}
            onBlur={handleBlur('disciplinaryProceedingsDetails')}
            style={{
              width:'calc(100% - 20px)',
              minHeight:80,
              padding:'8px 10px',
              border:`1px solid ${errors?.disciplinaryProceedingsDetails ? '#C0392B' : '#9EA5AB'}`,
              borderRadius:3,
              fontSize:16,
              lineHeight:'24px',
              background:'#eaf0ff',
              color:'#0b1220',
              fontFamily:'inherit',
              resize:'vertical',
              boxSizing:'content-box'
            }}
          />
          {errors?.disciplinaryProceedingsDetails && <span className="error-message">{errors.disciplinaryProceedingsDetails}</span>}
          <div style={{marginTop:16}}>
            <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:400}}>
              Attach additional page if necessary:
            </p>
            <FileUploadField
              files={existingFiles2 || null}
              onFilesChange={(f) => { if (onFileSelect) onFileSelect('eligibilityAttachment2', f); }}
            />
          </div>
        </div>
      )}
    </>
  );
}
