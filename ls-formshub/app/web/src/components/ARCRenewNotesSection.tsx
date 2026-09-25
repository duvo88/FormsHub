import React, { useState } from 'react';

const h3Style: React.CSSProperties = { fontSize: 20, color: '#F26522', fontWeight: 700, marginTop: 20, marginBottom: 6 };
const noteStyle: React.CSSProperties = { fontSize: 16, color: '#0b1220', fontWeight: 700, marginTop: 20, marginBottom: 6 };
const pStyle: React.CSSProperties = { fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 6 };
const bulletStyle: React.CSSProperties = { fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 4, paddingLeft: 16, position: 'relative' };

function Bullet({ children }: { children: React.ReactNode }) {
  return <p style={bulletStyle}>&#8226; {children}</p>;
}

export default function ARCRenewNotesSection() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 32 }}>
      <div className="section-divider" />
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0, marginBottom: 12 }}
      >
        <span style={{ fontSize: 20, fontWeight: 700, color: '#F26522' }}>GENERAL NOTES</span>
        <span style={{ fontSize: 18, color: '#0b1220' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ fontSize: 15, color: '#0b1220' }}>

          <h3 style={{ ...h3Style, fontWeight: 600, marginTop: 10, color: '#0b1220' }}>Application and practice notes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', alignItems: 'start' }}>
            <div>
              <Bullet>An application that fails to provide mandatory information (including payment), or provides incomplete or misleading information, will be treated as an incomplete application.</Bullet>
              <Bullet>An incomplete application will be treated as 'not received' for the purposes of the legal profession legislation, and will be returned to the applicant. It will then be up to the applicant to decide whether or not to proceed with the application.</Bullet>
              <Bullet>If the applicant wishes to proceed, the applicant will need to resubmit their application by completing the missing/incomplete information in their original application and re-declaring the same application. Until the requisite information is provided, the Law Society Council will not consider renewing a practising certificate.</Bullet>
            </div>
            <div>
              <p style={{ ...pStyle, fontWeight: 600, marginTop: 0 }}>Address for service</p>
              <p style={pStyle}>For the purposes of the Legal Profession Uniform Law (NSW), there is a requirement that the Law Society of New South Wales record an 'Address for Service' for each practitioner. If you have not previously provided an address for service, please provide one on page 1.</p>
              <p style={{ ...pStyle, fontWeight: 600, marginTop: 12 }}>Expiry of your registration certificate</p>
              <p style={pStyle}>Expiry of your previous year registration certificate will occur on 30 June {new Date().getFullYear()}. You cannot practise as a foreign lawyer in New South Wales after 30 June {new Date().getFullYear()} if you have not applied for renewal of your registration certificate in accordance with the provisions of legal profession legislation (unless you hold a valid interstate registration certificate).</p>
            </div>
          </div>

          <div className="section-divider" />
          <h3 style={{ ...h3Style, fontWeight: 600 }}>Explanatory Notes</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', alignItems: 'start' }}>
            <div>
              <h3 style={noteStyle}>Form of practice</h3>
              <p style={pStyle}>For the purposes of specifying your form of practice, please note the following definitions in Section 6 of the <em>Legal Profession Uniform Law (NSW)</em>:</p>
              <p style={pStyle}><strong>Law Firm</strong> means a partnership consisting only of</p>
              <p style={pStyle}>(a) Australian legal practitioners; or</p>
              <p style={pStyle}>(b) one or more Australian legal practitioners and one or more Australian-registered foreign lawyers.</p>
              <p style={pStyle}><strong>Law Practice</strong> means</p>
              <p style={pStyle}>(a) a sole practitioner; or (b) a law firm; or (c) a community legal service; or (d) an incorporated legal practice; or (e) an unincorporated legal practice.</p>

              <h3 style={noteStyle}>Fit and proper person</h3>
              <p style={pStyle}>Applicants should refer to section 62(3) of the <em>Legal Profession Uniform Law (NSW)</em> and rules 20 and 21 of the <em>Legal Profession Uniform General Rules 2015</em> in considering whether or not they are a fit and proper person to hold an Australian registration certificate. These Rules are available on the Law Society's website at www.lawsociety.com.au.</p>

              <h3 style={noteStyle}>Show cause events</h3>
              <p style={pStyle}>Sections 86, 87 and 88 of the <em>Legal Profession Uniform Law (NSW)</em> require that an applicant must provide to the Law Society Council a statement about any automatic show cause event and explain why, despite the show cause event, the applicant considers himself or herself to be a fit and proper person to hold a registration certificate.</p>
              <p style={pStyle}>An automatic show cause event is a bankruptcy-related event, a conviction for a serious offence or a tax offence. Please refer to sections 86, 87 and 88, and the definitions in section 6, of the <em>Legal Profession Uniform Law (NSW)</em> to determine if you are required to provide a statement.</p>
              <p style={pStyle}>A pro-forma statement that may be completed is available under "forms" on the Law Society's website at www.lawsociety.com.au.</p>
              
            </div>
            <div>
                <p style={pStyle}>Please contact the Professional Standards Department on (02) 9926 0333 for assistance.</p>
              <h3 style={noteStyle}>Professional indemnity insurance</h3>
              <p style={pStyle}>The current single provider of an approved insurance policy for solicitors in NSW is Lawcover.</p>
              <p style={pStyle}>Section 214 of the <em>Legal Profession Uniform Law (NSW)</em> requires an Australian-registered foreign lawyer who does not hold or is not covered by an approved insurance policy for this jurisdiction to provide a disclosure statement in writing to each client before, or as soon as practicable after, being retained for legal services in this jurisdiction stating:</p>
              <p style={pStyle}>(a) Whether or not the lawyer is covered by other professional indemnity insurance; and</p>
              <p style={pStyle}>(b) If covered, the nature and extent of that insurance.</p>

              <h3 style={noteStyle}>Schedule of fees and payment</h3>
              <p style={pStyle}>A Fidelity Fund contribution is only payable by an Australian-registered foreign lawyer who practises as a partner or employee of an Australian law practice. Please note that the Registration Certificate Fee and Fidelity Fund contribution do not attract GST.</p>

              <h3 style={noteStyle}>Declaration</h3>
              <p style={pStyle}>The Law Society may make enquiries that it thinks fit of any foreign registration authority for the purpose of determining whether it is satisfied as to any disciplinary matter which may have been disclosed and may also consider any other matters that it thinks relevant.</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
