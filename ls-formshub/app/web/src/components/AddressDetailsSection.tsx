import React, { useState, forwardRef, useImperativeHandle } from 'react';
import FileUploadField from './FileUploadField';

function PiiFileUpload({ id, required }: { id: string; required?: boolean }) {
  const [files, setFiles] = useState<File[] | null>(null);
  const [touched, setTouched] = useState(false);
  const showError = required && touched && (!files || files.length === 0);
  return (
    <div style={{marginTop:10}}>
      <p style={{fontSize:15,color:'#0b1220',marginBottom:6,fontStyle:'italic'}}>Attach evidence of insurance cover: <span style={{color:'#F26522'}}>*</span></p>
      <FileUploadField files={files} onFilesChange={f => { setFiles(f); setTouched(true); }} />
      {showError && <span className="error-message">Please attach evidence of insurance cover</span>}
    </div>
  );
}

type Props = {
  sectionTitle?: string;
  errors?: Record<string, string>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  splitFormOfPracticeLabel?: boolean;
  showFormOfPractice?: boolean;
  showFitAndProper?: boolean;
  showShowCauseEvents?: boolean;
  showProfessionalIndemnity?: boolean;
  formOfPracticeNote?: string;
  hideFormOfPracticeNumber?: boolean;
  hideFormOfPracticeText?: boolean;
};

export interface AddressDetailsSectionHandle {
  validate: () => boolean;
}

const AddressDetailsSection = forwardRef<AddressDetailsSectionHandle, Props>(function AddressDetailsSection({ errors, onChange, onBlur, sectionTitle, splitFormOfPracticeLabel, showFormOfPractice = true, showFitAndProper, showShowCauseEvents, showProfessionalIndemnity, formOfPracticeNote = 'E', hideFormOfPracticeNumber, hideFormOfPracticeText }, ref) {
  const [formOfPractice, setFormOfPractice] = useState('');
  const [formOfPracticeOther, setFormOfPracticeOther] = useState('');
  const [formOfPracticeOtherError, setFormOfPracticeOtherError] = useState('');
  const [fitAndProper, setFitAndProper] = useState('');
  const [fitAndProperError, setFitAndProperError] = useState('');
  const [fitAndProperFiles, setFitAndProperFiles] = useState<File[] | null>(null);
  const [showCauseEvent, setShowCauseEvent] = useState('');
  const [showCauseError, setShowCauseError] = useState('');
  const [showCauseFiles, setShowCauseFiles] = useState<File[] | null>(null);
  const [showCauseFileError, setShowCauseFileError] = useState('');
  const [pii1, setPii1] = useState('');
  const [pii2, setPii2] = useState('');
  const [pii3, setPii3] = useState('');
  const [pii4, setPii4] = useState('');
  const [pii1Error, setPii1Error] = useState('');
  const [pii2Error, setPii2Error] = useState('');
  const [pii3Error, setPii3Error] = useState('');
  const [pii4Error, setPii4Error] = useState('');
  const [undertaking, setUndertaking] = useState(false);
  const [undertakingError, setUndertakingError] = useState('');
  const formOfPracticeOtherCombinedError = formOfPracticeOtherError || errors?.formOfPracticeOther || '';

  useImperativeHandle(ref, () => ({
    validate() {
      let valid = true;
      if (showFitAndProper) {
        if (!fitAndProper) { setFitAndProperError('Please select an option'); valid = false; } else { setFitAndProperError(''); }
      }
      if (showShowCauseEvents) {
        if (!showCauseEvent) { setShowCauseError('Please select an option'); valid = false; } else { setShowCauseError(''); }
      }
      if (showProfessionalIndemnity) {
        if (!pii1) { setPii1Error('Please select an option'); valid = false; } else { setPii1Error(''); }
        if (pii1 === 'yes') {
          if (!pii2) { setPii2Error('Please select an option'); valid = false; } else { setPii2Error(''); }
        }
        if (pii1 === 'yes' && pii2 === 'no') {
          if (!pii3) { setPii3Error('Please select an option'); valid = false; } else { setPii3Error(''); }
        }
        if (pii1 === 'yes' && pii2 === 'no' && pii3 === 'no') {
          if (!pii4) { setPii4Error('Please select an option'); valid = false; } else { setPii4Error(''); }
        }
        const showUndertaking = pii1 === 'no' || (pii1 === 'yes' && pii2 === 'no' && pii3 === 'no' && (pii4 === 'yes' || pii4 === 'no'));
        if (showUndertaking) {
          if (!undertaking) { setUndertakingError('You must confirm the undertaking'); valid = false; } else { setUndertakingError(''); }
        }
      }
      return valid;
    }
  }));

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '6. Details of Principal Place of Practice in Australia'}</h2>
      <p style={{fontSize:15,color:'#0b1220',marginTop:8,marginBottom:0,fontStyle:'italic'}}>This does not entitle the Australian-registered foreign lawyer to practise Australian law in this jurisdiction</p>

      {showFormOfPractice && (
      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:8,fontWeight:600}}>
          {hideFormOfPracticeNumber ? '' : '1. '}Please indicate: <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
            <input type="radio" name="formOfPractice" value="sole" onChange={() => { setFormOfPractice('sole'); onChange?.({ target: { name: 'formOfPractice', value: 'sole', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} style={{marginTop:3}} />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>On the foreign lawyer's own account; or</span>
          </label>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
            <input type="radio" name="formOfPractice" value="partnership" onChange={() => { setFormOfPractice('partnership'); onChange?.({ target: { name: 'formOfPractice', value: 'partnership', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} style={{marginTop:3}} />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>As a partner in a law firm, as defined in the legal profession legislation; or</span>
          </label>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
            <input type="radio" name="formOfPractice" value="volunteer" onChange={() => { setFormOfPractice('volunteer'); onChange?.({ target: { name: 'formOfPractice', value: 'volunteer', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} style={{marginTop:3}} />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>In a partnership with one or more Australian-registered foreign lawyers in circumstances where, if the Australian-registered foreign lawyer were an Australian legal practitioner, the partnership would be permitted under a law of this jurisdiction; or</span>
          </label>
           <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
            <input type="radio" name="formOfPractice" value="volunteer_probono" onChange={() => { setFormOfPractice('volunteer_probono'); onChange?.({ target: { name: 'formOfPractice', value: 'volunteer_probono', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} style={{marginTop:3}} />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>As a volunteer at a community legal service or otherwise on a pro bono basis; or</span>
          </label>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
            <input type="radio" name="formOfPractice" value="incorporated" onChange={() => { setFormOfPractice('incorporated'); onChange?.({ target: { name: 'formOfPractice', value: 'incorporated', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} style={{marginTop:3}} />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>As a partner, director, officer or employee of an incorporated legal practice or unincorporated legal practice; or</span>
          </label>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
            <input type="radio" name="formOfPractice" value="employee" onChange={() => { setFormOfPractice('employee'); onChange?.({ target: { name: 'formOfPractice', value: 'employee', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} style={{marginTop:3}} />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>As an employee of a law practice, as defined in the legal profession legislation; or</span>
          </label>
          <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
            <input type="radio" name="formOfPractice" value="employeeARFL" onChange={() => { setFormOfPractice('employeeARFL'); onChange?.({ target: { name: 'formOfPractice', value: 'employeeARFL', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} style={{marginTop:3}} />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>As an employee of an Australian-registered foreign lawyer; or</span>
          </label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
              <input type="radio" name="formOfPractice" value="other" onChange={() => { setFormOfPractice('other'); setFormOfPracticeOtherError(''); onChange?.({ target: { name: 'formOfPractice', value: 'other', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
              <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Other</span>
            </label>
            {formOfPractice === 'other' && (
              <div style={{marginLeft:24}}>
                <p style={{fontSize:15,color:'#0b1220',fontWeight:400,marginBottom:6,marginTop:4}}>Please include details of other form of practice. We refer you to s 70 of the <em>Legal Profession Uniform Law (NSW)</em>, for consideration <span style={{color:'#F26522'}}>*</span></p>
                <input
                  type="text"
                  name="formOfPracticeOther"
                  value={formOfPracticeOther}
                  onChange={(e) => { setFormOfPracticeOther(e.target.value); onChange?.({ target: { name: 'formOfPracticeOther', value: e.target.value, type: 'text' } } as React.ChangeEvent<HTMLInputElement>); if (e.target.value.trim()) setFormOfPracticeOtherError(''); }}
                  onBlur={() => {
                    if (!formOfPracticeOther.trim()) setFormOfPracticeOtherError('Please include details of other form of practice');
                    onBlur?.('formOfPracticeOther', formOfPracticeOther);
                  }}
                  style={{width:'100%',padding:'6px 10px',fontSize:16,border:`1px solid ${formOfPracticeOtherCombinedError ? '#C0392B' : '#ccc'}`,borderRadius:4,boxSizing:'border-box'}}
                />
                {formOfPracticeOtherCombinedError && <span className="error-message" style={{marginTop:'10px'}}>{formOfPracticeOtherCombinedError}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {showFitAndProper && (
        <div style={{marginTop:16}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:8,fontWeight:600}}>Is there any matter referred to in section 62(3) of the Legal Profession Uniform Law and rules 20 and 21 of the Legal Profession Uniform General Rules 2015 which is applicable to you and which you have not previously disclosed in writing to the Law Society? <span style={{color:'#F26522'}}>*</span></p>
          <div style={{display:'flex',flexDirection:'row',gap:24,marginBottom:8}} onBlur={() => { if (!fitAndProper) setFitAndProperError('Please select an option'); }}>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
              <input type="radio" name="fitAndProper" value="yes" onChange={() => { setFitAndProper('yes'); setFitAndProperError(''); onChange?.({ target: { name: 'fitAndProper', value: 'yes', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
              <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes</span>
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
              <input type="radio" name="fitAndProper" value="no" onChange={() => { setFitAndProper('no'); setFitAndProperError(''); onChange?.({ target: { name: 'fitAndProper', value: 'no', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
              <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No</span>
            </label>
          </div>
          {fitAndProperError && <span className="error-message">{fitAndProperError}</span>}
          {fitAndProper === 'yes' && (
            <div style={{marginTop:8}}>
              <p style={{fontSize:16,color:'#0b1220',fontWeight:400,marginBottom:6}}>Please provide a statement of all matters not previously disclosed in writing to the Law Society:</p>
              <FileUploadField files={fitAndProperFiles} onFilesChange={setFitAndProperFiles} />
            </div>
          )}
        </div>
      )}

      {showShowCauseEvents && (
        <div style={{marginTop:16}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:8,fontWeight:600}}>Is there any matter referred to in sections 87 and 88 of the Legal Profession Uniform Law (NSW) which is applicable to you and which you have not previously disclosed in writing to the Law Society? <span style={{color:'#F26522'}}>*</span></p>
          <div style={{display:'flex',flexDirection:'row',gap:24,marginBottom:8}} onBlur={() => { if (!showCauseEvent) setShowCauseError('Please select an option'); }}>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
              <input type="radio" name="showCauseEvent" value="yes" onChange={() => { setShowCauseEvent('yes'); setShowCauseError(''); setShowCauseFileError(''); onChange?.({ target: { name: 'showCause', value: 'yes', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
              <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes</span>
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
              <input type="radio" name="showCauseEvent" value="no" onChange={() => { setShowCauseEvent('no'); setShowCauseError(''); setShowCauseFileError(''); onChange?.({ target: { name: 'showCause', value: 'no', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
              <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No</span>
            </label>
          </div>
          {showCauseError && <span className="error-message">{showCauseError}</span>}
          {showCauseEvent === 'yes' && (
            <div style={{marginTop:8}}>
              <p style={{fontSize:16,color:'#0b1220',fontWeight:400,marginBottom:6}}>Please complete and submit a &apos;Notice of Show Cause Event&apos; form. <span style={{color:'#F26522'}}>*</span></p>
              <FileUploadField
                files={showCauseFiles}
                onFilesChange={(f) => { setShowCauseFiles(f); if (f && f.length > 0) setShowCauseFileError(''); }}
                error={showCauseFileError}
              />
            </div>
          )}
        </div>
      )}

      {showProfessionalIndemnity && (
        <div id="pii-section" style={{marginTop:16}}>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:4}}>There are specific professional indemnity insurance (PII) requirements for Australian-registered foreign lawyers under the legal profession legislation.</p>
          <p style={{fontSize:16,color:'#0b1220',marginBottom:12,fontWeight:600}}>It is important that you read the following carefully before responding.</p>

          {/* Q1 */}
          <div style={{marginBottom:16}}>
            <p style={{fontSize:16,color:'#0b1220',marginBottom:8,fontWeight:600}}>1. Do you hold or are you covered by professional indemnity insurance that covers you practising foreign law in New South <span style={{whiteSpace:'nowrap'}}>Wales? <span style={{color:'#F26522'}}>*</span></span></p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
                <input type="radio" name="pii1" value="yes" style={{marginTop:3,flexShrink:0}} onChange={() => { setPii1('yes'); setPii2(''); setPii3(''); setPii4(''); setPii1Error(''); onChange?.({ target: { name: 'pii1', value: 'yes', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
                <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes (please complete question 2)</span>
              </label>
              <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
                <input type="radio" name="pii1" value="no" style={{marginTop:3,flexShrink:0}} onChange={() => { setPii1('no'); setPii2(''); setPii3(''); setPii4(''); setPii1Error(''); onChange?.({ target: { name: 'pii1', value: 'no', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
                <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No (please complete the undertaking below)</span>
              </label>
            </div>
            {pii1Error && <span className="error-message">{pii1Error}</span>}
          </div>

          {/* Q2 */}
          {pii1 === 'yes' && (
            <div style={{marginBottom:16}}>
              <p style={{fontSize:16,color:'#0b1220',marginBottom:8,fontWeight:600}}>2. Do you hold or are you covered by an approved insurance policy issued by the New South Wales approved insurer (Lawcover)? <span style={{color:'#F26522'}}>*</span></p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
                  <input type="radio" name="pii2" value="yes" style={{marginTop:3,flexShrink:0}} onChange={() => { setPii2('yes'); setPii3(''); setPii4(''); setPii2Error(''); onChange?.({ target: { name: 'pii2', value: 'yes', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
                  <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes (attach evidence of insurance cover and proceed to section I)</span>
                </label>
                <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
                  <input type="radio" name="pii2" value="no" style={{marginTop:3,flexShrink:0}} onChange={() => { setPii2('no'); setPii3(''); setPii4(''); setPii2Error(''); onChange?.({ target: { name: 'pii2', value: 'no', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
                  <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No (please proceed to question 3)</span>
                </label>
              </div>
              {pii2Error && <span className="error-message">{pii2Error}</span>}
              {pii2 === 'yes' && <PiiFileUpload id="pii_attach_q2" required />}
            </div>
          )}

          {/* Q3 */}
          {pii1 === 'yes' && pii2 === 'no' && (
            <div style={{marginBottom:16}}>
              <p style={{fontSize:16,color:'#0b1220',marginBottom:8,fontWeight:600}}>3. Do you hold or are you covered by an approved insurance policy issued by another Australian jurisdiction? <span style={{color:'#F26522'}}>*</span></p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
                  <input type="radio" name="pii3" value="yes" style={{marginTop:3,flexShrink:0}} onChange={() => { setPii3('yes'); setPii4(''); setPii3Error(''); onChange?.({ target: { name: 'pii3', value: 'yes', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
                  <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes (attach evidence of insurance cover and proceed to section I)</span>
                </label>
                <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
                  <input type="radio" name="pii3" value="no" style={{marginTop:3,flexShrink:0}} onChange={() => { setPii3('no'); setPii4(''); setPii3Error(''); onChange?.({ target: { name: 'pii3', value: 'no', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
                  <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No (please proceed to question 4)</span>
                </label>
              </div>
              {pii3Error && <span className="error-message">{pii3Error}</span>}
              {pii3 === 'yes' && <PiiFileUpload id="pii_attach_q3" required />}
            </div>
          )}

          {/* Q4 */}
          {pii1 === 'yes' && pii2 === 'no' && pii3 === 'no' && (
            <div style={{marginBottom:16}}>
              <p style={{fontSize:16,color:'#0b1220',marginBottom:8,fontWeight:600}}>4. Do you hold or are you covered by an insurance policy issued by a foreign jurisdiction? <span style={{color:'#F26522'}}>*</span></p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
                  <input type="radio" name="pii4" value="yes" style={{marginTop:3,flexShrink:0}} onChange={() => { setPii4('yes'); setPii4Error(''); onChange?.({ target: { name: 'pii4', value: 'yes', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
                  <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes (attach evidence of insurance cover and complete the undertaking below)</span>
                </label>
                <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontWeight:400}}>
                  <input type="radio" name="pii4" value="no" style={{marginTop:3,flexShrink:0}} onChange={() => { setPii4('no'); setPii4Error(''); onChange?.({ target: { name: 'pii4', value: 'no', type: 'radio' } } as React.ChangeEvent<HTMLInputElement>); }} />
                  <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No (please complete the undertaking below)</span>
                </label>
              </div>
              {pii4Error && <span className="error-message">{pii4Error}</span>}
              {pii4 === 'yes' && <PiiFileUpload id="pii_attach_q4" required />}
            </div>
          )}

          {/* Undertaking */}
          {(pii1 === 'no' || (pii1 === 'yes' && pii2 === 'no' && pii3 === 'no' && (pii4 === 'yes' || pii4 === 'no'))) && (
            <div style={{marginTop:16,padding:'14px 16px',border:'1px solid #9EA5AB',borderRadius:4,background:'#f7f9ff'}}>
              <p style={{fontSize:16,color:'#0b1220',fontWeight:600,marginBottom:8}}>UNDERTAKING:</p>
              <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
                <input type="checkbox" checked={undertaking} onChange={e => { setUndertaking(e.target.checked); if (e.target.checked) setUndertakingError(''); onChange?.({ target: { name: 'piiUndertaking', value: e.target.checked ? 'yes' : '', type: 'checkbox' } } as React.ChangeEvent<HTMLInputElement>); }} style={{marginTop:3,flexShrink:0,width:16,height:16}} />
                <span style={{fontSize:15,color:'#0b1220',lineHeight:'24px'}}>
                  I am the applicant named in this form and undertake, as an Australian-registered foreign lawyer who does not hold or is not covered by an approved insurance policy for this jurisdiction, to provide a disclosure statement in writing to each client before, or as soon as practicable after, being retained for legal services in this jurisdiction stating—
                  <br />(a) whether or not the lawyer is covered by other professional indemnity insurance; and
                  <br />(b) if covered, the nature and extent of that insurance. <span style={{color:'#F26522'}}>*</span>
                </span>
              </label>
              {undertakingError && <span className="error-message" style={{marginTop:6,display:'block'}}>{undertakingError}</span>}
            </div>
          )}
        </div>
      )}
    </>
  );
});

export default AddressDetailsSection;
