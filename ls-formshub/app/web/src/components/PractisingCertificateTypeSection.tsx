
export default function PractisingCertificateTypeSection({ sectionTitle }: { sectionTitle?: string }) {
  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '8. Practising Certificate Type'}</h2>

      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:600}}>
          I am applying for a practising certificate as a (select one only):
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:15}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="radio" name="certificateType" value="principal"  />
            <span style={{fontSize:16,color:'#0b1220'}}>Principal of a law practice</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="radio" name="certificateType" value="employee"  />
            <span style={{fontSize:16,color:'#0b1220'}}>Employee of a law practice</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="radio" name="certificateType" value="corporate"  />
            <span style={{fontSize:16,color:'#0b1220'}}>Corporate legal practitioner</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="radio" name="certificateType" value="government"  />
            <span style={{fontSize:16,color:'#0b1220'}}>Government legal practitioner</span>
          </label>
        </div>
      </div>
    </>
  );
}
