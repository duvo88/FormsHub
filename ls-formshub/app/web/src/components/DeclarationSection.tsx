
function getMembershipYear(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1=Jan ... 12=Dec
  const y = now.getFullYear();
  return month <= 6 ? `${y - 1}/${String(y).slice(2)}` : `${y}/${String(y + 1).slice(2)}`;
}

export default function DeclarationSection({ sectionTitle }: { sectionTitle?: string }) {
  const membershipYear = getMembershipYear();
  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '12. Declaration'}</h2>

      <div style={{marginTop:12}}>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'flex-start'}}>
            <input type="checkbox" style={{width:18,height:18,marginTop:3,cursor:'pointer',flexShrink:0}} />
            <label style={{fontSize:16,color:'#0b1220',lineHeight:'24px',cursor:'pointer'}}>
              I declare that the contents of this application are true and correct; <span style={{color:'#F26522'}}>*</span>
            </label>
          </div>

          <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'flex-start'}}>
            <input type="checkbox" style={{width:18,height:18,marginTop:3,cursor:'pointer',flexShrink:0}} />
            <label style={{fontSize:16,color:'#0b1220',lineHeight:'24px',cursor:'pointer'}}>
              I wish to apply for an Australian practising certificate and have my name entered in the register of local practising certificates in New South Wales; <span style={{color:'#F26522'}}>*</span>
            </label>
          </div>

          <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'flex-start'}}>
            <input type="checkbox" style={{width:18,height:18,marginTop:3,cursor:'pointer',flexShrink:0}} />
            <label style={{fontSize:16,color:'#0b1220',lineHeight:'24px',cursor:'pointer'}}>
              I declare that I am not aware of any matter (including a finding, conduct or event) referred to in rule 13(1) of the <em>Legal Profession Uniform General Rules 2015</em> or any Automatic Show Cause event within the meaning of section 87 of the <em>Legal Profession Uniform Law (NSW)</em> which would affect my fitness to hold a practising certificate, other than that which is disclosed above and in respect of which I have provided a statement under rule 12, or which I have previously disclosed; <span style={{color:'#F26522'}}>*</span>
            </label>
          </div>

          <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'flex-start'}}>
            <input type="checkbox" style={{width:18,height:18,marginTop:3,cursor:'pointer',flexShrink:0}} />
            <label style={{fontSize:16,color:'#0b1220',lineHeight:'24px',cursor:'pointer'}}>
              I acknowledge that payment of the Membership Fee indicates that I also wish to be a Solicitor Member of the Law Society of New South Wales for the {membershipYear} year; <span style={{color:'#F26522'}}>*</span>
            </label>
          </div>

          <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'flex-start'}}>
            <input type="checkbox" style={{width:18,height:18,marginTop:3,cursor:'pointer',flexShrink:0}} />
            <label style={{fontSize:16,color:'#0b1220',lineHeight:'24px',cursor:'pointer'}}>
              I have read the Personal Information Collection Notice before providing my personal information and agree to the below terms: <span style={{color:'#F26522'}}>*</span>
            </label>
          </div>

          <div style={{padding:16,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:4,marginTop:12,marginBottom:24}}>
            <p style={{fontSize:16,color:'#0b1220',lineHeight:'24px',margin:0}}>
              The Law Society of New South Wales respects your privacy and the confidentiality and security of personal information provided by you to us. The information provided by you to the Law Society on this form will be used by the Law Society for the purposes of communicating with you in relation to our regulatory functions with our Personal Information Collection Notice.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
