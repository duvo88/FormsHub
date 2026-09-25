import React, { useState } from 'react';
import FileUploadField from './FileUploadField';

type ShowCauseErrors = {
  showCause?: string;
  showCauseAttachment?: string;
};

type Props = {
  sectionTitle?: string;
  errors?: ShowCauseErrors;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onFileSelect?: (fieldName: string, files: File[] | null) => void;
  existingFiles?: File[];
};



export default function ShowCauseEventsSection({ errors, onChange, onBlur, onFileSelect, existingFiles, sectionTitle }: Props) {
  const [showAttachment, setShowAttachment] = useState(false);
  const handleShowCauseChange = (value: string) => {
    setShowAttachment(value === 'yes');
    if (value === 'no') {
      if (onFileSelect) onFileSelect('showCauseAttachment', null);
    }
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '10. Show Cause Events'}</h2>

      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:12,lineHeight:'24px'}}>
          Is there any matter referred to in section 67 of the <em>Legal Profession Uniform Law (NSW)</em> which is applicable to you and which you have not previously disclosed in writing to the Law Society? <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:15,marginBottom:16}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer'}}>
            <input 
              type="radio" 
              name="showCause" 
              value="yes" 
              style={{marginTop:3,flexShrink:0}} 
              onChange={(e) => {handleShowCauseChange(e.target.value); onChange && onChange(e);}}
            />
            <span style={{fontSize:16,color:'#0b1220',lineHeight:'24px'}}>Yes</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input 
              type="radio" 
              name="showCause" 
              value="no" 
               
              onChange={(e) => {handleShowCauseChange(e.target.value); onChange && onChange(e);}}
            />
            <span style={{fontSize:16,color:'#0b1220'}}>No</span>
          </label>
        </div>
        {errors?.showCause && (
          <span className="error-message">
            {errors.showCause}
          </span>
        )}

        {showAttachment && (
          <div style={{marginTop:12}}>
            <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginBottom:16}}>
              <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
                <strong>NOTE:</strong> Please complete and submit a <a href="https://www.lawsociety.com.au/sites/default/files/2018-03/Statement%20ASCE.pdf" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>'Notice of Show Cause Event'</a> form.
              </p>
            </div>
            <label style={{fontSize:16,color:'#0b1220',display:'block',marginBottom:6}}>
              Please attach a completed 'Notice of Show Cause Event' form: <span style={{color:'#F26522'}}>*</span>
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
