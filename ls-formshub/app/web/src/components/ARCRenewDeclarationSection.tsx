import React from 'react';

const checkboxStyle: React.CSSProperties = { width: 18, height: 18, marginTop: 3, cursor: 'pointer', flexShrink: 0 };
const rowStyle: React.CSSProperties = { display: 'flex', gap: 12, marginBottom: 4, alignItems: 'flex-start' };
const labelStyle: React.CSSProperties = { fontSize: 16, color: '#0b1220', lineHeight: '24px', cursor: 'pointer', fontWeight: 700 };

const declarations = [
  'I intend to engage in legal practice in New South Wales within a reasonable period after registration.',
  <>I am not aware of any matter referred to section 62(3) of the <em>Legal Profession Uniform Law (NSW)</em> and rules 20 and 21 of the <em>Legal Profession Uniform General Rules 2015</em> or any Show Cause event within the meaning of sections 87 and 88 of the <em>Legal Profession Uniform Law (NSW)</em> which would affect my fitness to hold a registration certificate, other than that which is disclosed above and in respect of which I have provided a statement, or which I have previously disclosed.</>,
  'My registration or authorisation is not cancelled or currently suspended in any place as a result of disciplinary action.',
  'I am not otherwise personally prohibited from engaging in legal practice in any place or bound by any undertaking not to engage in legal practice in any place as a result of criminal, civil or disciplinary proceedings in any place.',
  'I have read the Personal Information Collection Notice before providing my personal information and agree to the terms.',
];

type Props = {
  sectionTitle?: string;
  checked?: boolean[];
  errors?: string[];
  onChange?: (index: number, value: boolean) => void;
};

export default function ARCRenewDeclarationSection({ sectionTitle, checked = [], errors = [], onChange }: Props) {
  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '11. Declaration'}</h2>

      <div id="declaration-section" style={{ marginTop: 12 }}>
        <p style={{ fontSize: 16, color: '#0b1220', lineHeight: '24px', marginBottom: 20 }}>
          I declare that the contents of this application are true and correct and that I am authorised
          and/or registered to engage in legal practice by the foreign registration authority/authorities
          as shown on this form and that:
        </p>
        {declarations.map((text, i) => {
          const inputId = `pc-renew-declaration-${i}`;

          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={rowStyle}>
                <input
                  id={inputId}
                  type="checkbox"
                  style={{...checkboxStyle, outline: errors[i] ? '2px solid #C0392B' : undefined}}
                  checked={checked[i] || false}
                  onChange={e => onChange && onChange(i, e.target.checked)}
                />
                <label htmlFor={inputId} style={labelStyle}>{text} <span style={{color:'#F26522'}}>*</span></label>
              </div>
              {errors[i] && <span className="error-message option-group">{errors[i]}</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}
