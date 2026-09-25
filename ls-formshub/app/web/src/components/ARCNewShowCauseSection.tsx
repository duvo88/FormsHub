import React, { useState } from 'react';
import FileUploadField from './FileUploadField';

type Props = {
  sectionTitle?: string;
  errors?: { showCause?: string; showCauseAttachment?: string };
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onFileSelect?: (fieldName: string, files: File[] | null) => void;
  existingFiles?: File[];
};

export default function ARCNewShowCauseSection({ sectionTitle, errors, onChange, onBlur, onFileSelect, existingFiles }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const handleChange = (value: string) => {
    setShowDetails(value === 'yes');
    if (value === 'no' && onFileSelect) onFileSelect('showCauseAttachment', null);
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '8. Show Cause Events'}</h2>

      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:12,lineHeight:'24px',fontWeight:700}}>
          Is there any matter referred to in <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.87" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 87</a> and <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.88" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>88</a> of the <em>Legal Profession Uniform Law (NSW)</em> which is applicable to you and which you have not previously disclosed in writing to the Law Society? <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{display:'flex',flexDirection:'row',gap:24,marginBottom:4,flexWrap:'wrap'}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input
              type="radio"
              name="showCause"
              value="yes"
              onChange={(e) => { handleChange(e.target.value); onChange && onChange(e); }}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input
              type="radio"
              name="showCause"
              value="no"
              onChange={(e) => { handleChange(e.target.value); onChange && onChange(e); }}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No</span>
          </label>
        </div>
        {errors?.showCause && <span className="error-message">{errors.showCause}</span>}

        {showDetails && (
          <div style={{marginTop:12}}>
            <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginBottom:16}}>
              <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
                <strong>NOTE:</strong> Please complete and submit a <a href="https://www.lawsociety.com.au/sites/default/files/2018-03/Statement%20ASCE.pdf" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>'Notice of Show Cause Event'</a> form.
              </p>
            </div>
            <label style={{fontSize:16,color:'#0b1220',display:'block',marginBottom:6,fontWeight:400}}>
              Please complete and submit a &apos;Notice of Show Cause Event&apos; form. <span style={{color:'#F26522'}}>*</span>
            </label>
            <FileUploadField
              files={existingFiles || null}
              onFilesChange={(f) => {
                if (onFileSelect) onFileSelect('showCauseAttachment', f);
                if (onBlur) onBlur('showCauseAttachment', f ? f.map(x => x.name).join(', ') : '');
              }}
              error={errors?.showCauseAttachment}
            />
          </div>
        )}
      </div>
    </>
  );
}
