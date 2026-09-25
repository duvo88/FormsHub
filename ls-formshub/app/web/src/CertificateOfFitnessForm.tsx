import React, { useState, useEffect } from 'react';
import './App.css';
import './components/components.css';
import Header from './components/Header';
import Footer from './components/Footer';
import FormErrorSummary, { FormErrorSummaryItem } from './components/FormErrorSummary';
import FormField from './components/FormField';
import DateField from './components/DateField';
import apiService from './services/apiService';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useAuthPrefill } from './hooks/useAuthPrefill';
import FileUploadField from './components/FileUploadField';
import CountrySelect from './components/CountrySelect';
import { getEmailListValidationError, getFirstInvalidEmailIndex, getTotalAttachmentLimitError } from './utils/validation';
import { getCheckoutUrlOrThrow } from './utils/submission';
import { getValidationSummary, focusFieldByName } from './utils/formErrorSummary';
import { FORM_TYPES, FORM_TYPES_SHORT } from './constants/formTypes';
import { FORM_NAMES } from './constants/formNames';

function CertificateOfFitnessForm() {
  const [formData, setFormData] = useState({
    // Section 1 - Applicant
    lawID: '',
    surname: '',
    firstName: '',
    otherName: '',
    dateOfBirth: '',
    // Section 2 - Delivery Information
    deliveryMethod: '',
    recipientName: '',
    deliveryEmails: [''] as string[],
    deliveryStreet: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPostcode: '',
    deliveryCountry: '',
    deliveryConsent: false,
    // Section 3 - Purpose and/or Jurisdiction
    interstateJurisdiction: false,
    interstateJurisdictionBody: '',
    interstateJurisdictionBodies: [''] as string[],
    overseasJurisdiction: false,
    overseasJurisdictionName: '',
    overseasRegulatoryBody: '',
    nswBar: false,
    notary: false,
    otherJurisdiction: false,
    otherIntendedRecipient: '',
    otherJurisdictionDetails: '',
    otherSupportingFile: null as File[] | null,
    // Section 4 - Payment Instruction
    paymentAmount: '',
    // Section 5 - Declaration
    declarationTruth: false,
    declarationPrivacy: false,
  });

  const [errors, setErrors] = useState({
    lawID: '',
    surname: '',
    firstName: '',
    dateOfBirth: '',
    deliveryMethod: '',
    deliveryEmails: '',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPostcode: '',
    deliveryCountry: '',
    deliveryConsent: '',
    jurisdiction: '',
    interstateJurisdictionBody: '',
    overseasJurisdictionName: '',
    otherIntendedRecipient: '',
    otherJurisdictionDetails: '',
    paymentAmount: '',
    declarationTruth: '',
    declarationPrivacy: '',
    otherSupportingFileSize: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentLimitError, setAttachmentLimitError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<FormErrorSummaryItem[]>([]);
  const [simpleFee, setSimpleFee] = useState<number | null>(null);
  const { lawSocietyId: authenticatedLawSocietyId, email: userEmail, name: userName, firstName: authFirstName, surname: authSurname, otherName: authOtherName, isMember: authIsMember } = useAuthenticatedUser();

  const interstateJurisdictionOptions = [
    'ACT - Law Society of the Australian Capital Territory',
    'ACT - Australian Capital Territory Bar Association',
    'NT - Law Society Northern Territory',
    'NT - Northern Territory Bar Association',
    'QLD - Queensland Law Society',
    'QLD - Bar Association of Queensland',
    'SA - Law Society of South Australia',
    'SA - South Australian Bar Association',
    'TAS - Law Society of Tasmania',
    'TAS - Tasmanian Bar Association',
    'VIC - Victorian Legal Services Board + Commissioner',
    'VIC - Victorian Bar Association',
    'WA - Law Society of Western Australia',
    'WA - Western Australian Bar Association'
  ];

  // Always fetch from CoF table — key is cof-<paymentAmount> (member=$0, au-non-member=$110, overseas-non-member=$100)
  useEffect(() => {
    if (!formData.paymentAmount) return;
    apiService.getCofFee(`cof-${formData.paymentAmount}`).then(amt => setSimpleFee(amt)).catch(() => {});
  }, [formData.paymentAmount]);

  const recipientNameFromAuth = [authFirstName, authSurname].filter(Boolean).join(' ');

  useAuthPrefill(setFormData, {
    lawID: userEmail,
    firstName: authFirstName,
    surname: authSurname,
    otherName: authOtherName,
    recipientName: recipientNameFromAuth,
    paymentAmount: authIsMember === true ? 'member' : undefined,
  });

  useEffect(() => {
    const nextAttachmentLimitError = getTotalAttachmentLimitError({ otherSupportingFile: formData.otherSupportingFile });
    setAttachmentLimitError(nextAttachmentLimitError);
    if (!nextAttachmentLimitError && submitError?.startsWith('Exceeded attachment size')) {
      setSubmitError(null);
    }
  }, [formData.otherSupportingFile, submitError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === 'checkbox' || type === 'radio' ? (type === 'checkbox' ? checked : value) : value;

    // Map for checkbox and radio label text
    const labelTextMap: Record<string, string> = {
      // Checkboxes
      'deliveryConsent': "I consent to the Law Society delivering the certificate of fitness to the above recipient and/or address(es). I understand that the Law Society may elect to send the certificate of fitness to myself despite this consent.",
      'interstateJurisdiction': "Interstate Jurisdiction (Applying for a practising certificate in another Australian jurisdiction)",
      'overseasJurisdiction': "Overseas Jurisdiction (Applying for registration to practise in an overseas jurisdiction)",
      'nswBar': "New South Wales Bar Association (Transferring to the Bar)",
      'notary': "Society of Notaries of New South Wales Inc. (Applying for appointment as a Public Notary)",
      'otherJurisdiction': "Other",
      'declarationTruth': "I declare that the contents of this form are true and correct and that I am the person as stated above.",
      'declarationPrivacy': "I have read the Personal Information Collection Notice before providing my personal information and agree to the below terms",
      // Radio buttons
      'deliveryMethod': { 'email': 'Email', 'post': 'Post', 'both': 'Email & Post' }[value] || value
    };

    setFormData(prev => {
      const updated: any = { ...prev, [name]: newValue };
      
      // Add text field for checkboxes and radios
      if ((type === 'checkbox' || type === 'radio') && labelTextMap[name]) {
        updated[`${name}Text`] = labelTextMap[name];
      }

      // Clear dynamic fields when delivery method changes
      if (name === 'deliveryMethod') {
        // Clear email field when not email/both
        if (value !== 'email' && value !== 'both') {
          updated.deliveryEmail = '';
        }
        // Clear postal fields when not post/both
        if (value !== 'post' && value !== 'both') {
          updated.deliveryStreet = '';
          updated.deliveryCity = '';
          updated.deliveryState = '';
          updated.deliveryPostcode = '';
          updated.deliveryCountry = '';
        }
      }

      // Clear interstate jurisdiction fields when unchecked
      if (name === 'interstateJurisdiction' && !checked) {
        updated.interstateJurisdictionBody = '';
        updated.interstateJurisdictionBodies = [''];
      }

      // Clear overseas jurisdiction fields when unchecked
      if (name === 'overseasJurisdiction' && !checked) {
        updated.overseasJurisdictionName = '';
        updated.overseasRegulatoryBody = '';
      }

      // Clear other jurisdiction fields when unchecked
      if (name === 'otherJurisdiction' && !checked) {
        updated.otherIntendedRecipient = '';
        updated.otherJurisdictionDetails = '';
        updated.otherSupportingFile = null;
      }

      return updated;
    });
    
    // Clear error when user starts typing or selects an option
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
      setValidationSummary(prev => prev.filter(item => item.field !== name));
    }
  };

  const handleInterstateJurisdictionBodyChange = (index: number, value: string) => {
    setFormData(prev => {
      const nextBodies = [...prev.interstateJurisdictionBodies];
      nextBodies[index] = value;
      return {
        ...prev,
        interstateJurisdictionBodies: nextBodies,
        interstateJurisdictionBody: nextBodies[0] || '',
      };
    });

    if (errors.interstateJurisdictionBody) {
      setErrors(prev => ({ ...prev, interstateJurisdictionBody: '' }));
    }
  };

  const handleAddInterstateJurisdiction = () => {
    setFormData(prev => ({
      ...prev,
      interstateJurisdictionBodies: [...prev.interstateJurisdictionBodies, ''],
    }));
  };

  const handleRemoveInterstateJurisdiction = (index: number) => {
    setFormData(prev => {
      const nextBodies = prev.interstateJurisdictionBodies.filter((_, i) => i !== index);
      const normalizedBodies = nextBodies.length ? nextBodies : [''];
      return {
        ...prev,
        interstateJurisdictionBodies: normalizedBodies,
        interstateJurisdictionBody: normalizedBodies[0] || '',
      };
    });
  };

  const handleBlur = (fieldName: string, value: string) => {
    let errorMessage = '';

    const parseDmy = (dmy: string): Date | null => {
      const parts = dmy.split('/');
      if (parts.length !== 3) return null;
      const [dd, mm, yyyy] = parts;
      const day = Number(dd);
      const month = Number(mm);
      const year = Number(yyyy);
      if (!day || !month || !year) return null;
      const candidate = new Date(year, month - 1, day);
      if (
        candidate.getFullYear() !== year ||
        candidate.getMonth() !== month - 1 ||
        candidate.getDate() !== day
      ) {
        return null;
      }
      return candidate;
    };

    if (fieldName === 'surname' && !value.trim()) {
      errorMessage = 'Surname is required';
    } else if (fieldName === 'firstName' && !value.trim()) {
      errorMessage = 'First name is required';
    } else if (fieldName === 'dateOfBirth') {
      if (!value.trim()) {
        errorMessage = 'Date of birth is required';
      } else {
        const dob = parseDmy(value.trim());
        if (!dob) {
          errorMessage = 'Enter a valid date of birth';
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dob > today) {
            errorMessage = 'Date of birth cannot be in the future';
          }
        }
      }
    } else if (fieldName === 'otherJurisdictionDetails' && formData.otherJurisdiction && !value.trim()) {
      errorMessage = 'Please provide details for other jurisdiction';
    }

    setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
  };

  const requiredDeliveryEmailMessage = 'At least one email address is required';
  const invalidDeliveryEmailMessage = 'Please enter a valid email address';
  const firstInvalidDeliveryEmailIndex = getFirstInvalidEmailIndex(formData.deliveryEmails);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    setSubmitError(null);
    setValidationSummary([]);

    const currentAttachmentLimitError = getTotalAttachmentLimitError({ otherSupportingFile: formData.otherSupportingFile });
    if (currentAttachmentLimitError) {
      setSubmitError(currentAttachmentLimitError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    const newErrors = {
      lawID: '',
      surname: '',
      firstName: '',
      dateOfBirth: '',
      deliveryMethod: '',
      deliveryEmails: '',
      deliveryStreet: '',
      deliveryCity: '',
      deliveryState: '',
      deliveryPostcode: '',
      deliveryCountry: '',
      deliveryConsent: '',
      jurisdiction: '',
      interstateJurisdictionBody: '',
      overseasJurisdictionName: '',
      otherIntendedRecipient: '',
      otherJurisdictionDetails: '',
      paymentAmount: '',
      declarationTruth: '',
      declarationPrivacy: '',
      otherSupportingFileSize: '',
    };

    // Section 1 - Applicant
    // lawID hidden from UI, populated from auth - no UI validation needed
    if (!formData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    // Section 2 - Delivery Information
    if (!formData.deliveryMethod) {
      newErrors.deliveryMethod = 'Please select a delivery method';
    }
    // At least one email is mandatory when email delivery is selected
    if (formData.deliveryMethod === 'email' || formData.deliveryMethod === 'both') {
      newErrors.deliveryEmails = getEmailListValidationError(formData.deliveryEmails, {
        required: true,
        requiredMessage: 'At least one email address is required',
      });
    }
    if (formData.deliveryMethod === 'post' || formData.deliveryMethod === 'both') {
      if (!formData.deliveryStreet.trim()) newErrors.deliveryStreet = 'Street number and name is required';
      if (!formData.deliveryCity.trim()) newErrors.deliveryCity = 'City is required';
      if (!formData.deliveryState.trim()) newErrors.deliveryState = 'State is required';
      if (!formData.deliveryPostcode.trim()) newErrors.deliveryPostcode = 'Postcode is required';
      if (!formData.deliveryCountry.trim()) newErrors.deliveryCountry = 'Country is required';
    }
    if (!formData.deliveryConsent) {
      newErrors.deliveryConsent = 'Consent is required';
    }

    // Section 3 - Jurisdiction
    const hasJurisdictionSelected = formData.interstateJurisdiction || 
      formData.overseasJurisdiction || 
      formData.nswBar || 
      formData.notary || 
      formData.otherJurisdiction;
    
    if (!hasJurisdictionSelected) {
      newErrors.jurisdiction = 'Please select at least one purpose/jurisdiction';
    }
    if (
      formData.interstateJurisdiction &&
      !formData.interstateJurisdictionBodies.some(body => body)
    ) {
      newErrors.interstateJurisdictionBody = 'Please select an interstate jurisdiction and regulatory body';
    }
    if (formData.overseasJurisdiction && !formData.overseasJurisdictionName.trim()) {
      newErrors.overseasJurisdictionName = 'Name of overseas jurisdiction is required';
    }
    if (formData.otherJurisdiction && !formData.otherIntendedRecipient.trim()) {
      newErrors.otherIntendedRecipient = 'Intended recipient is required';
    }
    if (formData.otherJurisdiction && !formData.otherJurisdictionDetails.trim()) {
      newErrors.otherJurisdictionDetails = 'Please detail the reasons why you require a certificate of fitness';
    }

    // Section 4 - Payment
    if (!formData.paymentAmount) {
      newErrors.paymentAmount = 'Please select a payment amount';
    }

    // Section 5 - Declaration
    if (!formData.declarationTruth) {
      newErrors.declarationTruth = 'You must declare the contents are true and correct';
    }
    if (!formData.declarationPrivacy) {
      newErrors.declarationPrivacy = 'You must agree to the Personal Information Collection Notice';
    }
    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== '')) {
      setValidationSummary(getValidationSummary(newErrors));
      const firstErrorField = Object.keys(newErrors).find(key => newErrors[key as keyof typeof newErrors] !== '');
      if (firstErrorField) {
        focusFieldByName(firstErrorField);
      }
      return;
    }

    setValidationSummary([]);

    // Determine price from table lookup (simpleFee) with hardcoded fallbacks
    let price = simpleFee ?? 0;
    let feeSm = 0;
    let smLogic = '';
    if (formData.paymentAmount === 'member') {
      price = simpleFee ?? 0;
    } else if (formData.paymentAmount === 'au-non-member') {
      price = simpleFee ?? 110;
      feeSm = price; // entire fee has GST (inclusive)
      smLogic = 'Certificate of Fitness AU (incl. GST)';
    } else if (formData.paymentAmount === 'overseas-non-member') {
      price = simpleFee ?? 100;
      feeSm = 0;
      smLogic = 'No GST';
    }

    // Prepare form data for submission
    const formType = FORM_TYPES.CERTIFICATE_OF_FITNESS;
    const formTypeShort = FORM_TYPES_SHORT.CERTIFICATE_OF_FITNESS;
    const submissionData = {
      formType,
      applicantDetails: {
        surname: formData.surname,
        firstName: formData.firstName,
        otherName: formData.otherName || '',
        dateOfBirth: formData.dateOfBirth,
      },
      deliveryInformation: {
        deliveryMethod: formData.deliveryMethod,
        deliveryMethodText: (formData as any).deliveryMethodText,
        recipientName: formData.recipientName || '',
        ...(formData.deliveryMethod === 'email' || formData.deliveryMethod === 'both' ? { deliveryEmails: formData.deliveryEmails.filter(e => e.trim()) } : {}),
        ...(formData.deliveryMethod === 'post' || formData.deliveryMethod === 'both' ? {
          deliveryStreet: formData.deliveryStreet,
          deliveryCity: formData.deliveryCity,
          deliveryState: formData.deliveryState,
          deliveryPostcode: formData.deliveryPostcode,
          deliveryCountry: formData.deliveryCountry,
        } : {}),
        deliveryConsent: formData.deliveryConsent,
        deliveryConsentText: (formData as any).deliveryConsentText,
      },
      jurisdiction: {
        interstate: formData.interstateJurisdiction,
        interstateText: (formData as any).interstateJurisdictionText,
        interstateJurisdictionBody: formData.interstateJurisdictionBodies[0] || '',
        interstateJurisdictionBodies: formData.interstateJurisdictionBodies.filter(body => body),
        overseas: formData.overseasJurisdiction,
        overseasText: (formData as any).overseasJurisdictionText,
        overseasJurisdictionName: formData.overseasJurisdictionName || '',
        overseasRegulatoryBody: formData.overseasRegulatoryBody || '',
        nswBar: formData.nswBar,
        nswBarText: (formData as any).nswBarText,
        notary: formData.notary,
        notaryText: (formData as any).notaryText,
        other: formData.otherJurisdiction,
        otherText: (formData as any).otherJurisdictionText,
        otherIntendedRecipient: formData.otherIntendedRecipient || '',
        otherDetails: formData.otherJurisdictionDetails || ''
      },
      paymentInstruction: {
        paymentAmount: formData.paymentAmount,
        priceAUD: price,
      },
      declaration: {
        truthDeclaration: formData.declarationTruth,
        truthDeclarationText: (formData as any).declarationTruthText,
        privacyNotice: formData.declarationPrivacy,
        privacyNoticeText: (formData as any).declarationPrivacyText,
      },
      submittedAt: new Date().toISOString().replace('Z', '+00:00')
    };

    try {
      setIsSubmitting(true);
      const formName = FORM_NAMES.CERTIFICATE_OF_FITNESS;

      const lawSocietyId = authenticatedLawSocietyId || formData.lawID || '';
      console.log('Using LawID for submission:', lawSocietyId);

      // Upload attachments
      const { submissionId, blobUrls } = await apiService.uploadAllAttachments(
        formType,
        lawSocietyId,
        formTypeShort,
        {
          ...(formData.otherSupportingFile ? { otherSupportingFile: formData.otherSupportingFile } : {})
        }
      );
      
      console.log('Submission ID from backend (Australian time):', submissionId);

      const fieldLabels: Record<string, string> = {
        surname: 'Surname', firstName: 'First Name',
        otherName: 'Middle/Other Names',
        dateOfBirth: 'Date of Birth',
        deliveryMethod: 'Preferred Delivery Method', recipientName: 'Name of Recipient',
        deliveryEmails: 'Email Addresses for Delivery', deliveryStreet: 'Street Number and Name',
        deliveryCity: 'City/Suburb', deliveryState: 'State', deliveryPostcode: 'Postcode',
        deliveryCountry: 'Country',
        deliveryConsent: 'Consent to Delivery',
        interstate: 'Interstate Jurisdiction', interstateJurisdictionBody: 'Interstate Jurisdiction and Regulatory Body',
        overseas: 'Overseas Jurisdiction', overseasJurisdictionName: 'Name of Overseas Jurisdiction',
        overseasRegulatoryBody: 'Name of Overseas Regulatory Body',
        nswBar: 'New South Wales Bar Association', notary: 'Society of Notaries',
        other: 'Other Jurisdiction', otherIntendedRecipient: 'Intended Recipient',
        otherDetails: 'Details for Certificate of Fitness',
        paymentAmount: 'Payment Amount', priceAUD: 'Price (AUD)',
        truthDeclaration: 'Declaration of Truth', privacyNotice: 'Privacy Notice'
      };

      const sectionLabels: Record<string, string> = {
        applicantDetails: 'Applicant Details',
        deliveryInformation: 'Delivery Information',
        jurisdiction: 'Purpose and/or Jurisdiction',
        paymentInstruction: 'Payment',
        declaration: 'Declaration',
      };

      if (price === 0) {
        // Member - no payment required, submit directly
        await apiService.submitFormWithAttachments(
          formType,
          submissionId,
          submissionData,
          formName,
          formTypeShort,
          price,
          blobUrls,
          lawSocietyId,
          userEmail || '',
          userName || undefined,
          {
            businessUnit: '1910',
            sku: '85905',
            receiptCategory: 'registry'
          },
          fieldLabels,
          sectionLabels,
          feeSm,
          smLogic
        );
        console.log('Form submitted successfully (no payment required)');
        window.location.href = `/submission-success?free=true&formType=${formType}`;
      } else {
        // Non-member - redirect to Stripe
        const result = await apiService.submitFormWithAttachments(
          formType,
          submissionId,
          submissionData,
          formName,
          formTypeShort,
          price,
          blobUrls,
          lawSocietyId,
          userEmail || '',
          userName || undefined,
          {
            businessUnit: '1910',
            sku: '85905',
            receiptCategory: 'registry'
          },
          fieldLabels,
          sectionLabels,
          feeSm,
          smLogic
        );

        console.log('Form submitted successfully:', result);
        window.location.href = getCheckoutUrlOrThrow(result, apiService.getSafeCheckoutUrl);
      }
      
    } catch (error) {
      console.error('Error submitting form');
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="App page-root">
      <main className="form-container">
        <section className="form-card" style={{ padding: '22px 32px 80px 32px' }}>
          <Header title={"Request for a Certificate of Fitness"} subtitle={"This form is a request for a certificate of fitness that may be required if you are applying to practise in another jurisdiction, to practise as a barrister in New South Wales, or to become a notary public. A certificate of fitness may provide details of your admission to the legal profession, your current and/or most recent practising certificate, and any conduct issues."} />

          <FormErrorSummary
            items={validationSummary}
            onSelect={focusFieldByName}
          />

          {/* ── Section 1: Applicant ── */}
          <h2 className="section-title">1. Applicant</h2>

          <div className="grid">
            <FormField
              name="firstName"
              label="First name *"
              placeholder=""
              value={formData.firstName}
              onChange={handleChange}
              onBlur={(e) => handleBlur('firstName', e.target.value)}
              error={errors.firstName}
              required
              readOnly={!!authFirstName}
              style={!!authFirstName ? { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' } : undefined}
            />
            <FormField
              name="surname"
              label="Surname *"
              placeholder=""
              value={formData.surname}
              onChange={handleChange}
              onBlur={(e) => handleBlur('surname', e.target.value)}
              error={errors.surname}
              required
              readOnly={!!authSurname}
              style={!!authSurname ? { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' } : undefined}
            />
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            <FormField
              name="otherName"
              label="Middle/Other names"
              placeholder=""
              value={formData.otherName}
              onChange={handleChange}
            />
            <DateField
              name="dateOfBirth"
              label="Date of birth"
              value={formData.dateOfBirth}
              onChange={handleChange as any}
              onBlur={handleBlur}
              error={errors.dateOfBirth}
              required
              maxDate={new Date()}
            />
          </div>

          <div style={{ display: 'none' }}>
            {/* LawID hidden from UI but in formData for PDF */}
            <FormField
              name="lawID"
              label="LawID *"
              placeholder="000000 (Available on your practising certificate)"
              value={formData.lawID}
              onChange={handleChange}
              readOnly={!!userEmail}
            />
          </div>

          <div className="section-divider" />

          {/* ── Section 2: Delivery Information ── */}
          <h2 className="section-title">2. Delivery Information</h2>

          <div style={{marginBottom:16}}>
            <label style={{
              fontSize:16,
              color:'#0b1220',
              fontWeight:400,
              marginBottom:8,
              display:'block'
            }}>
              Please select your preferred delivery method: <span style={{color:'#F26522'}}>*</span>
            </label>
            <div style={{display:'flex',flexDirection:'row',gap:24,marginTop:8}}>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="email"
                  checked={formData.deliveryMethod === 'email'}
                  onChange={handleChange}
                  style={{width:14,height:14,cursor:'pointer'}}
                />
                <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Email</span>
              </label>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="post"
                  checked={formData.deliveryMethod === 'post'}
                  onChange={handleChange}
                  style={{width:14,height:14,cursor:'pointer'}}
                />
                <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Post</span>
              </label>
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="both"
                  checked={formData.deliveryMethod === 'both'}
                  onChange={handleChange}
                  style={{width:14,height:14,cursor:'pointer'}}
                />
                <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>Email & Post</span>
              </label>
            </div>
            {errors.deliveryMethod && (
              <span className="error-message">{errors.deliveryMethod}</span>
            )}
          </div>

          <div style={{ display: 'none' }}>
            <FormField
              name="recipientName"
              label="Name of recipient"
              placeholder="Leave blank if not required"
              value={formData.recipientName}
              onChange={handleChange}
            />
          </div>

          {/* Email fields - shown for Email or Email & Post */}
          {(formData.deliveryMethod === 'email' || formData.deliveryMethod === 'both') && (
            <div id="deliveryEmails" style={{ marginBottom: 16 }}>
              {formData.deliveryEmails.map((email, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  {(() => {
                    const showRequiredErrorForFirstRow =
                      errors.deliveryEmails === requiredDeliveryEmailMessage && index === 0;
                    const showInvalidErrorForRow =
                      errors.deliveryEmails === invalidDeliveryEmailMessage && index === firstInvalidDeliveryEmailIndex;
                    const showInlineError = showRequiredErrorForFirstRow || showInvalidErrorForRow;

                    return (
                      <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 16, color: '#0b1220', fontWeight: 400, margin: 0 }}>
                      Email address for delivery: {index === 0 && <span style={{ color: '#F26522' }}>*</span>}
                    </label>
                    {formData.deliveryEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newEmails = formData.deliveryEmails.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, deliveryEmails: newEmails }));
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#F26522',
                          fontSize: 14,
                          cursor: 'pointer',
                          fontWeight: 400,
                          padding: 0,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    placeholder=""
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...formData.deliveryEmails];
                      newEmails[index] = e.target.value;
                      setFormData(prev => ({ ...prev, deliveryEmails: newEmails }));
                      if (e.target.value.trim()) {
                        setErrors(prev => ({ ...prev, deliveryEmails: '' }));
                        setValidationSummary(prev => prev.filter(item => item.field !== 'deliveryEmails'));
                      }
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#F26522';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D1D5DB';
                      const nextEmails = [...formData.deliveryEmails];
                      nextEmails[index] = e.target.value;
                      setErrors(prev => ({
                        ...prev,
                        deliveryEmails: getEmailListValidationError(nextEmails, {
                          required: true,
                          requiredMessage: requiredDeliveryEmailMessage,
                          invalidMessage: invalidDeliveryEmailMessage,
                        })
                      }));
                      if (!getEmailListValidationError(nextEmails, {
                        required: true,
                        requiredMessage: requiredDeliveryEmailMessage,
                        invalidMessage: invalidDeliveryEmailMessage,
                      })) {
                        setValidationSummary(prev => prev.filter(item => item.field !== 'deliveryEmails'));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: 16,
                      border: showInlineError ? '1px solid #C0392B' : '1px solid #D1D5DB',
                      borderRadius: 4,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {showInlineError && (
                    <span className="error-message" style={{ display: 'block', marginTop: 6 }}>
                      {showRequiredErrorForFirstRow ? requiredDeliveryEmailMessage : invalidDeliveryEmailMessage}
                    </span>
                  )}
                      </>
                    );
                  })()}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, deliveryEmails: [...prev.deliveryEmails, ''] }));
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  color: '#F26522',
                  background: 'white',
                  border: '1px solid #F26522',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 400,
                  marginBottom: 8,
                }}
              >
                + Add more email addresses
              </button>
              {errors.deliveryEmails &&
                errors.deliveryEmails !== requiredDeliveryEmailMessage &&
                errors.deliveryEmails !== invalidDeliveryEmailMessage && (
                  <span className="error-message" style={{ display: 'block', marginTop: 6 }}>
                    {errors.deliveryEmails}
                  </span>
                )}
            </div>
          )}

          {/* Postal address fields - shown for Post or Email & Post */}
          {(formData.deliveryMethod === 'post' || formData.deliveryMethod === 'both') && (
            <>
              <FormField
                name="deliveryStreet"
                label="Street number and name *"
                placeholder=""
                value={formData.deliveryStreet}
                onChange={handleChange}
                error={errors.deliveryStreet}
                required
              />
              <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
                <FormField
                  name="deliveryCity"
                  label="City/Suburb *"
                  placeholder=""
                  value={formData.deliveryCity}
                  onChange={handleChange}
                  error={errors.deliveryCity}
                  required
                />
                <FormField
                  name="deliveryState"
                  label="State *"
                  placeholder=""
                  value={formData.deliveryState}
                  onChange={handleChange}
                  error={errors.deliveryState}
                  required
                />
                <FormField
                  name="deliveryPostcode"
                  label="Postcode *"
                  placeholder=""
                  value={formData.deliveryPostcode}
                  onChange={handleChange}
                  error={errors.deliveryPostcode}
                  required
                />
              </div>
              <CountrySelect
                name="deliveryCountry"
                label="Country *"
                value={formData.deliveryCountry}
                onChange={handleChange as any}
                error={errors.deliveryCountry}
                required
              />
            </>
          )}

          <div style={{marginTop:8,marginBottom:16}}>
            <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
              <input
                type="checkbox"
                name="deliveryConsent"
                checked={formData.deliveryConsent}
                onChange={handleChange}
                style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}}
              />
              <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220'}}>
                I consent to the Law Society delivering the certificate of fitness to the above recipient and/or address(es). I understand that the Law Society may elect to send the certificate of fitness to myself despite this consent. <span style={{color:'#F26522'}}>*</span>
              </span>
            </label>
            {errors.deliveryConsent && (
              <span className="error-message">{errors.deliveryConsent}</span>
            )}
          </div>

          <div className="section-divider" />

          {/* ── Section 3: Purpose and/or Jurisdiction ── */}
          <h2 className="section-title">3. Purpose and/or Jurisdiction</h2>
          <p style={{fontSize:16,color:'#0b1220',marginTop:8,marginBottom:12,fontWeight:600}}>
            Please select the purpose and/or jurisdiction for which a certificate of fitness is required: <span style={{color:'#F26522'}}>*</span>
          </p>
          <div style={{marginTop:12}}>
            <label style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10,cursor:'pointer'}}>
              <input 
                type="checkbox" 
                name="interstateJurisdiction"
                checked={formData.interstateJurisdiction}
                onChange={handleChange}
                style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
              />
              <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220',fontWeight:400}}>Interstate Jurisdiction (Applying for a practising certificate in another Australian jurisdiction)</span>
            </label>

            <label style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10,cursor:'pointer'}}>
              <input 
                type="checkbox" 
                name="overseasJurisdiction"
                checked={formData.overseasJurisdiction}
                onChange={handleChange}
                style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
              />
              <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220',fontWeight:400}}>Overseas Jurisdiction (Applying for registration to practise in an overseas jurisdiction)</span>
            </label>

            <label style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10,cursor:'pointer'}}>
              <input 
                type="checkbox" 
                name="nswBar"
                checked={formData.nswBar}
                onChange={handleChange}
                style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
              />
              <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220',fontWeight:400}}>New South Wales Bar Association (Transferring to the Bar)</span>
            </label>

            <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
              <input 
                type="checkbox" 
                name="notary"
                checked={formData.notary}
                onChange={handleChange}
                style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
              />
              <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220',fontWeight:400}}>Society of Notaries of New South Wales Inc. (Applying for appointment as a Public Notary)</span>
            </label>

            <label style={{display:'flex',alignItems:'flex-start',gap:10,marginTop:10,cursor:'pointer'}}>
              <input 
                type="checkbox" 
                name="otherJurisdiction"
                checked={formData.otherJurisdiction}
                onChange={handleChange}
                style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}} 
              />
              <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220',fontWeight:400}}>Other</span>
            </label>
            {/* NSW Bar only → Bar note; Interstate (alone or with nswBar) → Interstate note */}
            {(formData.interstateJurisdiction || formData.nswBar) && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',margin:'16px 0',borderRadius:4}}>
                <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
                  {formData.nswBar && !formData.interstateJurisdiction ? (
                    <><strong>NOTE:</strong> If you are a holder of a current practising certificate issued to you by The Law Society of New South Wales, you must surrender that practising certificate before taking up a practising certificate issued by the New South Wales Bar Association. Should you hold a physical copy of your practising certificate, this should be returned to the Law Society Registry.</>
                  ) : (
                    <><strong>NOTE:</strong> If you are a holder of a current practising certificate issued to you by The Law Society of New South Wales, you must surrender that practising certificate before taking up an Australian practising certificate in a different Australian jurisdiction. Should you hold a physical copy of your practising certificate, this should be returned to the Law Society Registry.</>
                  )}
                </p>
              </div>
            )}

            {errors.jurisdiction && (
              <span className="error-message">{errors.jurisdiction}</span>
            )}

            {formData.interstateJurisdiction && (
              <div style={{marginBottom:16}}>
                <h3 style={{fontSize:18,fontWeight:700,color:'#0b1220',marginBottom:8}}>Interstate jurisdiction details</h3>
                <label style={{fontSize:16,color:'#0b1220',display:'block',marginBottom:8}}>
                  Please select the interstate jurisdiction and regulatory body for which a certificate of fitness is required: <span style={{color:'#F26522'}}>*</span>
                </label>
                {formData.interstateJurisdictionBodies.map((body, index) => (
                  <div key={`interstate-jurisdiction-${index}`} style={{ marginBottom: 10 }}>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <select
                        name="interstateJurisdictionBody"
                        value={body}
                        onChange={(e) => handleInterstateJurisdictionBodyChange(index, e.target.value)}
                        style={{
                          width:'100%',
                          padding:'10px 12px',
                          fontSize:16,
                          border:'1px solid #ccc',
                          borderRadius:4,
                          backgroundColor:'#fff',
                          color:'#0b1220',
                          appearance:'auto'
                        }}
                      >
                        <option value="">Please select</option>
                        {interstateJurisdictionOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {formData.interstateJurisdictionBodies.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInterstateJurisdiction(index)}
                          style={{
                            border:'none',
                            background:'none',
                            color:'#F26522',
                            fontSize:14,
                            fontWeight:400,
                            padding:0,
                            cursor:'pointer',
                            whiteSpace:'nowrap'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddInterstateJurisdiction}
                  style={{
                    padding:'8px 16px',
                    fontSize:14,
                    color:'#F26522',
                    background:'white',
                    border:'1px solid #F26522',
                    borderRadius:4,
                    cursor:'pointer',
                    fontWeight:400,
                    marginBottom:8,
                  }}
                >
                  + Add another Interstate Jurisdiction
                </button>
                {errors.interstateJurisdictionBody && (
                  <span className="error-message">{errors.interstateJurisdictionBody}</span>
                )}
              </div>
            )}

            {formData.overseasJurisdiction && (
              <div style={{marginBottom:16}}>
                <h3 style={{fontSize:18,fontWeight:700,fontStyle:'italic',color:'#0b1220',marginBottom:12}}>Overseas jurisdiction details</h3>
                <div className="grid">
                  <FormField
                    name="overseasJurisdictionName"
                    label="Name of overseas jurisdiction *"
                    placeholder=""
                    value={formData.overseasJurisdictionName}
                    onChange={handleChange}
                    error={errors.overseasJurisdictionName}
                    required
                  />
                  <FormField
                    name="overseasRegulatoryBody"
                    label="Name of overseas regulatory body:"
                    placeholder=""
                    value={formData.overseasRegulatoryBody}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {formData.otherJurisdiction && (
              <div style={{marginTop:16,marginBottom:16}}>
                <h3 style={{fontSize:18,fontWeight:700,fontStyle:'italic',color:'#0b1220',marginBottom:12}}>Other details</h3>
                <FormField
                  name="otherIntendedRecipient"
                  label="Intended recipient: *"
                  placeholder=""
                  value={formData.otherIntendedRecipient}
                  onChange={handleChange}
                  error={errors.otherIntendedRecipient}
                  required
                />
                <div style={{marginBottom:16}}>
                  <label style={{fontSize:16,color:'#0b1220',fontWeight:600,display:'block',marginBottom:8}}>
                    Please detail the reasons why you require a certificate of fitness: <span style={{color:'#F26522'}}>*</span>
                  </label>
                  <textarea
                    name="otherJurisdictionDetails"
                    value={formData.otherJurisdictionDetails}
                    onChange={(e) => setFormData(prev => ({...prev, otherJurisdictionDetails: e.target.value}))}
                    placeholder="Please specify details"
                    rows={4}
                    className="form-textarea"
                  />
                  {errors.otherJurisdictionDetails && (
                    <span className="error-message">{errors.otherJurisdictionDetails}</span>
                  )}
                </div>
                <div style={{marginBottom:16}}>
                  <label style={{fontSize:16,color:'#0b1220',fontWeight:400,display:'block',marginBottom:8}}>
                    Please attach any further or supporting information (if applicable):
                  </label>
                  <FileUploadField
                    files={formData.otherSupportingFile}
                    onFilesChange={(f) => setFormData(prev => ({...prev, otherSupportingFile: f}))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="section-divider" />

          {/* ── Section 4: Payment Options ── */}
          <h2 className="section-title">4. Payment Options</h2>

          <div style={{marginTop:8,marginBottom:16}}>
            {authIsMember === true ? (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4}}>
                <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
                  You have been identified as a <strong>Law Society Member</strong>. No fee applies for this application.
                </p>
              </div>
            ) : (
              <>
                <label className="form-label" style={{display:'block',marginBottom:12}}>
                  Please select your residency: <span style={{color:'#F26522'}}>*</span>
                </label>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                    <input
                      type="radio"
                      name="paymentAmount"
                      value="au-non-member"
                      checked={formData.paymentAmount === 'au-non-member'}
                      onChange={handleChange}
                      style={{width:14,height:14,cursor:'pointer'}}
                    />
                    <span style={{fontSize:16,color:'#0b1220'}}>Australian Resident — AUD $110 (incl. GST of 10%)</span>
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                    <input
                      type="radio"
                      name="paymentAmount"
                      value="overseas-non-member"
                      checked={formData.paymentAmount === 'overseas-non-member'}
                      onChange={handleChange}
                      style={{width:14,height:14,cursor:'pointer'}}
                    />
                    <span style={{fontSize:16,color:'#0b1220'}}>Overseas Resident — AUD $100 (no GST)</span>
                  </label>
                </div>
                {errors.paymentAmount && (
                  <span className="error-message">{errors.paymentAmount}</span>
                )}
              </>
            )}
          </div>

          <div className="section-divider" />

          {/* ── Section 5: Declaration ── */}
          <h2 className="section-title">5. Declaration</h2>

          <div style={{marginTop:12,marginBottom:16}}>
            <label style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:12,cursor:'pointer'}}>
              <input
                type="checkbox"
                name="declarationTruth"
                checked={formData.declarationTruth}
                onChange={handleChange}
                style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}}
              />
              <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220'}}>
                I declare that the contents of this form are true and correct and that I am the person as stated above. <span style={{color:'#F26522'}}>*</span>
              </span>
            </label>
            {errors.declarationTruth && (
              <span className="error-message">{errors.declarationTruth}</span>
            )}

            <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
              <input
                type="checkbox"
                name="declarationPrivacy"
                checked={formData.declarationPrivacy}
                onChange={handleChange}
                style={{width:14,height:14,marginTop:3,flexShrink:0,cursor:'pointer'}}
              />
              <span style={{fontSize:16,lineHeight:'24px',color:'#0b1220'}}>
                I have read the Personal Information Collection Notice before providing my personal information and agree to the below terms: <span style={{color:'#F26522'}}>*</span>
                <br />
                The Law Society of New South Wales respects your privacy and the confidentiality and security of personal information provided by you to us. The information provided by you to the Law Society on this form will be used by the Law Society for the purposes of communicating with you in relation to our regulatory functions with our{' '}
                <a href="https://www.lawsociety.com.au/Privacy-Policy/Personal-Information-Collection-Notice" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>
                  Personal Information Collection Notice
                </a>.

              </span>
            </label>
            {errors.declarationPrivacy && (
              <span className="error-message">{errors.declarationPrivacy}</span>
            )}
          </div>

          <div className="section-divider" />

          {(attachmentLimitError || submitError) && (
            <div className="submit-error-banner">
              <strong>Error:</strong> {attachmentLimitError || submitError}
            </div>
          )}

          {isSubmitting && (
            <div className="submit-processing-banner">
              <strong>Processing:</strong> Uploading attachments and preparing your submission...
            </div>
          )}

          <Footer 
            variant="registry"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isSubmitDisabled={Boolean(attachmentLimitError)}
          />
        </section>
      </main>
    </div>
  );
}

export default CertificateOfFitnessForm;
