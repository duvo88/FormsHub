import React, { useState } from 'react';
import FormField from './FormField';
import DateField from './DateField';
import CountrySelect from './CountrySelect';

type ApplicantDetailsData = {
  surname?: string;
    firstName: string;
    partyName?: string;
    referenceNumber?: string;
    legalRep?: string;
  otherName?: string;
  preferredFirstName?: string;
  formerNames?: string;
  title?: string;
  titleOther?: string;
  postNominals?: string;
  gender?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  personalEmail?: string;
  personalMobile?: string;
  foreignLawJurisdictions?: string;
  lawID?: string;
  streetNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  dl?: string;
  telephone?: string;
  emailAddress?: string;
  deliveryConsent?: boolean;
};

type ApplicantDetailsErrors = {
    surname?: string;
    partyName?: string;
    referenceNumber?: string;    
  firstName?: string;
  title?: string;
  titleOther?: string;
  gender?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  personalEmail?: string;
  personalMobile?: string;
  foreignLawJurisdictions?: string;
  formerNames?: string;
  lawID?: string;
  emailAddress?: string;
  streetNumber?: string;
    city?: string;
    telephone?: string;
  state?: string;
  country?: string;
  postcode?: string;
  deliveryConsent?: string;
};

type FormVariant = 'flss' | 'mediation-program' | 'presidential-full-fee' | 'presidential-split-fee' | 'lawyer-mediator' | 'practising-certificate';

type Props = {
  variant: FormVariant;
  sectionTitle?: string;
  formData: ApplicantDetailsData;
  errors?: ApplicantDetailsErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (fieldName: string, value: string) => void;
  showForeignLawField?: boolean;
  readOnlyFields?: { firstName?: boolean; surname?: boolean; emailAddress?: boolean; personalEmail?: boolean; title?: boolean };
};

const roStyle = { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' as const };

export default function ApplicantDetails({ variant, formData, errors, onChange, onBlur, showForeignLawField, sectionTitle, readOnlyFields }: Props) {
  const [showTitleOther, setShowTitleOther] = useState(false);

  const handleBlur = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(fieldName, e.target.value);
    }
  };

  const handleTitleChange = (value: string) => {
    setShowTitleOther(value === 'other');
  };

  // Define which fields to show for each variant
  const showForFlss = variant === 'flss'; 
  const showForMediationProgram = variant === 'mediation-program';
  const showForPresidential = variant === 'presidential-full-fee' || variant === 'presidential-split-fee';
  const showForLawyerMediator = variant === 'lawyer-mediator';
  const showForPractisingCertificate = variant === 'practising-certificate';

  return (
    <>
          <h2 className="section-title">
              {sectionTitle ? sectionTitle : showForPractisingCertificate ? '1. Applicant Details' :
                  (showForFlss || showForMediationProgram || showForPresidential) ? 'Contact Details' :
                  showForLawyerMediator ? '' : '1. Applicant details'}</h2>
          {/* FLSS, Mediation Program, and Presidential forms fields */}
          {(showForFlss || showForMediationProgram || showForPresidential) && (
              <>
                  <div className="grid" style={{ marginTop: 12 }}>
                      <FormField
                          name="partyName"
                          label="Name of party payment is being made for *"
                          placeholder=""
                          value={formData.partyName || ''}
                          onChange={onChange}
                          onBlur={handleBlur('partyName')}
                          error={errors?.partyName}
                          required
                      />
                      <FormField
                          name="referenceNumber"
                          label="Reference Number *"
                          placeholder=""
                          value={formData.referenceNumber || ''}
                          onChange={onChange}
                          onBlur={handleBlur('referenceNumber')}
                          error={errors?.referenceNumber}
                          required
                      />
                  </div>

                  <div className="grid" style={{ marginTop: 12 }}>
                      <FormField
                          name="firstName"
                          label="First name *"
                          placeholder=""
                          value={formData.firstName}
                          onChange={onChange}
                          onBlur={handleBlur('firstName')}
                          error={errors?.firstName}
                          required
                          readOnly={readOnlyFields?.firstName}
                          style={readOnlyFields?.firstName ? roStyle : undefined}
                      />
                      <FormField
                          name="surname"
                          label="Surname *"
                          placeholder=""
                          value={formData.surname || ''}
                          onChange={onChange}
                          onBlur={handleBlur('surname')}
                          error={errors?.surname}
                          required
                          readOnly={readOnlyFields?.surname}
                          style={readOnlyFields?.surname ? roStyle : undefined}
                      />
                  </div>

                  <div className="grid" style={{ marginTop: 12 }}>
                        {/* Email Address field hidden from UI but still in formData */}
                      {(showForFlss || showForPresidential || showForMediationProgram) ? (
                          <div style={{ gridColumn: '1 / -1' }}>
                          <FormField
                              name="legalRep"
                              label="Name of Legal Representation"
                              placeholder=""
                              value={formData.legalRep || ''}
                              onChange={onChange}
                          />
                          </div>
                      ) : (
                          <FormField
                              name="telephone"
                              label="Phone number *"
                              placeholder=""
                              value={formData.telephone || ''}
                              onChange={onChange}
                              onBlur={handleBlur('telephone')}
                              error={errors?.telephone}
                              required
                          />
                      )}
                  </div>

                  {!(showForFlss || showForPresidential || showForMediationProgram) && (
                      <div style={{ marginTop: 12 }}>
                          <FormField
                              name="legalRep"
                              label="Name of Legal Representation"
                              placeholder=""
                              value={formData.legalRep || ''}
                              onChange={onChange}
                          />
                      </div>
                  )}                  
              </>
          )}

          {/* Lawyer Mediator Accreditation Scheme fields */}
          {showForLawyerMediator && (
              <>
                  <div className="grid" style={{ marginTop: 12 }}>
                        {/* Title field hidden from UI but still in formData */}
                      <FormField
                          name="firstName"
                          label="First name *"
                          placeholder=""
                          value={formData.firstName}
                          onChange={onChange}
                          onBlur={handleBlur('firstName')}
                          error={errors?.firstName}
                          required
                          readOnly={readOnlyFields?.firstName}
                          style={readOnlyFields?.firstName ? roStyle : undefined}
                      />
                  </div>

                  <div style={{ marginTop: 12 }}>
                      <FormField
                          name="surname"
                          label="Surname *"
                          placeholder=""
                          value={formData.surname || ''}
                          onChange={onChange}
                          onBlur={handleBlur('surname')}
                          error={errors?.surname}
                          required
                          readOnly={readOnlyFields?.surname}
                          style={readOnlyFields?.surname ? roStyle : undefined}
                      />
                  </div>

                  <div className="grid" style={{ marginTop: 12 }}>
                      <FormField
                          name="emailAddress"
                          label="Email *"
                          type="email"
                          placeholder=""
                          value={formData.emailAddress || ''}
                          onChange={onChange}
                          onBlur={handleBlur('emailAddress')}
                          error={errors?.emailAddress}
                          required
                      />
                      <FormField
                          name="telephone"
                          label="Phone number *"
                          placeholder=""
                          value={formData.telephone || ''}
                          onChange={onChange}
                          onBlur={handleBlur('telephone')}
                          error={errors?.telephone}
                          required
                      />
                  </div>
              </>
          )}

          {/* Existing fields for non-FLSS forms */}
          {!showForFlss && !showForMediationProgram && !showForPresidential && !showForLawyerMediator && (
              <>
      {/* First name and Surname */}
      <div className="grid" style={{marginTop:12}}>
        <FormField 
          name="firstName" 
          label="First name: *" 
          placeholder="" 
          value={formData.firstName}
          onChange={onChange}
          onBlur={handleBlur('firstName')}
          error={errors?.firstName}
          required
          readOnly={readOnlyFields?.firstName}
          style={readOnlyFields?.firstName ? roStyle : undefined}
        />
        <FormField 
          name="surname" 
          label="Surname: *" 
          placeholder="" 
          value={formData.surname}
          onChange={onChange}
          onBlur={handleBlur('surname')}
          error={errors?.surname}
          required
          readOnly={readOnlyFields?.surname}
          style={readOnlyFields?.surname ? roStyle : undefined}
        />
      </div>

      {/* Middle/Other names and Preferred first name (Practising Certificate) */}
      <div className="grid" style={{marginTop:12}}>
        <FormField 
          name="otherName"
          label="Middle/Other names:" 
          placeholder="" 
          value={formData.otherName || ''}
          onChange={onChange}
        />
        {showForPractisingCertificate && (
          <FormField 
            name="preferredFirstName" 
            label="Preferred first name (if any):" 
            placeholder="" 
            value={formData.preferredFirstName || ''}
            onChange={onChange}
          />
        )}
      </div>

      {/* Former names + Post nominals in one row (Practising Certificate only); Title hidden from UI but in formData for PDF */}
      {showForPractisingCertificate && (
        <div className="grid" style={{marginTop:12, gridTemplateColumns: '1fr 1fr'}}>
          <FormField 
            name="formerNames" 
            label="Former names:" 
            placeholder="" 
            value={formData.formerNames || ''}
            onChange={onChange}
          />
          <FormField 
            name="postNominals" 
            label="Post nominals:" 
            placeholder="" 
            value={formData.postNominals || ''}
            onChange={onChange}
          />
          <div style={{ display: 'none' }}>
            <FormField
              name="title"
              label="Title: *"
              placeholder=""
              value={formData.title || ''}
              onChange={onChange}
              readOnly={readOnlyFields?.title}
            />
          </div>
        </div>
      )}

      {/* Gender and Date of birth in one row (Practising Certificate only) */}
      {showForPractisingCertificate && (
        <div className="grid" style={{marginTop:12, gridTemplateColumns: '1fr 1fr'}}>
          <div>
            <label style={{display:'block',fontSize:16,color:'#0b1220',marginBottom:6,fontWeight:700}}>
              Gender: <span style={{color:'#F26522'}}>*</span>
            </label>
            <div style={{display:'flex',gap:16}}>
              <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontWeight:400}}>
                <input type="radio" name="gender" value="male"  onChange={onChange} />
                <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Male</span>
              </label>
              <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontWeight:400}}>
                <input type="radio" name="gender" value="female"  onChange={onChange} />
                <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Female</span>
              </label>
            </div>
            {errors?.gender && (
              <span className="error-message">
                {errors.gender}
              </span>
            )}
          </div>
          <DateField
            name="dateOfBirth"
            label="Date of birth:"
            value={formData.dateOfBirth || ''}
            onChange={onChange!}
            onBlur={onBlur}
            error={errors?.dateOfBirth}
            required
          />
        </div>
      )}

      {/* Personal email hidden from UI but still in formData for PDF (Practising Certificate only) */}
      {showForPractisingCertificate && (
        <div style={{ display: 'none' }}>
          <FormField 
            name="personalEmail" 
            label="Personal email address: *" 
            type="email"
            placeholder="" 
            value={formData.personalEmail || ''}
            onChange={onChange}
            readOnly={readOnlyFields?.personalEmail}
          />
        </div>
      )}

      {/* Place of birth and Country of birth (Practising Certificate only) */}
      {showForPractisingCertificate && (
        <div className="grid" style={{marginTop:12}}>
          <FormField 
            name="placeOfBirth" 
            label="Place of birth: *" 
            placeholder="" 
            value={formData.placeOfBirth || ''}
            onChange={onChange}
            onBlur={handleBlur('placeOfBirth')}
            error={errors?.placeOfBirth}
            required
          />
          <CountrySelect 
            name="countryOfBirth" 
            label="Country of birth *" 
            value={formData.countryOfBirth || ''}
            onChange={onChange as any}
            error={errors?.countryOfBirth}
            required
          />
        </div>
      )}

      {/* Foreign law jurisdictions (ARC New only) */}
      {showForeignLawField && (
        <div style={{marginTop:12}}>
          <FormField
            name="foreignLawJurisdictions"
            label="I will be practising the foreign laws of (insert name of the foreign jurisdiction/s): *"
            placeholder=""
            value={formData.foreignLawJurisdictions || ''}
            onChange={onChange}
            onBlur={handleBlur('foreignLawJurisdictions')}
            error={errors?.foreignLawJurisdictions}
            required
          />
        </div>
      )}



              </>
          )}
    </>
  );
}

export type { ApplicantDetailsData, ApplicantDetailsErrors };
