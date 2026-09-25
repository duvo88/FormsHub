import { useState } from 'react';

export default function ForeignLanguagesSection({ sectionTitle }: { sectionTitle?: string }) {
  const [showLanguageDetails, setShowLanguageDetails] = useState(false);

  const handleLanguageChange = (value: string) => {
    setShowLanguageDetails(value === 'yes');
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '7. Foreign Languages'}</h2>
      
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:12,fontWeight:600}}>
          Do you speak a foreign language fluently?
        </p>
        <p style={{fontSize:16,color:'#0b1220',fontStyle:'italic',marginBottom:12}}>
          (This question is optional)
        </p>
      </div>

      <div style={{display:'flex',gap:20,marginBottom:16}}>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
          <input 
            type="radio" 
            name="speakForeignLanguage" 
            value="yes" 
             
            onChange={(e) => handleLanguageChange(e.target.value)}
          />
          <span style={{fontSize:16,color:'#0b1220'}}>Yes</span>
        </label>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
          <input 
            type="radio" 
            name="speakForeignLanguage" 
            value="no" 
             
            onChange={(e) => handleLanguageChange(e.target.value)}
          />
          <span style={{fontSize:16,color:'#0b1220'}}>No</span>
        </label>
      </div>

      {showLanguageDetails && (
        <>
          <label style={{fontSize:16,color:'#0b1220',display:'block',marginBottom:6}}>
            Please provide details below:
          </label>
          <textarea 
            name="foreignLanguages"
            placeholder=""
            style={{
              width:'calc(100% - 20px)',
              minHeight:100,
              padding:'8px 10px',
              border:'1px solid #cbd5e1',
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
        </>
      )}
    </>
  );
}
