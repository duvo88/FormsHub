import React from 'react';

type Props = {
  title?: string;
  subtitle?: React.ReactNode;
};

export default function Header({ title, subtitle }: Props) {
  return (
    <header className="site-header form-header">
      <div className="header-inner header-top" style={{alignItems:'flex-end'}}>
        <div className="title-block">
          {title !== '' && (
            <h1 
              className="fieldtype_heading" 
              style={{ fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'left', marginTop: '0px', marginBottom: '5px', color: '#F26522', fontSize: '25px', lineHeight: 1.1, whiteSpace: 'pre-line' }}
              tabIndex={0}
              role="heading"
            >
              {title ?? 'Request for a Certificate of Fitness and Good Standing'}
            </h1>
          )}
        </div>

        {/* Clear space between logo and app name = 4× height of 'S' in 'Society' ≈ 80px */}
        <div className="logo-block" aria-hidden style={{ width: 'auto', marginLeft: 80 }}>
          {/* Logo min-width: 231px (horizontal); max-height: 50% of header */}
          {/* Clear space around logo = height of 'S' in 'Society' ≈ 20px */}
          <img 
            className="img-right fieldtype_image"
            src="/images/LSNSW_Logo_RGB_Orange_Linear.svg" 
            alt="The Law Society of New South Wales" 
            width="400px"
            style={{ margin: '20px 20px 0 20px', minWidth: 231, maxHeight: '50%' }}
          />
        </div>
      </div>

      <div style={{maxWidth:1000,margin:'16px auto 0',padding:'0 16px 0 0'}}>
        <div style={{width:'100%'}}>
          <div style={{height:3,backgroundColor:'#F26522',marginBottom:8}}></div>
          {subtitle && (
            <>
              <p className="page-subtitle">
                {subtitle}
              </p>
              <div style={{height:3,backgroundColor:'#F26522',marginTop:8}}></div>
            </>
          )}
        </div>
      </div>

      <div className="header-inner header-rule" style={{display:'none'}}>
        <div className="rule-left" />
        <div className="rule-right" />
      </div>
    </header>
  );
}
