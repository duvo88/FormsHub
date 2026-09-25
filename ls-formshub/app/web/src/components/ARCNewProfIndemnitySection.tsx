import React, { useState, forwardRef, useImperativeHandle } from 'react';
import FileUploadField from './FileUploadField';

type Props = {
  sectionTitle?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function FileUpload({ required, externalError }: { id: string; required?: boolean; externalError?: string }) {
  const [files, setFiles] = useState<File[] | null>(null);

  return (
    <div style={{marginTop:10}}>
      <p style={{fontSize:15,color:'#0b1220',marginBottom:6,fontStyle:'italic'}}>Attach evidence of insurance cover: {required && <span style={{color:'#F26522'}}>*</span>}</p>
      <FileUploadField files={files} onFilesChange={setFiles} error={externalError} />
    </div>
  );
}

const radioStyle: React.CSSProperties = {display:'flex',flexDirection:'column',gap:10,marginBottom:8};
const labelStyle: React.CSSProperties = {display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400};
const spanStyle: React.CSSProperties = {fontSize:16,color:'#0b1220',lineHeight:'24px',fontWeight:400};

function Undertaking({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  return (
    <div style={{marginTop:20,padding:'14px 16px',border:'1px solid #9EA5AB',borderRadius:4,background:'#f7f9ff'}}>
      <p style={{fontSize:16,color:'#0b1220',fontWeight:600,marginBottom:12}}>Undertaking:</p>
      <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{marginTop:3,flexShrink:0,width:16,height:16}} />
        <span style={{fontSize:15,color:'#0b1220',lineHeight:'24px'}}>
          Upon the grant of my Australian registration certificate, I undertake to provide a disclosure
          statement in writing to each client before, or as soon as practicable after, being retained for
          legal services in this jurisdiction stating—
          <br />(a) whether or not I am covered by other professional indemnity insurance; and
          <br />(b) if covered, the nature and extent of that insurance. <span style={{color:'#F26522'}}>*</span>
        </span>
      </label>
      {error && <span className="error-message" style={{marginTop:6,display:'block'}}>{error}</span>}
    </div>
  );
}

export interface ARCNewProfIndemnitySectionHandle {
  validate: () => boolean;
  getValues: () => { q1: string; q2: string; q4: string; undertaking: boolean };
}

const ARCNewProfIndemnitySection = forwardRef<ARCNewProfIndemnitySectionHandle, Props>(function ARCNewProfIndemnitySection({ sectionTitle, onChange }, ref) {
  const [q1, setQ1] = useState('');
  const [q1Error, setQ1Error] = useState('');
  const [q2, setQ2] = useState('');
  const [q2Error, setQ2Error] = useState('');
  const [q3, setQ3] = useState('');
  const [q3Error, setQ3Error] = useState('');
  const [q4, setQ4] = useState('');
  const [q4Error, setQ4Error] = useState('');
  const [undertaking, setUndertaking] = useState(false);
  const [undertakingError, setUndertakingError] = useState('');

  const showUndertaking = q1 === 'no' || (q1 === 'yes' && q2 === 'no' && (q4 === 'yes' || q4 === 'no'));

  useImperativeHandle(ref, () => ({
    validate() {
      let valid = true;
      if (!q1) { setQ1Error('Please select an option'); valid = false; } else { setQ1Error(''); }
      if (q1 === 'yes') {
        if (!q2) { setQ2Error('Please select an option'); valid = false; } else { setQ2Error(''); }
      }
      if (q1 === 'yes' && q2 === 'no') {
        if (!q4) { setQ4Error('Please select an option'); valid = false; } else { setQ4Error(''); }
      }
      if (showUndertaking) {
        if (!undertaking) { setUndertakingError('You must confirm the undertaking'); valid = false; } else { setUndertakingError(''); }
      }
      return valid;
    },
    getValues() {
      return { q1, q2, q4, undertaking };
    },
  }));

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '10. Professional Indemnity Insurance'}</h2>

      <div id="pii-section" style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:8,lineHeight:'24px'}}>
          There are specific professional indemnity insurance requirements for Australian-registered foreign
          lawyers under the legal profession legislation.
        </p>

        {/* Q1 */}
        <div style={{marginBottom:20}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:10,lineHeight:'24px',fontWeight:600}}>
            1. Do you hold or are you covered by an approved professional indemnity insurance policy that covers your practice of foreign law in New South <span style={{whiteSpace:'nowrap'}}>Wales? <span style={{color:'#F26522'}}>*</span></span>
          </p>
          <div style={radioStyle} onBlur={() => { if (!q1) setQ1Error('Please select an option'); }}>
            <label style={labelStyle}>
              <input type="radio" name="pii_q1" value="yes" style={{marginTop:3,flexShrink:0}}
                onChange={(e) => { setQ1('yes'); setQ2(''); setQ3(''); setQ4(''); setQ1Error(''); setQ2Error(''); setQ3Error(''); setQ4Error(''); onChange && onChange(e); }} />
              <span style={spanStyle}>Yes (please complete question 2)</span>
            </label>
            <label style={labelStyle}>
              <input type="radio" name="pii_q1" value="no" style={{marginTop:3,flexShrink:0}}
                onChange={(e) => { setQ1('no'); setQ2(''); setQ3(''); setQ4(''); setQ1Error(''); setQ2Error(''); setQ3Error(''); setQ4Error(''); onChange && onChange(e); }} />
              <span style={spanStyle}>No (please complete the undertaking below)</span>
            </label>
          </div>
          {q1Error && <span className="error-message">{q1Error}</span>}
        </div>

        {/* Q2 */}
        {q1 === 'yes' && (
          <div style={{marginBottom:20}}>
            <p style={{fontSize:16,color:'#0b1220',marginBottom:10,lineHeight:'24px',fontWeight:600}}>
              2. Do you hold or are you covered by an approved insurance policy issued by an Australian jurisdiction? <span style={{color:'#F26522'}}>*</span>
            </p>
            <div style={radioStyle}>
              <label style={labelStyle}>
                <input type="radio" name="pii_q2" value="yes" style={{marginTop:3,flexShrink:0}}
                onChange={(e) => { setQ2('yes'); setQ3(''); setQ4(''); setQ2Error(''); onChange && onChange(e); }} />
              <span style={spanStyle}>Yes (Please attach evidence of the approved insurance cover issued in an Australian jurisdiction (these approved insurance providers are: Lawcover, LPLC, Lexon, Law Mutual, Law Society of Tasmania, Law Society of South Australia)</span>
            </label>
            <label style={labelStyle}>
                <input type="radio" name="pii_q2" value="no" style={{marginTop:3,flexShrink:0}}
                onChange={(e) => { setQ2('no'); setQ3(''); setQ4(''); setQ2Error(''); onChange && onChange(e); }} />
              <span style={spanStyle}>No (please proceed to question 3)</span>
            </label>
          </div>
          {q2Error && <span className="error-message">{q2Error}</span>}
            {q2 === 'yes' && <FileUpload id="pii_attach_q2" required />}
          </div>
        )}

        {/* Q4 */}
        {q1 === 'yes' && q2 === 'no' && (
          <div style={{marginBottom:20}}>
            <p style={{fontSize:16,color:'#0b1220',marginBottom:10,lineHeight:'24px',fontWeight:600}}>
              3. Do you hold or are you covered by an insurance policy issued by a foreign jurisdiction? <span style={{color:'#F26522'}}>*</span>
            </p>
            <div style={radioStyle}>
              <label style={labelStyle}>
                <input type="radio" name="pii_q4" value="yes" style={{marginTop:3,flexShrink:0}}
                onChange={(e) => { setQ4('yes'); setQ4Error(''); onChange && onChange(e); }} />
              <span style={spanStyle}>Yes (attach evidence of insurance cover and complete the undertaking below)</span>
            </label>
            <label style={labelStyle}>
              <input type="radio" name="pii_q4" value="no" style={{marginTop:3,flexShrink:0}}
                onChange={(e) => { setQ4('no'); setQ4Error(''); onChange && onChange(e); }} />
              <span style={spanStyle}>No (please complete the undertaking below)</span>
            </label>
          </div>
          {q4Error && <span className="error-message">{q4Error}</span>}
            {q4 === 'yes' && <FileUpload id="pii_attach_q4" required />}
          </div>
        )}

        {/* Undertaking */}
        {showUndertaking && <Undertaking checked={undertaking} onChange={(v) => { setUndertaking(v); if (v) setUndertakingError(''); onChange?.({ target: { name: 'piiUndertaking', value: v ? 'yes' : '', type: 'checkbox' } } as React.ChangeEvent<HTMLInputElement>); }} error={undertakingError} />}
      </div>
    </>
  );
});

export default ARCNewProfIndemnitySection;
