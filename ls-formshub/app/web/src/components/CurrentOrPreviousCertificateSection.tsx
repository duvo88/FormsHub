import React, { useState } from 'react';
import FileUploadField from './FileUploadField';

type CurrentCertificateErrors = {
  heldNSWCertificate?: string;
  nswCertificateDetails?: string;
  currentAustralianCertificate?: string;
  currentAustralianCertificateDetails?: string;
  heldOtherAustralianCertificate?: string;
  otherAustralianCertificateDetails?: string;
  heldForeignCertificate?: string;
  foreignCertificateDetails?: string;
};

type Props = {
  sectionTitle?: string;
  errors?: CurrentCertificateErrors;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
};

export default function CurrentOrPreviousCertificateSection({ errors, onChange, onBlur, sectionTitle }: Props) {
  const [showNSWDetails, setShowNSWDetails] = useState(false);
  const [showCurrentAusDetails, setShowCurrentAusDetails] = useState(false);
  const [showOtherAusDetails, setShowOtherAusDetails] = useState(false);
  const [showForeignDetails, setShowForeignDetails] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);

  const clearTextField = (fieldName: string) => {
    if (onChange) {
      const syntheticEvent = { target: { name: fieldName, value: '', type: 'text' } } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };



  const handleBlur = (fieldName: string) => (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (onBlur) {
      onBlur(fieldName, e.target.value);
    }
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '11. Current or Previously Held Practising Certificate'}</h2>

      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:12,fontWeight:600}}>
          You must provide an answer to each of the following questions:
        </p>

        {/* Question 1 */}
        <div style={{marginBottom:20}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:600}}>
            Have you ever held a solicitor's practising certificate in New South Wales? <span style={{color:'#F26522'}}>*</span>
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:15}}>
            <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer'}}>
              <input 
                type="radio" 
                name="heldNSWCertificate" 
                value="yes" 
                style={{marginTop:3,flexShrink:0}} 
                onChange={(e) => {setShowNSWDetails(e.target.value === 'yes'); onChange && onChange(e);}}
              />
              <span style={{fontSize:16,color:'#0b1220',lineHeight:'24px'}}>Yes</span>
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input 
                type="radio" 
                name="heldNSWCertificate" 
                value="no" 
                 
                onChange={(e) => {setShowNSWDetails(e.target.value === 'yes'); if (e.target.value === 'no') clearTextField('nswCertificateDetails'); onChange && onChange(e);}}
              />
              <span style={{fontSize:16,color:'#0b1220'}}>No</span>
            </label>
          </div>
          {errors?.heldNSWCertificate && (
            <span className="error-message">
              {errors.heldNSWCertificate}
            </span>
          )}
          {showNSWDetails && (
            <>
              <label style={{fontSize:16,color:'#0b1220',display:'block',marginTop:12,marginBottom:6}}>
                Please provide details below: <span style={{color:'#F26522'}}>*</span>
              </label>
              <textarea 
                name="nswCertificateDetails"
                placeholder=""
                onChange={onChange}
                onBlur={handleBlur('nswCertificateDetails')}
                style={{
                  width:'calc(100% - 20px)',
                  minHeight:80,
                  padding:'8px 10px',
                  border:`1px solid ${errors?.nswCertificateDetails ? '#C0392B' : '#9EA5AB'}`,
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
              {errors?.nswCertificateDetails && (
                <span className="error-message">
                  {errors.nswCertificateDetails}
                </span>
              )}
            </>
          )}
        </div>

        {/* Question 2 */}
        <div style={{marginBottom:20}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:600}}>
            Do you hold a current practising certificate in another Australian jurisdiction as at the date of this application? <span style={{color:'#F26522'}}>*</span>
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:15}}>
            <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer'}}>
              <input 
                type="radio" 
                name="currentAustralianCertificate" 
                value="yes" 
                style={{marginTop:3,flexShrink:0}} 
                onChange={(e) => {setShowCurrentAusDetails(e.target.value === 'yes'); onChange && onChange(e);}}
              />
              <span style={{fontSize:16,color:'#0b1220',lineHeight:'24px'}}>Yes</span>
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input 
                type="radio" 
                name="currentAustralianCertificate" 
                value="no" 
                 
                onChange={(e) => {setShowCurrentAusDetails(e.target.value === 'yes'); if (e.target.value === 'no') clearTextField('currentAustralianCertificateDetails'); onChange && onChange(e);}}
              />
              <span style={{fontSize:16,color:'#0b1220'}}>No</span>
            </label>
          </div>
          {errors?.currentAustralianCertificate && (
            <span className="error-message">
              {errors.currentAustralianCertificate}
            </span>
          )}
          {showCurrentAusDetails && (
            <>
              <label style={{fontSize:16,color:'#0b1220',display:'block',marginTop:12,marginBottom:6}}>
                Please provide details below: <span style={{color:'#F26522'}}>*</span>
              </label>
              <textarea 
                name="currentAustralianCertificateDetails"
                placeholder=""
                onChange={onChange}
                onBlur={handleBlur('currentAustralianCertificateDetails')}
                style={{
                  width:'calc(100% - 20px)',
                  minHeight:80,
                  padding:'8px 10px',
                  border:`1px solid ${errors?.currentAustralianCertificateDetails ? '#C0392B' : '#9EA5AB'}`,
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
              {errors?.currentAustralianCertificateDetails && (
                <span className="error-message">
                  {errors.currentAustralianCertificateDetails}
                </span>
              )}
            </>
          )}
        </div>

        {/* Question 3 */}
        <div style={{marginBottom:20}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:600}}>
            Have you ever held a solicitor's practising certificate in an Australian jurisdiction other than New South Wales? <span style={{color:'#F26522'}}>*</span>
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:15}}>
            <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer'}}>
              <input 
                type="radio" 
                name="heldOtherAustralianCertificate" 
                value="yes" 
                style={{marginTop:3,flexShrink:0}} 
                onChange={(e) => {setShowOtherAusDetails(e.target.value === 'yes'); onChange && onChange(e);}}
              />
              <span style={{fontSize:16,color:'#0b1220',lineHeight:'24px'}}>Yes</span>
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input 
                type="radio" 
                name="heldOtherAustralianCertificate" 
                value="no" 
                 
                onChange={(e) => {setShowOtherAusDetails(e.target.value === 'yes'); if (e.target.value === 'no') clearTextField('otherAustralianCertificateDetails'); onChange && onChange(e);}}
              />
              <span style={{fontSize:16,color:'#0b1220'}}>No</span>
            </label>
          </div>
          {errors?.heldOtherAustralianCertificate && (
            <span className="error-message">
              {errors.heldOtherAustralianCertificate}
            </span>
          )}
          {showOtherAusDetails && (
            <>
              <label style={{fontSize:16,color:'#0b1220',display:'block',marginTop:12,marginBottom:6}}>
                Please provide details below: <span style={{color:'#F26522'}}>*</span>
              </label>
              <textarea 
                name="otherAustralianCertificateDetails"
                placeholder=""
                onChange={onChange}
                onBlur={handleBlur('otherAustralianCertificateDetails')}
                style={{
                  width:'calc(100% - 20px)',
                  minHeight:80,
                  padding:'8px 10px',
                  border:`1px solid ${errors?.otherAustralianCertificateDetails ? '#C0392B' : '#9EA5AB'}`,
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
              {errors?.otherAustralianCertificateDetails && (
                <span className="error-message">
                  {errors.otherAustralianCertificateDetails}
                </span>
              )}
            </>
          )}
        </div>

        {/* Question 4 */}
        <div style={{marginBottom:20}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:600}}>
            Have you ever held a practising certificate or been registered to practise in a foreign jurisdiction? <span style={{color:'#F26522'}}>*</span>
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:15}}>
            <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer'}}>
              <input 
                type="radio" 
                name="heldForeignCertificate" 
                value="yes" 
                style={{marginTop:3,flexShrink:0}} 
                onChange={(e) => {setShowForeignDetails(e.target.value === 'yes'); onChange && onChange(e);}}
              />
              <span style={{fontSize:16,color:'#0b1220',lineHeight:'24px'}}>Yes</span>
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input 
                type="radio" 
                name="heldForeignCertificate" 
                value="no" 
                 
                onChange={(e) => {setShowForeignDetails(e.target.value === 'yes'); if (e.target.value === 'no') clearTextField('foreignCertificateDetails'); onChange && onChange(e);}}
              />
              <span style={{fontSize:16,color:'#0b1220'}}>No</span>
            </label>
          </div>
          {errors?.heldForeignCertificate && (
            <span className="error-message">
              {errors.heldForeignCertificate}
            </span>
          )}
          {showForeignDetails && (
            <>
              <label style={{fontSize:16,color:'#0b1220',display:'block',marginTop:12,marginBottom:6}}>
                Please provide details below: <span style={{color:'#F26522'}}>*</span>
              </label>
              <textarea 
                name="foreignCertificateDetails"
                placeholder=""
                onChange={onChange}
                onBlur={handleBlur('foreignCertificateDetails')}
                style={{
                  width:'calc(100% - 20px)',
                  minHeight:80,
                  padding:'8px 10px',
                  border:`1px solid ${errors?.foreignCertificateDetails ? '#C0392B' : '#9EA5AB'}`,
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
              {errors?.foreignCertificateDetails && (
                <span className="error-message">
                  {errors.foreignCertificateDetails}
                </span>
              )}
            </>
          )}
        </div>

        <div style={{marginTop:12}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:6}}>
            Attach additional page if necessary.
          </p>
          <FileUploadField files={files} onFilesChange={setFiles} />
          </div>
        </div>
    </>
  );
}
