import React from 'react';

const checkboxStyle: React.CSSProperties = { width: 18, height: 18, marginTop: 3, cursor: 'pointer', flexShrink: 0 };
const rowStyle: React.CSSProperties = { display: 'flex', gap: 12, marginBottom: 4, alignItems: 'flex-start' };
const labelStyle: React.CSSProperties = { fontSize: 16, color: '#0b1220', lineHeight: '24px', cursor: 'pointer', fontWeight: 700 };

const declarations = [
  'I am not an Australian legal practitioner.',
  'I intend to engage in legal practice in New South Wales within a reasonable time after registration.',
  'I am not the subject of disciplinary proceedings in Australia or a foreign country (including any preliminary investigations or action that might lead to disciplinary proceedings) in my capacity as an overseas-registered foreign lawyer or an Australian-registered foreign lawyer.',
  'I have not been convicted of an offence in Australia or a foreign country other than as disclosed in this application.',
  'My registration or authorisation is not cancelled or currently suspended in any place as a result of disciplinary action.',
];

type Props = {
  sectionTitle?: string;
  checked?: boolean[];
  errors?: string[];
  onChange?: (index: number, value: boolean) => void;
};

export default function ARCNewDeclarationSection({ sectionTitle, checked = [], errors = [], onChange }: Props) {
  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '12. Declaration'}</h2>

      <div id="declaration-section" style={{ marginTop: 12 }}>
        {declarations.map((text, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={rowStyle}>
              <input
                id={`declaration-${i}`}
                type="checkbox"
                style={{...checkboxStyle, outline: errors[i] ? '2px solid #C0392B' : undefined}}
                checked={checked[i] || false}
                onChange={e => onChange && onChange(i, e.target.checked)}
              />
              <label htmlFor={`declaration-${i}`} style={labelStyle}>{text} <span style={{color:'#F26522'}}>*</span></label>
            </div>
            {errors[i] && <span className="error-message" style={{marginLeft:30}}>{errors[i]}</span>}
          </div>
        ))}
      </div>
    </>
  );
}
