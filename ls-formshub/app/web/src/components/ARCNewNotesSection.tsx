import React, { useState } from 'react';

const h3Style: React.CSSProperties = { fontSize: 20, color: '#F26522', fontWeight: 700, marginTop: 20, marginBottom: 6 };
const noteStyle: React.CSSProperties = { fontSize: 16, color: '#0b1220', fontWeight: 700, marginTop: 20, marginBottom: 6 };
const pStyle: React.CSSProperties = { fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 6 };
const bulletStyle: React.CSSProperties = { fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 4, paddingLeft: 16, position: 'relative' };

function Bullet({ children }: { children: React.ReactNode }) {
  return <p style={bulletStyle}>&#8226; {children}</p>;
}

export default function ARCNewNotesSection() {
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

          <h3 style={h3Style}>Application and practice notes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', alignItems: 'start' }}>
            <div>
              <Bullet>An application that fails to provide mandatory information (including payment), or provides incomplete or misleading information, will be treated as an incomplete application.</Bullet>
              <Bullet>If the applicant does not wish to proceed, the applicant may request to withdraw the application and may be refunded the application fees.</Bullet>
              <Bullet>An incomplete application will be treated as 'not received' for the purposes of the legal profession legislation, and will be returned to the applicant. It will then be up to the applicant to decide whether or not to proceed with the application.</Bullet>
            </div>
            <div>
              <Bullet>It is at the discretion of the Law Society Council whether to grant a registration certificate. Mere lodgement of an application form with the relevant fees does not entitle the applicant to commence practice.</Bullet>
              <Bullet>If the applicant wishes to proceed, the applicant will need to resubmit their application by completing the missing/incomplete information in their original application and redeclaring the same application. Until the requisite information is provided, the Law Society Council will not consider granting a registration certificate.</Bullet>
              <Bullet>A registration certificate will not be granted unless professional indemnity insurance requirements are met.</Bullet>
            </div>
          </div>

          <div className="section-divider" />
          <h3 style={h3Style}>Explanatory Notes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', alignItems: 'start' }}>
            <div>
              <h3 style={noteStyle}>Qualifications</h3>
              <p style={pStyle}>The following supporting documents MUST be attached to your application:</p>
              <Bullet>A copy of an original instrument, or certified copy of an original instrument, from each foreign registration authority specified in this application which verifies your educational and professional qualifications.</Bullet>

              <h3 style={noteStyle}>Foreign registration/s</h3>
              <p style={pStyle}>The following supporting documents MUST be attached to your application:</p>
              <Bullet>A copy of an original instrument, from each foreign registration authority specified in this application which verifies your current registration/s by the authority to practise law in the relevant foreign country and the dates of registration.</Bullet>
              <Bullet>A copy of a current original instrument, from each foreign registration authority specified in this application which describes anything done by you in engaging in legal practice in that foreign country of which the authority is aware and that, in the opinion of the authority, had or is likely to have an adverse effect on your professional standing within the legal profession. Such documentation is considered current for 28 days from the date of issuance.</Bullet>

              <h3 style={noteStyle}>Practice details &#8211; principal place of practice</h3>
              <p style={{ ...pStyle, fontWeight: 600 }}>Principal place of practice</p>
              <p style={pStyle}>For the purposes of reporting you will be assigned to this entity on the Law Society's records.</p>
              <p style={{ ...pStyle, fontWeight: 600 }}>Change in practice details</p>
              <p style={pStyle}>Section 150 of the <em>Legal Profession Uniform Law Application Act 2014</em> provides:</p>
              <p style={pStyle}><em>Register of local registration certificates</em></p>
              <p style={pStyle}>(1) The appropriate Council must keep a register of the names of persons to whom it grants local registration certificates.</p>
              <p style={pStyle}>(2) The register may include the details that may be included in the register under section 435 of the <em>Legal Profession Uniform Law (NSW)</em> and must not include the details that must not be included in the register under that section. Subsection (3) prevails over this subsection in the event of an inconsistency.</p>
              <p style={pStyle}>(3) The local regulations may make provision for or with respect to the information that may or must be included in the register.</p>
              <p style={pStyle}>(4) The register must state the conditions (if any) imposed on a foreign lawyer's registration.</p>
              <p style={pStyle}>(5) The register may be kept in a form determined by the appropriate Council.</p>
              <p style={pStyle}>(6) The register must be available for inspection, without charge, at the appropriate Council's office during normal business hours.</p>

              <h3 style={noteStyle}>Address details</h3>
              <p style={pStyle}>Section 442(1)(b) of the <em>Legal Profession Uniform Law (NSW)</em> requires the Law Society's register of Australian-registered foreign lawyers to include an address for service for each Australian-registered foreign lawyer. The address for service must be a physical street address.</p>
              <p style={pStyle}>Section 150(6) of the <em>Legal Profession Uniform Law Application Act 2014</em> requires the Law Society Council to make the register available for inspection. The address for service will appear on this version of the register, unless special circumstances warrant it not being available.</p>

              <h3 style={noteStyle}>Form of practice</h3>
              <p style={pStyle}>For the purposes of specifying your form of practice, please note the following definitions in Section 6 of the <em>Legal Profession Uniform Law (NSW)</em>:</p>
              
            </div>
            <div>
                <p style={pStyle}><strong>Law Firm</strong> means a partnership consisting only of</p>
              <p style={pStyle}>(a) Australian legal practitioners; or</p>
              <p style={pStyle}>(b) one or more Australian legal practitioners and one or more Australian-registered foreign lawyers.</p>
              <p style={pStyle}><strong>Law Practice</strong> means</p>
              <p style={pStyle}>(a) a sole practitioner; or (b) a law firm; or (c) a community legal service; or (d) an incorporated legal practice; or (e) an unincorporated legal practice.</p>
              <h3 style={noteStyle}>Fit and proper person</h3>
              <p style={pStyle}>Applicants should refer to section 62(3) of the <em>Legal Profession Uniform Law (NSW)</em> and rules 20 and 21 of the <em>Legal Profession Uniform Law General Rules 2015</em> in considering whether or not they are a fit and proper person to hold an Australian registration certificate. These Rules are available on the Law Society's website at www.lawsociety.com.au.</p>

              <h3 style={noteStyle}>Show cause events</h3>
              <p style={pStyle}>Section 87 of the <em>Legal Profession Uniform Law (NSW)</em> requires that an applicant must provide to the Law Society Council a statement about any automatic show cause event and explain why, despite the show cause event, the applicant considers himself or herself to be a fit and proper person to hold a registration certificate.</p>
              <p style={pStyle}>An automatic show cause event is a bankruptcy-related event, a conviction for a serious offence or a tax offence. Please refer to sections 86 and 87, and the definitions in section 6, of the <em>Legal Profession Uniform Law (NSW)</em> to determine if you are required to provide a statement.</p>
              <p style={pStyle}>A pro-forma statement that may be completed is available under "forms" on the Law Society's website at www.lawsociety.com.au.</p>
              <p style={pStyle}>Please contact the Professional Standards Department on (02) 9926 0110 for assistance.</p>

              <h3 style={noteStyle}>Current or previously held Australian registration certificate</h3>
              <p style={pStyle}>Please note that if you currently hold an Australian registration certificate or Australian practising certificate you will need to surrender that certificate before this certificate can be granted.</p>
              <p style={pStyle}>The Law Society Council may require you to furnish such further information as it considers relevant to its determination of the application within such time as it specifies.</p>

              <h3 style={noteStyle}>Professional indemnity insurance</h3>
              <p style={pStyle}>The single provider of an approved insurance policy for solicitors in NSW is Lawcover.</p>
              <p style={pStyle}>Section 214 of the <em>Legal Profession Uniform Law (NSW)</em> requires an Australian-registered foreign lawyer who does not hold or is not covered by an approved insurance policy for this jurisdiction to provide a disclosure statement in writing to each client before, or as soon as practicable after, being retained for legal services in this jurisdiction stating:</p>
              <p style={pStyle}>(a) Whether or not the lawyer is covered by other professional indemnity insurance; and</p>
              <p style={pStyle}>(b) If covered, the nature and extent of that insurance.</p>

              <h3 style={noteStyle}>Declaration</h3>
              <p style={pStyle}>The Law Society may make enquiries that it thinks fit of any foreign registration authority for the purposes of determining whether it is satisfied as to any disciplinary matters which may have been disclosed and may also consider any other matters that it thinks relevant.</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

