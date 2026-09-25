import React, { useState } from 'react';
import FileUploadField from './FileUploadField';

type Props = {
  errors?: {
    heldNSWCertificate?: string;
    heldNSWCertificateDetails?: string;
    heldOtherAusCertificate?: string;
    heldOtherAusCertificateDetails?: string;
    currentOtherAusCertificate?: string;
    currentOtherAusCertificateDetails?: string;
    currentAusPractisingCert?: string;
    currentAusPractisingCertDetails?: string;
  };
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onFileSelect?: (fieldName: string, files: File[] | null) => void;
  existingFiles?: File[];
};

type QuestionProps = {
  name: string;
  question: string;
  detailsName: string;
  show: boolean;
  required?: boolean;
  onRadioChange: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onFileSelect?: (fieldName: string, files: File[] | null) => void;
  error?: string;
  detailsError?: string;
};

function Question({ name, question, detailsName, show, required, onRadioChange, onChange, onBlur, error, detailsError }: Omit<QuestionProps, 'onFileSelect'>) {
  return (
    <div style={{marginBottom:24}}>
      <p style={{fontSize:16,color:'#0b1220',marginBottom:10,lineHeight:'24px',fontWeight:700}}>{question}{required && <span style={{color:'#F26522'}}> *</span>}</p>
      <div style={{display:'flex',flexDirection:'row',gap:24,flexWrap:'wrap'}}>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
          <input
            type="radio"
            name={name}
            value="yes"
            onChange={(e) => { onRadioChange('yes'); onChange && onChange(e); }}
          />
          <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes</span>
        </label>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
          <input
            type="radio"
            name={name}
            value="no"
            onChange={(e) => { onRadioChange('no'); onChange && onChange(e); }}
          />
          <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No</span>
        </label>
      </div>
      {error && <span className="error-message">{error}</span>}
      {show && (
        <div style={{marginTop:10}}>
          <label style={{fontSize:16,color:'#0b1220',display:'block',marginBottom:6,fontWeight:400}}>Please provide details below: <span style={{color:'#F26522'}}>*</span></label>
          <textarea
            name={detailsName}
            onChange={onChange}
            onBlur={(e) => onBlur && onBlur(detailsName, e.target.value)}
            style={{
              width:'100%',
              minHeight:80,
              padding:'8px 10px',
              border:`1px solid ${detailsError ? '#C0392B' : '#9EA5AB'}`,
              borderRadius:3,
              fontSize:16,
              lineHeight:'24px',
              background:'#eaf0ff',
              color:'#0b1220',
              fontFamily:'inherit',
              resize:'vertical',
              boxSizing:'border-box'
            }}
          />
          {detailsError && <span className="error-message">{detailsError}</span>}
        </div>
      )}
    </div>
  );
}

export default function ARCNewCurrentCertSection({ errors, onChange, onBlur, onFileSelect, existingFiles }: Props) {
  const [showNSW, setShowNSW] = useState(false);
  const [showOtherAus, setShowOtherAus] = useState(false);
  const [showCurrentOtherAus, setShowCurrentOtherAus] = useState(false);
  const [showCurrentAus, setShowCurrentAus] = useState(false);

  return (
    <>
      <h2 className="section-title">9. Current or Previously Held Australian Certificate</h2>

      <div id="cert-section" style={{marginTop:12}}>
        <Question
          name="heldOtherAusCertificate"
          question="Have you ever held or do you currently hold a registration certificate in another Australian jurisdiction?"
          detailsName="heldOtherAusCertificateDetails"
          show={showOtherAus}
          required
          onRadioChange={(v) => setShowOtherAus(v === 'yes')}                
          onChange={onChange}
          onBlur={onBlur}
          error={errors?.heldOtherAusCertificate}
          detailsError={errors?.heldOtherAusCertificateDetails}
        />
        {showOtherAus && (
          <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginTop:8,marginBottom:8}}>
            <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
              <strong>NOTE:</strong> Please provide a certificate of fitness from the other Australian jurisdiction/s. If you hold a current registration in another Australian jurisdiction, that registration certificate will need to be surrendered.
            </p>
          </div>
        )}
        <Question
          name="currentAusPractisingCert"
          question="Do you hold a current Australian practising certificate as at the date of this application?"
          detailsName="currentAusPractisingCertDetails"
          show={showCurrentAus}
          required
          onRadioChange={(v) => setShowCurrentAus(v === 'yes')}        
          onChange={onChange}
          onBlur={onBlur}
          error={errors?.currentAusPractisingCert}
          detailsError={errors?.currentAusPractisingCertDetails}
        />
        {showCurrentAus && (
          <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginTop:8,marginBottom:8}}>
            <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
              <strong>NOTE:</strong> Please note that you are already licensed to practice in NSW by virtue of the grant of a practising certificate. Please find further information <a href="https://www.lawsociety.com.au/practising-law-in-NSW/working-as-a-solicitor-in-NSW/your-practising-certificate" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>here</a>.
            </p>
          </div>
        )}

        <div style={{marginTop:8}}>
          <label style={{fontSize:16,color:'#0b1220',display:'block',marginBottom:6,fontWeight:400}}>Attach additional page if necessary.</label>
          <FileUploadField
            files={existingFiles || null}
            onFilesChange={(f) => { if (onFileSelect) onFileSelect('cert9Attachment', f); }}
          />
        </div>
      </div>
    </>
  );
}
