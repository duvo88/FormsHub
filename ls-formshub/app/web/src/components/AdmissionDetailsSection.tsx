import React, { useState } from 'react';
import FormField from './FormField';
import DateField from './DateField';
import FileUploadField from './FileUploadField';

type Qualification = { qualification: string; institution: string; year: string };
type OtherJurisdiction = { otherJurisdictionPlace: string; otherJurisdictionDate: string };

type AdmissionDetailsErrors = {
  eduQualification1?: string;
  eduInstitution1?: string;
  eduYear1?: string;
  eduQualification2?: string;
  eduInstitution2?: string;
  eduYear2?: string;
  professionalQualifications?: string;
  placeOfAdmission?: string;
  dateOfAdmission?: string;
  eduQualificationAttachment?: string;
  otherJurisdictionRadio?: string;
  proQualificationAttachment?: string;
  jurisdictionAttachment?: string;
  [key: string]: string | undefined;
};

type AdmissionDetailsFormData = {
  eduQualification1?: string;
  eduInstitution1?: string;
  eduYear1?: string;
  eduQualification2?: string;
  eduInstitution2?: string;
  eduYear2?: string;
  professionalQualifications?: string;
  placeOfAdmission?: string;
  dateOfAdmission?: string;
};

type Props = {
  sectionTitle?: string;
  formData?: AdmissionDetailsFormData;
  errors?: AdmissionDetailsErrors;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onFileSelect?: (fieldName: string, files: File[] | null) => void;
  existingFiles?: File[];
  existingFiles1?: File[];
  existingFiles2?: File[];
  onQualificationsChange?: (qualifications: Qualification[]) => void;
  onOtherJurisdictionsChange?: (jurisdictions: OtherJurisdiction[]) => void;
};

export default function AdmissionDetailsSection({ formData, errors, onChange, onBlur, onFileSelect, existingFiles, existingFiles1, existingFiles2, 
  sectionTitle, onQualificationsChange, onOtherJurisdictionsChange }: Props) {
  const handleBlur = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onBlur) onBlur(fieldName, e.target.value);
  };

  const [quals, setQuals] = useState<Qualification[]>([{ qualification: '', institution: '', year: '' }]);
  const [jurisdictions, setJurisdictions] = useState<OtherJurisdiction[]>([{ otherJurisdictionPlace: '', otherJurisdictionDate: '' }]);
  const [otherJurisdictionYes, setOtherJurisdictionYes] = useState<boolean | null>(null);

  const updateQual = (index: number, field: keyof Qualification, value: string) => {
    const updated = quals.map((q, i) => i === index ? { ...q, [field]: value } : q);
    setQuals(updated);
    if (onQualificationsChange) onQualificationsChange(updated);
  };

  const addQual = () => {
    const updated = [...quals, { qualification: '', institution: '', year: '' }];
    setQuals(updated);
    if (onQualificationsChange) onQualificationsChange(updated);
  };

  const removeQual = (index: number) => {
    if (quals.length === 1) return;
    const updated = quals.filter((_, i) => i !== index);
    setQuals(updated);
    if (onQualificationsChange) onQualificationsChange(updated);
  };

  const updateJurisdiction = (index: number, field: keyof OtherJurisdiction, value: string) => {
    const updated = jurisdictions.map((j, i) => i === index ? { ...j, [field]: value } : j);
    setJurisdictions(updated);
    if (onOtherJurisdictionsChange) onOtherJurisdictionsChange(updated);
  };

  const addJurisdiction = () => {
    const updated = [...jurisdictions, { otherJurisdictionPlace: '', otherJurisdictionDate: '' }];
    setJurisdictions(updated);
    if (onOtherJurisdictionsChange) onOtherJurisdictionsChange(updated);
  };

  const removeJurisdiction = (index: number) => {
    if (jurisdictions.length === 1) return;
    const updated = jurisdictions.filter((_, i) => i !== index);
    setJurisdictions(updated);
    if (onOtherJurisdictionsChange) onOtherJurisdictionsChange(updated);
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '2. Qualifications'}</h2>

      <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginTop:12,marginBottom:8}}>
        <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
          <strong>NOTE:</strong> A copy of an original instrument, or certified copy of an original instrument, from each foreign registration authority specified in this application which verifies your educational and professional qualifications, must be provided.
        </p>
      </div>

      {/* Educational qualifications */}
      <p style={{fontSize:16,fontWeight:600,color:'#0b1220',marginTop:16,marginBottom:8}}>Educational qualifications:</p>

      {quals.map((q, i) => (
        <div key={i} style={{ marginTop: i > 0 ? 16 : 8, paddingTop: i > 0 ? 12 : 0, borderTop: i > 0 ? '1px solid #e0e0e0' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            {quals.length > 1 && <span style={{ fontSize: 14, color: '#394F5A', fontWeight: 600 }}>Qualification {i + 1}</span>}
            {quals.length > 1 && (
              <button type="button" onClick={() => removeQual(i)} style={{ background: 'none', border: 'none', color: '#F26522', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                Remove
              </button>
            )}
          </div>
          <FormField
            name={`qual_qualification_${i}`}
            label="Qualification: *"
            placeholder=""
            value={q.qualification}
            onChange={e => updateQual(i, 'qualification', e.target.value)}
            onBlur={handleBlur(`qual_qualification_${i}`)}
            error={errors?.[`qual_qualification_${i}`]}
          />
          <div className="grid" style={{ marginTop: 8 }}>
            <FormField
              name={`qual_institution_${i}`}
              label="Institution: *"
              placeholder=""
              value={q.institution}
              onChange={e => updateQual(i, 'institution', e.target.value)}
              onBlur={handleBlur(`qual_institution_${i}`)}
              error={errors?.[`qual_institution_${i}`]}
            />
            <FormField
              name={`qual_year_${i}`}
              label="Year completed: *"
              placeholder=""
              value={q.year}
              onChange={e => updateQual(i, 'year', e.target.value)}
              onBlur={handleBlur(`qual_year_${i}`)}
              error={errors?.[`qual_year_${i}`]}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addQual}
        style={{ marginTop: 12, background: 'none', border: '1px solid #F26522', color: '#F26522', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 400 }}
      >
        + Add more qualifications
      </button>

      <div style={{marginTop:20}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:400}}>
          Please attach documents verifying your educational qualifications: <span style={{color:'#F26522'}}>*</span>
        </p>
        <FileUploadField
          files={existingFiles || null}
          onFilesChange={(f) => {
            if (onFileSelect) onFileSelect('eduQualificationAttachment', f);
            if (onBlur) onBlur('eduQualificationAttachment', f ? f.map(x => x.name).join(', ') : '');
          }}
          error={errors?.eduQualificationAttachment}
        />
      </div>

      {/* Professional qualifications */}
      <p style={{fontSize:16,fontWeight:600,color:'#0b1220',marginTop:20,marginBottom:8}}>Professional qualifications:</p>

      <div className="grid" style={{marginTop:8}}>
        <FormField
          name="placeOfAdmission"
          label="Place of admission: *"
          placeholder=""
          value={formData?.placeOfAdmission || ''}
          onChange={onChange!}
          onBlur={handleBlur('placeOfAdmission')}
          error={errors?.placeOfAdmission}
        />
        <DateField
          label="Date of admission (approximate): *"
          name="dateOfAdmission"
          value={formData?.dateOfAdmission || ''}
          onChange={onChange!}
          onBlur={onBlur}
          error={errors?.dateOfAdmission}
          maxDate={new Date()}
        />
      </div>

      <div style={{marginTop:20}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:400}}>
          Please attach documents verifying your professional qualifications: <span style={{color:'#F26522'}}>*</span>
        </p>
        <FileUploadField
          files={existingFiles1 || null}
          onFilesChange={(f) => {
            if (onFileSelect) onFileSelect('proQualificationAttachment', f);
            if (onBlur) onBlur('proQualificationAttachment', f ? f.map(x => x.name).join(', ') : '');
          }}
          error={errors?.proQualificationAttachment}
        />
      </div>

      <div style={{marginTop:14}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:8,fontWeight:700}}>Are you admitted in any other jurisdiction? <span style={{color:'#F26522'}}>*</span></p>
        <div style={{display:'flex',gap:24,marginBottom:8}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:15,color:'#0b1220',fontWeight:400}}>
            <input type="radio" name="otherJurisdictionRadio" value="yes"
              checked={otherJurisdictionYes === true}
              onChange={() => {
                const updatedJurisdictions = jurisdictions.length > 0
                  ? jurisdictions
                  : [{ otherJurisdictionPlace: '', otherJurisdictionDate: '' }];

                setOtherJurisdictionYes(true);
                setJurisdictions(updatedJurisdictions);
                onOtherJurisdictionsChange?.(updatedJurisdictions);

                if (onChange) onChange({ target: { name: 'otherJurisdictionRadio', value: 'yes', type: 'radio' } } as any);
                if (onBlur) onBlur('otherJurisdictionRadio', 'yes');
              }}
            /> <span style={{fontWeight:400}}>Yes</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:15,color:'#0b1220',fontWeight:400}}>
            <input type="radio" name="otherJurisdictionRadio" value="no"
              checked={otherJurisdictionYes === false}
              onChange={() => {
                const resetJurisdictions: OtherJurisdiction[] = [];

                setOtherJurisdictionYes(false);
                setJurisdictions(resetJurisdictions);
                onOtherJurisdictionsChange?.(resetJurisdictions);

                if (onChange) onChange({
                  target: {
                    name: 'otherJurisdictionRadio',
                    value: 'no',
                    type: 'radio'
                  }
                } as any);

                if (onBlur) onBlur('otherJurisdictionRadio', 'no');
              }}
            /> <span style={{fontWeight:400}}>No</span>
          </label>
        </div>
        {errors?.otherJurisdictionRadio && <span className="error-message">{errors.otherJurisdictionRadio}</span>}

        {otherJurisdictionYes && (
          <>
            {jurisdictions.map((j, i) => (
              <div key={i} style={{ marginTop: i > 0 ? 16 : 8, paddingTop: i > 0 ? 12 : 0, borderTop: i > 0 ? '1px solid #e0e0e0' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  {jurisdictions.length > 1 && <span style={{ fontSize: 14, color: '#394F5A', fontWeight: 600 }}>Jurisdiction {i + 1}</span>}
                  {jurisdictions.length > 1 && (
                    <button type="button" onClick={() => removeJurisdiction(i)} style={{ background: 'none', border: 'none', color: '#F26522', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid" style={{marginTop:8}}>
                  <FormField
                    name={`otherJurisdiction_place_${i}`}
                    label="Place of admission: *"
                    placeholder=""
                    value={j.otherJurisdictionPlace}
                    onChange={e => updateJurisdiction(i, 'otherJurisdictionPlace', e.target.value)}
                    onBlur={handleBlur(`otherJurisdiction_place_${i}`)}
                    error={errors?.[`otherJurisdiction_place_${i}`]}
                    required
                  />
                  <DateField
                    label="Date of admission (approximate): *"
                    name={`otherJurisdiction_date_${i}`}
                    value={j.otherJurisdictionDate}
                    onChange={e => updateJurisdiction(i, 'otherJurisdictionDate', e.target.value)}
                    onBlur={onBlur}
                    error={errors?.[`otherJurisdiction_date_${i}`]}
                    maxDate={new Date()}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addJurisdiction}
              style={{ marginTop: 12, background: 'none', border: '1px solid #F26522', color: '#F26522', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 400 }}
            >
              + Add another
            </button>
            <div style={{marginTop:16}}>
            <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:400}}>
              Please attach documents verifying your qualifications for all jurisdictions: <span style={{color:'#F26522'}}>*</span>
            </p>
            <FileUploadField
              files={existingFiles2 || null}
              onFilesChange={(f) => {
                if (onFileSelect) onFileSelect('jurisdictionAttachment', f);
                if (onBlur) onBlur('jurisdictionAttachment', f ? f.map(x => x.name).join(', ') : '');
              }}
              error={errors?.jurisdictionAttachment}
            />
          </div>
          </>
        )}
      </div>
    </>
  );
}
