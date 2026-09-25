import React, { useState } from 'react';
import FileUploadField from './FileUploadField';

type FitAndProperErrors = {
  fitAndProper?: string;
  fitAndProperAttachment?: string;
};

type Props = {
  sectionTitle?: string;
  errors?: FitAndProperErrors;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onFileSelect?: (fieldName: string, files: File[] | null) => void;
  existingFiles?: File[];
};



export default function FitAndProperPersonSection({ errors, onChange, onBlur, onFileSelect, existingFiles, sectionTitle }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const handleFitAndProperChange = (value: string) => {
    setShowDetails(value === 'yes');
    if (value === 'no') {
      if (onFileSelect) onFileSelect('fitAndProperAttachment', null);
    }
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '9. Fit and Proper Person'}</h2>

      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:12,lineHeight:'24px'}}>
          Is there any matter (including a finding, conduct or event) referred to in <a href="https://legislation.nsw.gov.au/view/html/inforce/current/sl-2015-0246#sec.13" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>rule 15(1)</a> of the <em>Legal Profession Uniform General Rules 2015 (Rules)</em> which is applicable to you and which you have not previously disclosed in writing to the Law Society? You must also disclose such matters even if you have already disclosed them to the Legal Profession Admissions Board (or the equivalent in another jurisdiction at the time of admission or to a body that issued you with a practising certificate. <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:15,marginBottom:16}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer'}}>
            <input 
              type="radio" 
              name="fitAndProper" 
              value="yes" 
              style={{marginTop:3,flexShrink:0}} 
              onChange={(e) => {handleFitAndProperChange(e.target.value); onChange && onChange(e);}}
            />
            <span style={{fontSize:16,color:'#0b1220',lineHeight:'24px'}}>Yes (Please complete a statement in accordance with rule 15(2) of the Rules which addresses all of the matters in rule 15 relevant to you that you have not previously disclosed, including why you are a fit and proper person to hold an Australian practising certificate notwithstanding the matter disclosed).</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input 
              type="radio" 
              name="fitAndProper" 
              value="no" 
               
              onChange={(e) => {handleFitAndProperChange(e.target.value); onChange && onChange(e);}}
            />
            <span style={{fontSize:16,color:'#0b1220'}}>No</span>
          </label>
        </div>
        {errors?.fitAndProper && (
          <span className="error-message">
            {errors.fitAndProper}
          </span>
        )}

        {showDetails && (
          <div style={{marginTop:12}}>
            <label style={{fontSize:16,color:'#0b1220',display:'block',marginBottom:6}}>
              Please attach your statement: <span style={{color:'#F26522'}}>*</span>
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
