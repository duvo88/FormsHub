import React, { useState } from 'react';
import './App.css';
import './components/components.css';
import Header from './components/Header';
import Footer from './components/Footer';
import PCNewForm from './PCNewForm';
import ARCNewForm from './ARCNewForm';

type CertificateType = 'pc-new' | 'arc-new' | '';

function PCMergedForm() {
  const [selected, setSelected] = useState<CertificateType>('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!selected) {
      setError('Please select an option to continue.');
      return;
    }
    setError('');
    setConfirmed(true);
  };

  if (confirmed && selected === 'pc-new') {
    return <PCNewForm />;
  }

  if (confirmed && selected === 'arc-new') {
    return <ARCNewForm />;
  }

  return (
    <div className="App page-root">
      <main className="form-container">
        <section className="form-card" style={{ padding: '48px 32px 80px 32px' }}>
          <Header
            title="Type of certificate"
            subtitle=""
          />

          <p style={{ fontSize: '20px', color: '#F26522', fontWeight: 600, marginTop:80,marginBottom: '16px' }}>Are you applying for an</p>

          <div className="form-section">

            <div className="radio-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className={`radio-option${selected === 'pc-new' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="certificateType"
                  value="pc-new"
                  checked={selected === 'pc-new'}
                  onChange={() => { setSelected('pc-new'); setError(''); }}
                />
                <span style={{ fontWeight: 'normal' }}>Australian Practising Certificate</span>
              </label>

              {selected === 'pc-new' && (
                <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '16px 20px', borderRadius: 4, marginLeft: 28 }}>
                  <p style={{ fontSize: 15, lineHeight: '24px', color: '#0b1220', margin: 0 }}>
                    Complete this application if you are an Australian lawyer (as defined by <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.6" target="_blank" rel="noreferrer">section 6</a> of the <em>Legal Profession Uniform Law (NSW)</em>), and you do not hold a current practising certificate in this jurisdiction.
                  </p>
                </div>
              )}

              <label className={`radio-option${selected === 'arc-new' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="certificateType"
                  value="arc-new"
                  checked={selected === 'arc-new'}
                  onChange={() => { setSelected('arc-new'); setError(''); }}
                />
                <span style={{ fontWeight: 'normal' }}>Australian Registration Certificate</span>
              </label>

              {selected === 'arc-new' && (
                <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '16px 20px', borderRadius: 4, marginLeft: 28 }}>
                  <p style={{ fontSize: 15, lineHeight: '24px', color: '#0b1220', margin: 0 }}>
                    Complete this application if you are a foreign lawyer who wishes to practise foreign law as an Australian-registered foreign lawyer in this jurisdiction.
                  </p>
                </div>
              )}
            </div>

            {error && <p className="field-error">{error}</p>}
          </div>

          <div style={{ height: 3, backgroundColor: '#F26522', margin: '24px 0 0 0' }}></div>
          <Footer variant="registry" onSubmit={handleNext} submitLabel="NEXT" />
        </section>
      </main>
    </div>
  );
}

export default PCMergedForm;
