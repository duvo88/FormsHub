import React, { useRef, useState, useEffect } from 'react';
import DateField from './DateField';

type Props = {
  formData: {
    signature: string;
    signatureDate: string;
  };
  errors?: {
    signature?: string;
    signatureDate?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
};

export default function SignatureSection({ formData, errors, onChange, onBlur }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0b1220';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || signatureMode !== 'draw') return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureMode !== 'draw') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Save canvas as base64 data URL when user stops drawing
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      // Trigger onChange to update formData.signature
      const syntheticEvent = {
        target: {
          name: 'signature',
          value: dataUrl,
          type: 'text',
          checked: false
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Clear the signature in formData
        const syntheticEvent = {
          target: {
            name: 'signature',
            value: '',
            type: 'text',
            checked: false
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }
  };

  return (
    <>
      <h2 className="section-title">3. Signature <span style={{color:'#C0392B'}}>*</span></h2>
      
      <p style={{fontSize:16,color:'#0b1220',marginTop:12,marginBottom:16}}>
        I declare that the contents of this application are true and correct and that I am the person as stated above.
      </p>

      <div className="grid" style={{alignItems:'flex-start'}}>
        <div>
          <label style={{
            fontSize:16,
            color:'#0b1220',
            fontWeight:400,
            marginBottom:8,
            display:'block'
          }}>
            Signature: <span style={{color:'#C0392B'}}>*</span>
          </label>
          {signatureMode === 'draw' ? (
            <>
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{
                  width:'100%',
                  height:120,
                  border:'1px solid #cbd5e1',
                  borderRadius:3,
                  background:'#eaf0ff',
                  cursor:'crosshair',
                  display:'block'
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 14 }}>
                <span style={{ color: '#0b1220', fontWeight: 600 }}>Draw signature</span>
                <span style={{ color: '#9EA5AB' }}>|</span>
                <button
                  type="button"
                  onClick={() => { setSignatureMode('type'); clearSignature(); }}
                  style={{ background: 'none', border: 'none', color: '#F26522', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                >
                  Type signature
                </button>
                <button
                  type="button"
                  onClick={clearSignature}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#0b1220', cursor: 'pointer', padding: 0, fontSize: 14, textDecoration: 'underline' }}
                >
                  Clear
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: '100%',
                height: 120,
                border: '1px solid #cbd5e1',
                borderRadius: 3,
                background: '#eaf0ff',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 20,
                position: 'relative'
              }}>
                <span style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 28,
                  color: '#0b1220',
                  fontStyle: 'normal'
                }}>
                  {formData.signature}
                </span>
                <div style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 40,
                  right: 40,
                  height: 1,
                  background: '#0b1220'
                }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 14, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setSignatureMode('draw'); onChange({ target: { name: 'signature', value: '', type: 'text', checked: false } } as any); }}
                  style={{ background: 'none', border: 'none', color: '#F26522', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                >
                  Draw signature
                </button>
                <span style={{ color: '#9EA5AB' }}>|</span>
                <span style={{ color: '#0b1220', fontWeight: 600 }}>Type signature</span>
                <button
                  type="button"
                  onClick={() => onChange({ target: { name: 'signature', value: '', type: 'text', checked: false } } as any)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#0b1220', cursor: 'pointer', padding: 0, fontSize: 14, textDecoration: 'underline' }}
                >
                  Clear
                </button>
              </div>
              <input
                type="text"
                id="signature"
                name="signature"
                value={formData.signature}
                onChange={onChange}
                className="form-input"
                placeholder="Type your name to sign.."
                style={{ marginTop: 8 }}
              />
            </>
          )}
          {errors?.signature && (
            <span className="error-message">
              {errors.signature}
            </span>
          )}
        </div>
        
        <DateField
          label="Dated"
          name="signatureDate"
          value={formData.signatureDate || ''}
          onChange={onChange}
          onBlur={onBlur}
          error={errors?.signatureDate}
          required
        />
      </div>
    </>
  );
}
