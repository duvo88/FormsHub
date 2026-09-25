import FileUploadField from './FileUploadField';

type Props = {
  sectionTitle?: string;
  checklist?: {
    currentEvidenceOfRegistration: boolean;
    currentCertificateOfFitness: boolean;
  };
  checklistErrors?: {
    currentEvidenceOfRegistration?: string;
    currentCertificateOfFitness?: string;
  };
  onChecklistChange?: (fieldName: 'supportingCurrentEvidenceOfRegistration' | 'supportingCurrentCertificateOfFitness', checked: boolean) => void;
  onFileSelect?: (fieldName: string, files: File[] | null) => void;
  existingFiles?: File[];
  error?: string;
};

export default function ARCRenewSupportingDocumentsSection({ sectionTitle, checklist, checklistErrors, onChecklistChange, onFileSelect, existingFiles, error }: Props) {
  const items = [
    'Current evidence of your registration(s) outside Australia;',
    'A current certificate of fitness or good standing from all relevant foreign authorities.'
  ];
  const checked = [
    checklist?.currentEvidenceOfRegistration ?? false,
    checklist?.currentCertificateOfFitness ?? false,
  ];

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? 'I. SUPPORTING DOCUMENTS'}</h2>

      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:600}}>In order to renew your registration please ensure that the following has been provided: <span style={{color:'#F26522'}}>*</span></p> 
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {items.map((item, i) => (
            <div key={i}>
              <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={(e) => {
                    if (!onChecklistChange) return;
                    onChecklistChange(
                      i === 0 ? 'supportingCurrentEvidenceOfRegistration' : 'supportingCurrentCertificateOfFitness',
                      e.target.checked
                    );
                  }}
                  style={{width:16,height:16,marginTop:3,flexShrink:0,cursor:'pointer'}} />
                <span style={{fontSize:16,color:'#0b1220',lineHeight:'24px',fontWeight:400}}>{item}</span>
              </label>
              {i === 0 && checklistErrors?.currentEvidenceOfRegistration && (
                <span className="error-message">{checklistErrors.currentEvidenceOfRegistration}</span>
              )}
              {i === 1 && checklistErrors?.currentCertificateOfFitness && (
                <span className="error-message">{checklistErrors.currentCertificateOfFitness}</span>
              )}
            </div>
          ))}
        </div>

        <div style={{marginTop:16}}>
          <label style={{fontSize:16,color:'#0b1220',display:'block',marginBottom:6,fontWeight:400}}>
            Attach supported documents <span style={{color:'#F26522'}}>*</span>
          </label>
          <FileUploadField
            files={existingFiles || null}
            onFilesChange={(f) => { if (onFileSelect) onFileSelect('supportingDocsAttachment', f); }}
            error={error}
          />
        </div>
      </div>
    </>
  );
}
