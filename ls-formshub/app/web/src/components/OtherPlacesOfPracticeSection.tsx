import React, { useState } from 'react';
import FormField from './FormField';
import CountrySelect from './CountrySelect';
import FileUploadField from './FileUploadField';

type OtherPlacesErrors = {
  multipleEntities?: string;
  otherLawPracticeEmployer?: string;
  otherStreetNumberName?: string;
  otherSuburb?: string;
  otherState?: string;
  otherCountry?: string;
  otherPostcode?: string;
};

type Props = {
  sectionTitle?: string;
  errors?: OtherPlacesErrors;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  onClearFields?: () => void; // Callback to clear fields in parent form
};

export default function OtherPlacesOfPracticeSection({ errors, onChange, onBlur, sectionTitle, onClearFields }: Props) {
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [otherFiles, setOtherFiles] = useState<File[] | null>(null);

  const handleMultipleEntitiesChange = (value: string) => {
    setShowAdditionalDetails(value === 'yes');
    // Clear dynamic fields when toggling
    if (onClearFields) {
      onClearFields();
    }
  };

  const handleBlur = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(fieldName, e.target.value);
    }
  };

  return (
    <>
      <h2 className="section-title">{sectionTitle ?? '6. Details of form of principal place of practice in Australia'}</h2>

      <div style={{marginTop:12}}>
        <p style={{fontSize:16,color:'#0b1220',marginBottom:12,fontWeight:600}}>
          Do you intend to practise with more than one entity? <span style={{color:'#F26522'}}>*</span>
        </p>
        <div style={{display:'flex',gap:20,marginBottom:16}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input 
              type="radio" 
              name="multipleEntities" 
              value="yes" 
               
              onChange={(e) => {handleMultipleEntitiesChange(e.target.value); onChange && onChange(e);}}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Yes</span>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:400}}>
            <input 
              type="radio" 
              name="multipleEntities" 
              value="no" 
               
              onChange={(e) => {handleMultipleEntitiesChange(e.target.value); onChange && onChange(e);}}
            />
            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>No</span>
          </label>
        </div>
        {errors?.multipleEntities && (
          <span className="error-message">
            {errors.multipleEntities}
          </span>
        )}

        {showAdditionalDetails && (
          <>
            <FormField 
              name="otherLawPracticeEmployer" 
              label="Name of law practice/employer: *" 
              placeholder="" 
              error={errors?.otherLawPracticeEmployer}
              onChange={onChange}
              onBlur={handleBlur('otherLawPracticeEmployer')}
              required
              style={{ width: '95%' }}
            />

            <div style={{marginTop:8}}>
              <FormField 
                name="otherStreetNumberName" 
                label="Street number and name: *" 
                placeholder="" 
                error={errors?.otherStreetNumberName}
                onChange={onChange}
                onBlur={handleBlur('otherStreetNumberName')}
                required
                style={{ width: '95%' }}
              />
            </div>

            <div className="grid" style={{marginTop:8}}>
              <FormField 
                name="otherSuburb" 
                label="Suburb: *" 
                placeholder="" 
                error={errors?.otherSuburb}
                onChange={onChange}
                onBlur={handleBlur('otherSuburb')}
                required
              />
              <FormField
                name="otherState"
                label="State: *"
                placeholder=""
                error={errors?.otherState}
                onChange={onChange as any}
                onBlur={handleBlur('otherState')}
                required
              />
            </div>

            <div className="grid" style={{marginTop:8}}>
              <CountrySelect 
                name="otherCountry" 
                label="Country *" 
                error={errors?.otherCountry}
                onChange={onChange as any}
                required
              />
              <FormField 
                name="otherPostcode" 
                label="Postcode: *" 
                placeholder="" 
                error={errors?.otherPostcode}
                onChange={onChange}
                onBlur={handleBlur('otherPostcode')}
                required
              />
            </div>

            <div className="grid" style={{marginTop:8}}>
              <FormField 
                name="otherTelephone" 
                label="Telephone:" 
                placeholder="" 
              />
              <FormField 
                name="otherFax" 
                label="Fax:" 
                placeholder="" 
              />
            </div>

            <div className="grid" style={{marginTop:8}}>
              <FormField 
                name="otherMobile" 
                label="Mobile:" 
                placeholder="" 
              />
              <FormField 
                name="otherEmailAddress" 
                label="Email address:" 
                placeholder="" 
              />
            </div>

            <div style={{marginTop:8}}>
              <FormField 
                name="otherPublicationEmail" 
                label="Publication email address (if different):" 
                placeholder="" 
                style={{ width: '95%' }}
              />
            </div>

            <div style={{marginTop:16}}>
              <p style={{fontSize:16,color:'#0b1220',marginBottom:10,fontWeight:600}}>
                Position held (select one only):
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:15}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="radio" name="otherPositionHeld" value="sole"  />
                  <span style={{fontSize:16,color:'#0b1220'}}>Sole practitioner</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="radio" name="otherPositionHeld" value="partner"  />
                  <span style={{fontSize:16,color:'#0b1220'}}>Partner</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="radio" name="otherPositionHeld" value="llpPrincipal"  />
                  <span style={{fontSize:16,color:'#0b1220'}}>LLP Principal</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="radio" name="otherPositionHeld" value="supervising"  />
                  <span style={{fontSize:16,color:'#0b1220'}}>Supervising legal practitioner at a community legal service</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="radio" name="otherPositionHeld" value="employee"  />
                  <span style={{fontSize:16,color:'#0b1220'}}>Employee of a law practice</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="radio" name="otherPositionHeld" value="corporate"  />
                  <span style={{fontSize:16,color:'#0b1220'}}>Corporate legal practitioner</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="radio" name="otherPositionHeld" value="government"  />
                  <span style={{fontSize:16,color:'#0b1220'}}>Government legal practitioner</span>
                </label>
              </div>
            </div>

            <div style={{marginTop:16}}>
              <p style={{fontSize:16,color:'#0b1220',marginBottom:6}}>
                Attach additional page if necessary.
              </p>
              <FileUploadField files={otherFiles} onFilesChange={setOtherFiles} />
              </div>
          </>
        )}
      </div>
    </>
  );
}
