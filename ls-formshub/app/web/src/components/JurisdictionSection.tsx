import React from 'react';
import FormField from './FormField';
import FileUploadField from './FileUploadField';

type Props = {
  formData: {
    interstateJurisdiction: boolean;
    overseasJurisdiction: boolean;
    nswBar: boolean;
    notary: boolean;
    otherJurisdiction: boolean;
    otherJurisdictionDetails: string;
  };
  errors?: {
    jurisdiction?: string;
    otherJurisdictionDetails?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onFileChange?: (fieldName: string, files: File[] | null) => void;
};



export default function JurisdictionSection({ formData, errors, onChange, onBlur, onFileChange }: Props) {
  const handleBlur = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(fieldName, e.target.value);
    }
  };

  return (
    <>
      <h2 className="section-title">2. The jurisdiction for which this certificate is required</h2>
      <p style={{fontSize:16,color:'#0b1220',marginTop:8,marginBottom:12}}>
        Please select the purpose and/or jurisdiction for which a certificate of fitness is required: <span style={{color:'#F26522'}}>*</span>
      </p>
      <div style={{marginTop:12}}>
        <label style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10,cursor:'pointer'}}>
          <input 
            type="checkbox" 
            name="interstateJurisdiction"
            checked={formData.interstateJurisdiction}
            onChange={onChange}
            style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
          />
          <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220'}}>Interstate Jurisdiction (select this box if you are applying for a practising certificate in another Australian jurisdiction)</span>
        </label>

        <label style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10,cursor:'pointer'}}>
          <input 
            type="checkbox" 
            name="overseasJurisdiction"
            checked={formData.overseasJurisdiction}
            onChange={onChange}
            style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
          />
          <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220'}}>Overseas Jurisdiction (select this box if you are applying for registration to practise in an overseas jurisdiction)</span>
        </label>

        <label style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10,cursor:'pointer'}}>
          <input 
            type="checkbox" 
            name="nswBar"
            checked={formData.nswBar}
            onChange={onChange}
            style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
          />
          <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220'}}>New South Wales Bar Association (select this box if you are transferring to the Bar)</span>
        </label>

        <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
          <input 
            type="checkbox" 
            name="notary"
            checked={formData.notary}
            onChange={onChange}
            style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
          />
          <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220'}}>Society of Notaries of New South Wales Inc. (select this box if you are applying for appointment as a Public Notary)</span>
        </label>

        <label style={{display:'flex',alignItems:'flex-start',gap:10,marginTop:10,cursor:'pointer'}}>
          <input 
            type="checkbox" 
            name="otherJurisdiction"
            checked={formData.otherJurisdiction}
            onChange={onChange}
            style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
          />
          <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220',fontWeight:600}}>Other</span>
        </label>
        {errors?.jurisdiction && (
          <span className="error-message">
            {errors.jurisdiction}
          </span>
        )}

        {formData.otherJurisdiction && (
          <div style={{marginLeft:24,marginTop:8}}>
            <FormField 
              name="otherJurisdictionDetails" 
              label="Please provide details: *" 
              placeholder="" 
              value={formData.otherJurisdictionDetails}
              onChange={onChange}
              onBlur={handleBlur('otherJurisdictionDetails')}
              error={errors?.otherJurisdictionDetails}
              required
            />
          </div>
        )}

        <div style={{marginTop:12}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:8}}>Attach additional page if necessary.</p>
          <FileUploadField
            files={null}
            onFilesChange={(f) => { if (onFileChange) onFileChange('jurisdictionAttachment', f); }}
          />
        </div>
      </div>
    </>
  );
}
