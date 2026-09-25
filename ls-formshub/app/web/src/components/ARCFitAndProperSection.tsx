import React, { useState } from 'react';
import FileUploadField from './FileUploadField';

type Props = {
  sectionTitle?: string;
  errors?: { fitAndProper?: string; fitAndProperAttachment?: string };
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onFileSelect?: (fieldName: string, files: File[] | null) => void;
  existingFiles?: File[];
};

export default function ARCFitAndProperSection({ sectionTitle, errors, onChange, onBlur, onFileSelect, existingFiles }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const handleChange = (value: string) => {
    setShowDetails(value === 'yes');
    if (value === 'no' && onFileSelect) onFileSelect('fitAndProperAttachment', null);
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '7. Fit and Proper Person'}</h2>

      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:12,lineHeight:'24px',fontWeight:700}}>
          Is there any matter referred to in <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.62" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 62(3)</a> of the <em>Legal Profession Uniform Law (NSW)</em> and <a href="https://legislation.nsw.gov.au/view/html/inforce/current/sl-2015-0246#sec.20" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>rules 20</a> and <a href="https://legislation.nsw.gov.au/view/html/inforce/current/sl-2015-0246#sec.21" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>21</a> of the <em>Legal Profession Uniform Law General Rules 2015</em> which is applicable to you, and which you have not previously disclosed in writing to the Law Society? <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{display:'flex',flexDirection:'row',gap:24,marginBottom:4,flexWrap:'wrap'}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input
              type="radio"
              name="fitAndProper"
              value="yes"
              onChange={(e) => { handleChange(e.target.value); onChange && onChange(e); }}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input
              type="radio"
              name="fitAndProper"
              value="no"
              onChange={(e) => { handleChange(e.target.value); onChange && onChange(e); }}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No</span>
          </label>
        </div>
        {errors?.fitAndProper && <span className="error-message">{errors.fitAndProper}</span>}

        {showDetails && (
          <div style={{marginTop:12}}>
            <label style={{fontSize:16,color:'#0b1220',display:'block',marginBottom:6,fontWeight:400}}>
              Please provide a statement of all matters not previously disclosed in writing to the Law Society: <span style={{color:'#F26522'}}>*</span>
            </label>
            <FileUploadField
              files={existingFiles || null}
              onFilesChange={(f) => {
                if (onFileSelect) onFileSelect('fitAndProperAttachment', f);
                if (onBlur) onBlur('fitAndProperAttachment', f ? f.map(x => x.name).join(', ') : '');
              }}
              error={errors?.fitAndProperAttachment}
            />
          </div>
        )}
      </div>
    </>
  );
}
