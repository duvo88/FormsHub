
export default function LodgementSection() {
  return (
    <>
      <h2 className="section-title">14. Lodgement</h2>

      <div style={{marginTop:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:40}}>
          <div>
            <h3 style={{fontSize:18,fontFamily:'Arial',fontWeight:600,color:'#0b1220',marginBottom:12}}>
              Email for submission:
            </h3>
            <p style={{fontSize:16,color:'#0b1220',lineHeight:'24px',margin:0}}>
              <a href="mailto:registry@lawsociety.com.au">
                registry@lawsociety.com.au
              </a>
            </p>
          </div>

          <div>
            <h3 style={{fontSize:18,fontFamily:'Arial',fontWeight:600,color:'#0b1220',marginBottom:12}}>
              Registry contact details:
            </h3>
            <p style={{fontSize:16,color:'#0b1220',lineHeight:'24px',marginBottom:8}}>
              <strong>Phone:</strong> (02) 9926 0156
            </p>
            <p style={{fontSize:16,color:'#0b1220',lineHeight:'24px',marginBottom:8}}>
              <strong>Email:</strong>{' '}
              <a href="mailto:registry@lawsociety.com.au">
                registry@lawsociety.com.au
              </a>
            </p>
            <p style={{fontSize:16,color:'#0b1220',lineHeight:'24px',margin:0}}>
              <strong>Address:</strong> 170 Phillip Street, Sydney NSW 2000
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
