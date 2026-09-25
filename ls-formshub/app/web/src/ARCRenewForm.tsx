import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import './components/components.css';
import Header from './components/Header';
import Footer from './components/Footer';
import FormErrorSummary, { FormErrorSummaryItem } from './components/FormErrorSummary';
import InstructionsSection from './components/InstructionsSection';
import ARCRenewYourDetailsSection from './components/ARCRenewYourDetailsSection';
import ARCRenewIntentSection from './components/ARCRenewIntentSection';
import PracticeDetailsSection from './components/PracticeDetailsSection';
import OtherAddressDetailsSection from './components/OtherAddressDetailsSection';
import AddressDetailsSection from './components/AddressDetailsSection';
import ARCFitAndProperSection from './components/ARCFitAndProperSection';
import ARCNewShowCauseSection from './components/ARCNewShowCauseSection';
import ARCNewProfIndemnitySection, { ARCNewProfIndemnitySectionHandle } from './components/ARCNewProfIndemnitySection';
import ARCRenewDeclarationSection from './components/ARCRenewDeclarationSection';
import ARCRenewSupportingDocumentsSection from './components/ARCRenewSupportingDocumentsSection';
import ARCRenewNotesSection from './components/ARCRenewNotesSection';
import apiService, { StripeLineItem } from './services/apiService';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useAuthPrefill } from './hooks/useAuthPrefill';
import { getEmailValidationError, getTotalAttachmentLimitError } from './utils/validation';
import { getCheckoutUrlOrThrow } from './utils/submission';
import { getValidationSummary, focusFieldByName as focusSummaryField } from './utils/formErrorSummary';
import { FORM_TYPES, FORM_TYPES_SHORT } from './constants/formTypes';
import { FORM_NAMES } from './constants/formNames';

function ARCRenewForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    otherName: '',
    title: '',
    titleOther: '',
    gender: '',
    dateOfBirth: '',
    placeOfBirth: '',
    countryOfBirth: '',
    personalEmail: '',
    personalMobile: '',
    lawID: '',
    // Section 1 - Your Details
    currentRegCertificateType: '',
    foreignLawJurisdictions: '',
    intentToRenew: '',
    notRenewAcknowledged: '',
    streetNumber: '',
    city: '',
    state: '',
    country: '',
    postcode: '',
    dl: '',
    telephone: '',
    emailAddress: '',
    // Section 2 - Admission Details
    stateOfAdmission: '',
    dateOfAdmission: '',
    admissionCondition: '',
    admissionConditionDetails: '',
    certificateAttachment: '',
    supportingDocsAttachment: '',
    // Section 3 - Eligibility
    principalPlace: '',
    foreignJurisdiction: '',
    // Section C - Practice Details
    lawPracticeEmployer: '',
    commencePracticeDate: `01/07/${(() => { const now = new Date(); return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear(); })()}`,
    officeStreet: '',
    officeStreet2: '',
    officeCity: '',
    officeState: '',
    officeCountry: '',
    officePostcode: '',
    practicePublicEmail: '',
    communicationEmail: '',
    // Section 5 - Address Details
    residentialStreet: '',
    residentialStreet2: '',
    residentialCity: '',
    residentialState: '',
    residentialCountry: '',
    residentialPostcode: '',
    serviceStreet: '',
    serviceSuburb: '',
    serviceState: '',
    serviceCountry: '',
    servicePostcode: '',
    // Section 6 - Other Places of Practice
    multipleEntities: '',
    otherLawPracticeEmployer: '',
    otherStreetNumberName: '',
    otherSuburb: '',
    otherState: '',
    otherCountry: '',
    otherPostcode: '',
    // Section 9 - Fit and Proper Person
    fitAndProper: '',
    fitAndProperAttachment: '',
    // Section 10 - Show Cause Events
    showCause: '',
    showCauseAttachment: '',
    // Section 11 - Current or Previous Certificate
    heldNSWCertificate: '',
    nswCertificateDetails: '',
    currentAustralianCertificate: '',
    currentAustralianCertificateDetails: '',
    heldOtherAustralianCertificate: '',
    otherAustralianCertificateDetails: '',
    heldForeignCertificate: '',
    foreignCertificateDetails: '',
    // Section 9.5 - Associate Membership
    associateMember: '',
    // Section 12 - Declaration
    // Section D - Address for Service / Postal
    addressForService: '',
    preferredPostalAddress: '',
    // Section E - Form of Practice
    formOfPractice: '',
    formOfPracticeOther: '',
    // Section H - PII
    pii1: '',
    pii2: '',
    pii3: '',
    pii4: '',
    piiUndertaking: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    surname: '',
    title: '',
    titleOther: '',
    gender: '',
    dateOfBirth: '',
    placeOfBirth: '',
    countryOfBirth: '',
    personalEmail: '',
    practicePublicEmail: '',
    communicationEmail: '',
    personalMobile: '',
    // Section A
    currentRegCertificateType: '',
    foreignLawJurisdictions: '',
    intentToRenew: '',
    // Section D - address details
    residentialStreet: '',
    residentialStreet2: '',
    residentialCity: '',
    residentialState: '',
    residentialCountry: '',
    residentialPostcode: '',
    // Section F/G - Fit and Proper / Show Cause
    fitAndProper: '',
    fitAndProperAttachment: '',
    showCause: '',
    showCauseAttachment: '',
    associateMember: '',
    supportingDocsAttachment: '',
    supportingCurrentEvidenceOfRegistration: '',
    supportingCurrentCertificateOfFitness: '',
    // Section 12
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentLimitError, setAttachmentLimitError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<FormErrorSummaryItem[]>([]);
  const [feeData, setFeeData] = useState<{ feePc: number; feeFidelity: number; feeSm: number; feeAmount: number; logic: string } | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const { lawSocietyId: authenticatedLawSocietyId, email: userEmail, name: userName, firstName: authFirstName, surname: authSurname, otherName: authOtherName } = useAuthenticatedUser();

  // Fetch fee whenever effective date, form of practice, country, or AM changes
  useEffect(() => {
    const rawDate = (formData as any).commencePracticeDate as string | undefined;
    const toISO = (dmy: string): string | null => {
      const parts = dmy?.split('/');
      if (!parts || parts.length !== 3 || parts[2].length !== 4) return null;
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    };
    const effectiveDate = rawDate ? toISO(rawDate) : null;
    const formOfPractice = (formData as any).formOfPractice;
    const country = formData.residentialCountry?.trim().toLowerCase() === 'australia' ? 'Australia' : 'Outside Australia';
    const am = (formData as any).associateMember === 'yes' ? 'yes' : 'No';

    if (!effectiveDate || !formOfPractice) {
      setFeeData(null);
      return;
    }

    let cancelled = false;
    setFeeLoading(true);
    apiService.getFee({ formType: FORM_TYPES.AUSTRALIAN_REGISTRATION_CERTIFICATE_RENEW, effectiveDate, formOfPractice, practiceCountry: country, AM: am })
      .then(r => { if (!cancelled) { setFeeData(r); setFeeLoading(false); } })
      .catch(() => { if (!cancelled) { setFeeData(null); setFeeLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(formData as any).commencePracticeDate, (formData as any).formOfPractice, formData.residentialCountry, (formData as any).associateMember]);

  useAuthPrefill(setFormData, {
    lawID: userEmail,
    firstName: authFirstName,
    surname: authSurname,
    otherName: authOtherName,
  });

  // State for storing actual File objects
  const [attachments, setAttachments] = useState<{
    certificateAttachment: File[] | null;
    eligibilityAttachment: File[] | null;
    fitAndProperAttachment: File[] | null;
    showCauseAttachment: File[] | null;
    supportingDocsAttachment: File[] | null;
  }>({
    certificateAttachment: null,
    eligibilityAttachment: null,
    fitAndProperAttachment: null,
    showCauseAttachment: null,
    supportingDocsAttachment: null,
  });

  useEffect(() => {
    const nextAttachmentLimitError = getTotalAttachmentLimitError(attachments);
    setAttachmentLimitError(nextAttachmentLimitError);
    if (!nextAttachmentLimitError && submitError?.startsWith('Exceeded attachment size')) {
      setSubmitError(null);
    }
  }, [attachments, submitError]);

  const handleFileSelect = (fieldName: string, files: File[] | null) => {
    setAttachments(prev => ({ ...prev, [fieldName]: files }));
    setFormData(prev => ({ ...prev, [fieldName]: files ? files.map(f => f.name).join(', ') : '' }));
    if (files && errors[fieldName as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
      setValidationSummary(prev => prev.filter(item => item.field !== fieldName));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Map for radio button options
    const radioTextMap: Record<string, Record<string, string>> = {
      'principalPlace': {
        'nsw': 'In New South Wales',
        'outside': 'Outside New South Wales (within Australia or in a foreign jurisdiction)',
      },
      'intendedPosition': {
        'sole': 'Sole practitioner',
        'supervising': 'Principal of a community legal service',
        'government': 'Government legal practitioner',
        'partner': 'Partner in a law firm',
        'employee': 'Employee of a law practice',
        'notEngaged': 'Not engaged in legal practice',
        'llpPrincipal': 'Principal of an incorporated legal practice',
        'corporate': 'Corporate legal practitioner',
      },
      'otherPositionHeld': {
        'sole': 'Sole practitioner',
        'partner': 'Partner in a law firm',
        'llpPrincipal': 'Principal of an incorporated legal practice',
        'supervising': 'Principal of a community legal service',
        'employee': 'Employee of a law practice',
        'corporate': 'Corporate legal practitioner',
        'government': 'Government legal practitioner',
      },
    };
    
    const target = e.target as HTMLInputElement;
    const updates: any = { [name]: type === 'checkbox' ? (target.checked ? 'yes' : '') : value };
    
    // Add text field for radio buttons
    if (type === 'radio') {
      if (value === 'yes' || value === 'no') {
        updates[`${name}Text`] = value === 'yes' ? 'Yes' : 'No';
      } else if (radioTextMap[name] && radioTextMap[name][value]) {
        updates[`${name}Text`] = radioTextMap[name][value];
      }
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
      setValidationSummary(prev => prev.filter(item => item.field !== name));
    }
  };

  const resolveSummaryFieldFallback = (fieldName: string): Element | null => {
    const supportingDocsErrorKeys = [
      'supportingDocsAttachment',
      'supportingCurrentEvidenceOfRegistration',
      'supportingCurrentCertificateOfFitness',
    ];

    if (supportingDocsErrorKeys.includes(fieldName)) {
      return document.getElementById('supporting-documents-section');
    }
    return null;
  };

  const handleBlur = (fieldName: string, value: string) => {
    let errorMessage = '';

    // Date field validation
    if (fieldName === 'dateOfBirth' || fieldName === 'dateOfAdmission') {
      if (!value.trim()) {
        errorMessage = fieldName === 'dateOfBirth' ? 'Date of birth is required' :
                       'Date of admission is required';
      }
    }
    // Section 1 - Applicant Details
    else if (fieldName === 'firstName' && !value.trim()) errorMessage = 'First name is required';
    else if (fieldName === 'surname' && !value.trim()) errorMessage = 'Surname is required';
    else if (fieldName === 'title' && !value.trim()) errorMessage = 'Title is required';
    else if (fieldName === 'titleOther' && !value.trim()) errorMessage = 'Please specify title';
    else if (fieldName === 'gender' && !value.trim()) errorMessage = 'Gender is required';
    else if (fieldName === 'placeOfBirth' && !value.trim()) errorMessage = 'Place of birth is required';
    else if (fieldName === 'countryOfBirth' && !value.trim()) errorMessage = 'Country of birth is required';
    else if (fieldName === 'personalEmail' && !value.trim()) errorMessage = 'Personal email is required';
    else if (fieldName === 'communicationEmail') errorMessage = getEmailValidationError(value);
    else if (fieldName === 'practicePublicEmail') errorMessage = getEmailValidationError(value);
    else if (fieldName === 'personalMobile' && !value.trim()) errorMessage = 'Personal mobile is required';
    
    // Section 2 - Admission Details
    else if (fieldName === 'stateOfAdmission' && !value.trim()) errorMessage = 'State or Territory of admission is required';
    else if (fieldName === 'admissionCondition' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'admissionConditionDetails' && !value.trim()) errorMessage = 'Please provide details';
    else if (fieldName === 'certificateAttachment' && !value.trim()) errorMessage = 'Certificate attachment is required';
    
    // Section 3 - Eligibility
    else if (fieldName === 'principalPlace' && !value.trim()) errorMessage = 'Principal place of practice is required';
    else if (fieldName === 'foreignJurisdiction' && !value.trim()) errorMessage = 'Please specify foreign jurisdiction';
    
    // Section 5 - Address Details
    else if (fieldName === 'residentialStreet' && !value.trim()) errorMessage = 'Street address is required';
    else if (fieldName === 'residentialCity' && !value.trim()) errorMessage = 'City is required';
    else if (fieldName === 'residentialState' && !value.trim()) errorMessage = 'State is required';
    else if (fieldName === 'residentialCountry' && !value.trim()) errorMessage = 'Country is required';
    else if (fieldName === 'residentialPostcode' && !value.trim()) errorMessage = 'Postcode is required';
    else if (fieldName === 'serviceStreet' && !value.trim()) errorMessage = 'Street number and name is required';
    else if (fieldName === 'serviceSuburb' && !value.trim()) errorMessage = 'Suburb is required';
    else if (fieldName === 'serviceState' && !value.trim()) errorMessage = 'State is required';
    else if (fieldName === 'serviceCountry' && !value.trim()) errorMessage = 'Country is required';
    else if (fieldName === 'servicePostcode' && !value.trim()) errorMessage = 'Postcode is required';
    
    // Section 6 - Other Places of Practice
    else if (fieldName === 'multipleEntities' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'commencePracticeDate' && !value.trim()) errorMessage = 'Date is required';
    else if (fieldName === 'otherLawPracticeEmployer' && !value.trim()) errorMessage = 'Law practice/employer name is required';
    else if (fieldName === 'otherStreetNumberName' && !value.trim()) errorMessage = 'Street number and name is required';
    else if (fieldName === 'otherSuburb' && !value.trim()) errorMessage = 'Suburb is required';
    else if (fieldName === 'otherState' && !value.trim()) errorMessage = 'State is required';
    else if (fieldName === 'otherCountry' && !value.trim()) errorMessage = 'Country is required';
    else if (fieldName === 'otherPostcode' && !value.trim()) errorMessage = 'Postcode is required';
    
    // Section 9 - Fit and Proper Person
    else if (fieldName === 'fitAndProper' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'fitAndProperAttachment' && !value.trim()) errorMessage = 'Statement attachment is required';
    
    // Section 10 - Show Cause Events
    else if (fieldName === 'showCause' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'showCauseAttachment' && !value.trim()) errorMessage = 'Show cause form is required';
    
    // Section 11 - Current or Previous Certificate
    else if (fieldName === 'heldNSWCertificate' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'nswCertificateDetails' && !value.trim()) errorMessage = 'Details are required';
    else if (fieldName === 'currentAustralianCertificate' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'currentAustralianCertificateDetails' && !value.trim()) errorMessage = 'Details are required';
    else if (fieldName === 'heldOtherAustralianCertificate' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'otherAustralianCertificateDetails' && !value.trim()) errorMessage = 'Details are required';
    else if (fieldName === 'heldForeignCertificate' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'foreignCertificateDetails' && !value.trim()) errorMessage = 'Details are required';
    
    setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
  };


  const [declarationChecks, setDeclarationChecks] = React.useState<boolean[]>([false, false, false, false, false]);
  const [declarationErrors, setDeclarationErrors] = React.useState<string[]>(['', '', '', '', '']);

  const piiRef = useRef<ARCNewProfIndemnitySectionHandle>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    setSubmitError(null);
    setValidationSummary([]);

    const currentAttachmentLimitError = getTotalAttachmentLimitError(attachments);
    if (currentAttachmentLimitError) {
      setSubmitError(currentAttachmentLimitError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Reset all errors before revalidating so stale errors from previous attempts don't persist
    const newErrors = Object.fromEntries(Object.keys(errors).map(k => [k, ''])) as typeof errors;

    // Section A - Your Details (fields rendered in ARCRenewYourDetailsSection)
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.currentRegCertificateType.trim()) newErrors.currentRegCertificateType = 'Current registration certificate type is required';
    if (!formData.foreignLawJurisdictions.trim()) newErrors.foreignLawJurisdictions = 'Foreign jurisdiction/s is required';
    newErrors.communicationEmail = getEmailValidationError(formData.communicationEmail || '');
    newErrors.practicePublicEmail = getEmailValidationError(formData.practicePublicEmail || '');

    // Section D - Other Address Details (residential address rendered in OtherAddressDetailsSection)
    let hasDeclarationErrors = false;
    let piiValid = true;

    if (!formData.intentToRenew.trim()) newErrors.intentToRenew = 'Please select an option';

    if (formData.intentToRenew === 'yes') {
      if (!formData.residentialStreet.trim()) newErrors.residentialStreet = 'Street address is required';
      if (!formData.residentialCity.trim()) newErrors.residentialCity = 'City is required';
      if (!formData.residentialState.trim()) newErrors.residentialState = 'State is required';
      if (!formData.residentialCountry.trim()) newErrors.residentialCountry = 'Country is required';
      if (!formData.residentialPostcode.trim()) newErrors.residentialPostcode = 'Postcode is required';
      if (!(formData as any).associateMember) (newErrors as any).associateMember = 'Please select an option';

      // Section 6 - Fit and Proper Person
      if (!formData.fitAndProper.trim()) newErrors.fitAndProper = 'Please select an option';
      if (formData.fitAndProper === 'yes' && !formData.fitAndProperAttachment.trim()) newErrors.fitAndProperAttachment = 'Statement attachment is required';

      // Section 7 - Show Cause Events
      if (!formData.showCause.trim()) newErrors.showCause = 'Please select an option';
      if (formData.showCause === 'yes' && !formData.showCauseAttachment.trim()) newErrors.showCauseAttachment = 'Show cause form is required';

      // Section 9 - Supporting Documents (at least one checklist item must be confirmed)
      const hasCurrentEvidenceOfRegistration = (formData as any).supportingCurrentEvidenceOfRegistration === 'yes';
      const hasCurrentCertificateOfFitness = (formData as any).supportingCurrentCertificateOfFitness === 'yes';
      if (!hasCurrentEvidenceOfRegistration && !hasCurrentCertificateOfFitness) {
        const checklistError = 'Please confirm at least one supporting document has been provided';
        (newErrors as any).supportingCurrentEvidenceOfRegistration = checklistError;
        (newErrors as any).supportingCurrentCertificateOfFitness = checklistError;
      }
      if (!formData.supportingDocsAttachment.trim()) {
        (newErrors as any).supportingDocsAttachment = 'Please attach supporting documents';
      }

      const newDeclErrors = declarationChecks.map(checked => checked ? '' : 'This declaration is required');
      setDeclarationErrors(newDeclErrors);
      hasDeclarationErrors = newDeclErrors.some(e => e !== '');
      piiValid = piiRef.current?.validate() ?? true;
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== '') || hasDeclarationErrors || !piiValid) {
      setValidationSummary(getValidationSummary(newErrors));
      const firstErrorField = Object.keys(newErrors).find(key => newErrors[key as keyof typeof newErrors] !== '');
      if (firstErrorField) {
        focusSummaryField(firstErrorField, resolveSummaryFieldFallback);
      } else if (hasDeclarationErrors) {
        const declEl = document.getElementById('declaration-section');
        if (declEl) declEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (!piiValid) {
        const piiEl = document.getElementById('pii-section');
        if (piiEl) piiEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setValidationSummary([]);

    // Prepare form data for submission
    // Read PII values directly from the component's internal state via ref
    // (more reliable than depending on onChange events populating formData)
    const piiValues = piiRef.current?.getValues() ?? { q1: '', q2: '', q4: '', undertaking: false };
    const hasCurrentEvidenceOfRegistration = (formData as any).supportingCurrentEvidenceOfRegistration === 'yes';
    const hasCurrentCertificateOfFitness = (formData as any).supportingCurrentCertificateOfFitness === 'yes';

    const formType = FORM_TYPES.AUSTRALIAN_REGISTRATION_CERTIFICATE_RENEW;
    const formTypeShort = FORM_TYPES_SHORT.AUSTRALIAN_REGISTRATION_CERTIFICATE_RENEW;
    const submissionData = {
      formType,
      applicantDetails: {
        firstName: formData.firstName || '',
        surname: formData.surname || '',
        otherName: formData.otherName || '',
        dateOfBirth: formData.dateOfBirth || '',
        currentRegistrationCertificateType: formData.currentRegCertificateType || '',
        foreignJurisdictions: formData.foreignLawJurisdictions || '',
      },
      intentToRenew: {
          doYouWishToRenew: formData.intentToRenew === 'yes' ? 'Yes' : formData.intentToRenew === 'no' ? 'No' : '',
        ...((formData as any).notRenewAcknowledged ? { notRenewAcknowledged: 'I acknowledge that I do not wish to renew my registration certificate and will submit this form to notify the Law Society.' } : {}),
      },
      ...(formData.intentToRenew === 'yes' ? {
      principalPlaceOfPractice: {
        ...((formData as any).nswPrincipalPlaceYesNo ? { nswWillBePrincipalPlace: (formData as any).nswPrincipalPlaceYesNo === 'yes' ? 'Yes' : 'No' } : {}),
        ...((formData as any).nswPrincipalPlaceYesNo === 'no' && (formData as any).principalJurisdiction ? { principalJurisdictionName: (formData as any).principalJurisdiction } : {}),
        ...(formData.lawPracticeEmployer ? { nameOfLawPracticeOrEmployer: formData.lawPracticeEmployer } : {}),
        ...(formData.commencePracticeDate ? { dateIntendedToCommence: formData.commencePracticeDate } : {}),
        ...(formData.officeStreet ? { streetAddress: formData.officeStreet } : {}),
        ...(formData.officeStreet2 ? { streetAddress2: formData.officeStreet2 } : {}),
        ...(formData.officeCity ? { city: formData.officeCity } : {}),
        ...(formData.officeState ? { state: formData.officeState } : {}),
        ...(formData.officeCountry ? { country: formData.officeCountry } : {}),
        ...(formData.officePostcode ? { postcode: formData.officePostcode } : {}),
        ...(formData.communicationEmail ? { communicationEmail: formData.communicationEmail } : {}),
        ...(formData.practicePublicEmail ? { publicEmail: formData.practicePublicEmail } : {}),
      },
      residentialAddress: {
        ...(formData.residentialStreet ? { streetAddress: formData.residentialStreet } : {}),
        ...(formData.residentialStreet2 ? { streetAddress2: formData.residentialStreet2 } : {}),
        ...(formData.residentialCity ? { city: formData.residentialCity } : {}),
        ...(formData.residentialState ? { state: formData.residentialState } : {}),
        ...(formData.residentialCountry ? { country: formData.residentialCountry } : {}),
        ...(formData.residentialPostcode ? { postcode: formData.residentialPostcode } : {}),
        ...((formData as any).addressForService ? {
          addressForService: (formData as any).addressForService === 'practice' ? 'Place of practice' :
            (formData as any).addressForService === 'residential' ? 'Residential' : 'Other (specify)',
          ...((formData as any).addressForService === 'other' ? {
            addressForServiceOtherStreet: (formData as any).serviceOtherStreet || '',
            ...((formData as any).serviceOtherStreet2 ? { addressForServiceOtherStreet2: (formData as any).serviceOtherStreet2 } : {}),
            addressForServiceOtherCity: (formData as any).serviceOtherCity || '',
            addressForServiceOtherState: (formData as any).serviceOtherState || '',
            addressForServiceOtherCountry: (formData as any).serviceOtherCountry || '',
            addressForServiceOtherPostcode: (formData as any).serviceOtherPostcode || '',
          } : {}),
        } : {}),
        ...((formData as any).preferredPostalAddress ? {
          preferredPostalAddress: (formData as any).preferredPostalAddress === 'practice' ? 'Place of practice' :
            (formData as any).preferredPostalAddress === 'residential' ? 'Residential' :
            (formData as any).preferredPostalAddress === 'addressForService' ? 'Address for service' : 'Other/PO Box (specify)',
          ...((formData as any).preferredPostalAddress === 'other' ? {
            preferredPostalOtherStreet: (formData as any).postalOtherStreet || '',
            ...((formData as any).postalOtherStreet2 ? { preferredPostalOtherStreet2: (formData as any).postalOtherStreet2 } : {}),
            preferredPostalOtherCity: (formData as any).postalOtherCity || '',
            preferredPostalOtherState: (formData as any).postalOtherState || '',
            preferredPostalOtherCountry: (formData as any).postalOtherCountry || '',
            preferredPostalOtherPostcode: (formData as any).postalOtherPostcode || '',
          } : {}),
        } : {}),
      },
      formOfPracticeSection: {
        ...((formData as any).formOfPractice ? {
          formOfPractice:
            (formData as any).formOfPractice === 'sole' ? "On the foreign lawyer's own account" :
            (formData as any).formOfPractice === 'partnership' ? 'As a partner in a law firm, as defined in the legal profession legislation' :
            (formData as any).formOfPractice === 'volunteer' ? 'In a partnership with one or more Australian-registered foreign lawyers in circumstances where, if the Australian-registered foreign lawyer were an Australian legal practitioner, the partnership would be permitted under a law of this jurisdiction' :
            (formData as any).formOfPractice === 'volunteer_probono' ? 'As a volunteer at a community legal service or otherwise on a pro bono basis' :
            (formData as any).formOfPractice === 'incorporated' ? 'As a partner, director, officer or employee of an incorporated legal practice or unincorporated legal practice' :
            (formData as any).formOfPractice === 'employee' ? 'As an employee of a law practice, as defined in the legal profession legislation' :
            (formData as any).formOfPractice === 'employeeARFL' ? 'As an employee of an Australian-registered foreign lawyer' :
            'Other (specify)',
          ...((formData as any).formOfPractice === 'other' && (formData as any).formOfPracticeOther ? {
            formOfPracticeSpecify: (formData as any).formOfPracticeOther,
          } : {}),
        } : {}),
      },
      fitAndProperPerson: {
        isThereAnyFitAndProperMatter: formData.fitAndProper === 'yes' ? 'Yes' : formData.fitAndProper === 'no' ? 'No' : '',
      },
      showCauseEvents: {
        isThereAnyShowCauseMatter: formData.showCause === 'yes' ? 'Yes' : formData.showCause === 'no' ? 'No' : '',
      },
      professionalIndemnityInsurance: {
        doYouHoldPii: piiValues.q1 === 'yes' ? 'Yes' : piiValues.q1 === 'no' ? 'No' : '',
        ...(piiValues.q1 === 'yes' ? { coveredByAustralianPolicy: piiValues.q2 === 'yes' ? 'Yes' : piiValues.q2 === 'no' ? 'No' : '' } : {}),
        ...(piiValues.q1 === 'yes' && piiValues.q2 === 'no' ? { coveredByForeignPolicy: piiValues.q4 === 'yes' ? 'Yes' : piiValues.q4 === 'no' ? 'No' : '' } : {}),
        ...(piiValues.undertaking ? { undertakingConfirmed: true, undertakingConfirmedText: 'I am the applicant named in this form and undertake to provide a disclosure statement in writing to each client (Note D)' } : {}),
      },
      supportingDocuments: {
        ...(hasCurrentEvidenceOfRegistration ? {
          currentEvidenceOfRegistration: true,
          currentEvidenceOfRegistrationText: 'Current evidence of your registration(s) outside Australia',
        } : {}),
        ...(hasCurrentCertificateOfFitness ? {
          currentCertificateOfFitness: true,
          currentCertificateOfFitnessText: 'A current certificate of fitness or good standing from all relevant foreign authorities',
        } : {}),
      },
      associateMembership: {
        wouldYouLikeToBeAnAssociateMember: (formData as any).associateMember === 'yes' ? 'Yes' : 'No',
      },
      declaration: {
        intendToEngageInPractice: declarationChecks[0],
        intendToEngageInPracticeText: 'I intend to engage in legal practice in New South Wales within a reasonable period after registration.',
        notAwareOfAnyMatterAffectingFitness: declarationChecks[1],
        notAwareOfAnyMatterAffectingFitnessText: 'I am not aware of any matter referred to section 62(3) of the Legal Profession Uniform Law (NSW) and rules 20 and 21 of the Legal Profession Uniform General Rules 2015 or any Show Cause event within the meaning of sections 87 and 88 of the Legal Profession Uniform Law (NSW) which would affect my fitness to hold a registration certificate, other than that which is disclosed above and in respect of which I have provided a statement, or which I have previously disclosed.',
        registrationNotCancelledOrSuspended: declarationChecks[2],
        registrationNotCancelledOrSuspendedText: 'My registration or authorisation is not cancelled or currently suspended in any place as a result of disciplinary action.',
        notProhibitedFromPractice: declarationChecks[3],
        notProhibitedFromPracticeText: 'I am not otherwise personally prohibited from engaging in legal practice in any place or bound by any undertaking not to engage in legal practice in any place as a result of criminal, civil or disciplinary proceedings in any place.',
        picNoticeAcknowledged: declarationChecks[4],
        picNoticeAcknowledgedText: 'I have read the Personal Information Collection Notice before providing my personal information and agree to the terms.',
      },
      } : {}),
      submittedAt: new Date().toISOString().replace('Z', '+00:00')
    };

    try {
      setIsSubmitting(true);
      const formName = FORM_NAMES.AUSTRALIAN_REGISTRATION_CERTIFICATE_RENEW;
      const price = formData.intentToRenew === 'no' ? 0 : (feeData ? feeData.feeAmount : 500);
      const isAustralia = formData.residentialCountry?.trim().toLowerCase() === 'australia';
      const isAssociateMember = formData.associateMember === 'yes';
      const feeSm = feeData ? feeData.feeSm : ((isAssociateMember && isAustralia) ? 330 : 0);
      const smLogic = feeData ? (feeData.logic ?? '') : (isAssociateMember && isAustralia ? 'Associate Membership AU (incl. GST)' : 'No GST');

      const lawSocietyId = authenticatedLawSocietyId || formData.lawID || '';
      console.log('Using LawID for submission:', lawSocietyId);

      const { submissionId, blobUrls } = await apiService.uploadAllAttachments(
        formType,
        lawSocietyId,
        formTypeShort,
        attachments
      );
      
      console.log('Files uploaded successfully. Blob URLs:', blobUrls);
      console.log('Submission ID from backend (Australian time):', submissionId);

      const fieldLabels: Record<string, string> = {
        firstName: 'First Name',
        surname: 'Surname',
        otherName: 'Middle/Other Names',
        dateOfBirth: 'Date of Birth',
        currentRegistrationCertificateType: 'Current Registration Certificate Type',
        foreignJurisdictions: 'Place of foreign jurisdiction/s where you are entitled to practise',
        doYouWishToRenew: 'Do you wish to renew your registration certificate?',
        nswWillBePrincipalPlace: 'Do you intend that NSW will be your principal place of practice in Australia?',
        principalJurisdictionName: 'Provide the name of the jurisdiction you intend to be your principal place of practice',
        nameOfLawPracticeOrEmployer: 'Name of law practice/employer',
        dateIntendedToCommence: 'Effective date of your certificate',
        streetAddress: 'Street Address',
        streetAddress2: 'Street Address Line 2',
        city: 'City',
        state: 'State',
        country: 'Country',
        postcode: 'Postcode',
        publicEmail: 'Email address (public)',
        communicationEmail: 'Communication email address for the Law Society',
        isThereAnyFitAndProperMatter: 'Is there any matter referred to in section 62(3) of the Legal Profession Uniform Law and rules 20 and 21 applicable to you?',
        isThereAnyShowCauseMatter: 'Is there any matter referred to in sections 87 and 88 of the Legal Profession Uniform Law (NSW) applicable to you?',
        addressForService: 'Address for service (must be a street address)',
        preferredPostalAddress: 'Preferred postal address',
        formOfPractice: 'Form of practice: Please indicate',
        formOfPracticeSpecify: 'Please specify',
        doYouHoldPii: '1. Do you hold or are you covered by an approved professional indemnity insurance policy that covers your practice of foreign law in New South Wales?',
        coveredByAustralianPolicy: '2. Do you hold or are you covered by an approved insurance policy issued by an Australian jurisdiction?',
        coveredByForeignPolicy: '3. Do you hold or are you covered by an insurance policy issued by a foreign jurisdiction?',
        currentEvidenceOfRegistration: 'Current evidence of your registration(s) outside Australia provided',
        currentCertificateOfFitness: 'Current certificate of fitness or good standing provided',
        wouldYouLikeToBeAnAssociateMember: 'Would you like to be an Associate member of the Law Society?',
        intendToEngageInPractice: 'I intend to engage in legal practice in New South Wales within a reasonable period after registration.',
        notAwareOfAnyMatterAffectingFitness: 'I am not aware of any matter referred to section 62(3) of the Legal Profession Uniform Law (NSW) and rules 20 and 21 of the Legal Profession Uniform General Rules 2015 or any Show Cause event within the meaning of sections 87 and 88 of the Legal Profession Uniform Law (NSW) which would affect my fitness to hold a registration certificate, other than that which is disclosed above and in respect of which I have provided a statement, or which I have previously disclosed.',
        registrationNotCancelledOrSuspended: 'My registration or authorisation is not cancelled or currently suspended in any place as a result of disciplinary action.',
        notProhibitedFromPractice: 'I am not otherwise personally prohibited from engaging in legal practice in any place or bound by any undertaking not to engage in legal practice in any place as a result of criminal, civil or disciplinary proceedings in any place.',
        picNoticeAcknowledged: 'I have read the Personal Information Collection Notice before providing my personal information and agree to the terms.',
        notAnAustralianLegalPractitioner: 'Declaration',
      };

      const sectionLabels: Record<string, string> = {
        applicantDetails: '1. Your Details',
        intentToRenew: '2. Intent to Renew',
        principalPlaceOfPractice: '3. Principal Place of Practice in Australia',
        residentialAddress: '4. Other Address Details',
        formOfPracticeSection: '5. Details of form of principal place of practice in Australia',
        fitAndProperPerson: '6. Fit and Proper Person',
        showCauseEvents: '7. Show Cause Events',
        professionalIndemnityInsurance: '8. Professional Indemnity Insurance',
        supportingDocuments: '9. Supporting Documents',
        associateMembership: '10. Associate Membership',
        declaration: '11. Declaration',
        fee: '12. Fee',
      };

      const lineItems: StripeLineItem[] = [];
      if ((feeData?.feeFidelity ?? 0) > 0)
        lineItems.push({ name: 'Fidelity Fund', amountCents: Math.round((feeData!.feeFidelity) * 100), hasGst: false });
      if ((feeData?.feePc ?? 0) > 0)
        lineItems.push({ name: 'Foreign Lawyer', amountCents: Math.round((feeData!.feePc) * 100), hasGst: false });
      if (feeSm > 0) {
        const smName = (smLogic?.includes('Associate') || smLogic?.includes('AM')) ? 'Associate Membership' : 'Solicitor Membership';
        lineItems.push({ name: smName, amountCents: Math.round(feeSm * 100), hasGst: !smLogic?.includes('No GST') });
      }

      if (price === 0) {
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
            businessUnit: '1000',
            sku: '80910',
            receiptCategory: 'registry'
          },
          fieldLabels,
          sectionLabels,
          feeSm,
          smLogic,
          lineItems
        );
        console.log('Form submitted successfully (no renewal - no payment required)');
        window.location.href = `/submission-success?free=true&formType=${formType}`;
      } else {
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
            businessUnit: '1000',
            sku: '80910',
            receiptCategory: 'registry'
          },
          fieldLabels,
          sectionLabels,
          feeSm,
          smLogic,
          lineItems
        );

        console.log('Form submitted successfully:', result);
        window.location.href = getCheckoutUrlOrThrow(result, apiService.getSafeCheckoutUrl);
      }
      
    } catch (error) {
      console.error('Error submitting form');
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="App page-root">
      <main className="form-container">
        <section className="form-card" style={{ padding: '22px 32px 80px 32px' }}>
          <Header 
            title={"Application for Renewal of an Australian Registration Certificate as a Foreign Lawyer in New South Wales"} 
            subtitle={<>Applications for registration certificates in New South Wales are made in accordance with the legal profession legislation (as defined in the <em style={{ fontStyle: 'italic' }}>Legal Profession Uniform Law Application Act 2014</em>)</>} 
          />

          <FormErrorSummary
            items={validationSummary}
            onSelect={(field) => focusSummaryField(field, resolveSummaryFieldFallback)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 24, marginBottom: 16 }}>
            <InstructionsSection items={[
              "To be completed by a foreign lawyer who wishes to renew their registration certificate to practise foreign law as an Australian-registered foreign lawyer in this jurisdiction.",
              "Please ensure that you read the explanatory notes before completing this application.",
              <>Please ensure that you read the <a href="https://www.lawsociety.com.au/privacy-policy/personal-information-collection-notice" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>personal information collection notice</a> before completing this application.</>
            ]} />
            <div>
              <p style={{ display: 'inline-block', fontSize: 16, fontWeight: 700, color: '#0b1220', marginBottom: 12, border: '2px solid #0b1220', padding: '6px 14px', borderRadius: 3, background: 'transparent' }}>DUE DATE: 30 JUNE {(() => { const now = new Date(); return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear(); })()}</p>
              <p style={{ fontSize: 16, color: '#0b1220', lineHeight: '24px', margin: 0 }}>We need to know your details (as they will be at 1 July {(() => { const now = new Date(); return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear(); })()}). If your details have changed, list any changes and the date the change is to be effective.</p>
            </div>
          </div>

          <div className="section-divider" />

          <ARCRenewYourDetailsSection
            formData={formData}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
            readOnlyFields={{ lawID: !!authenticatedLawSocietyId, firstName: !!authFirstName, surname: !!authSurname }}
          />

          <div className="section-divider" />

          <ARCRenewIntentSection
            formData={formData}
            errors={errors}
            onChange={handleChange}
          />

          {formData.intentToRenew === 'no' && (
            <>
              <div className="section-divider" />
              <div style={{marginTop:16,marginBottom:16,padding:'16px 20px',backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220'}}>
                <strong>NOTE:</strong> You have indicated that you do not wish to renew your registration certificate. You will cease to hold an Australian registration certificate at the end of the current financial year.
              </div>
            </>
          )}

          {formData.intentToRenew === 'yes' && (
            <>
          <div className="section-divider" />

          <PracticeDetailsSection
            sectionTitle="3. Details of Principal Place of Practice in Australia"
            formData={formData}
            errors={errors}
            onChange={handleChange as any}
            onBlur={handleBlur}
            hidePublicEmailNote
            publicEmailOptional
            commencePracticeDateDisabled
          />

          <div className="section-divider" />

          <OtherAddressDetailsSection sectionTitle="4. Other Address Details" formData={formData} errors={errors} onChange={handleChange as any} onBlur={handleBlur} />

          <div className="section-divider" />

          <AddressDetailsSection
            sectionTitle="5. Details of form of principal place of practice in Australia"
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
            showFormOfPractice
            hideFormOfPracticeNumber
            hideFormOfPracticeText
            formOfPracticeNote="A"
          />

          <div className="section-divider" />

          <div id="fitAndProperAttachment">
            <ARCFitAndProperSection
              sectionTitle="6. Fit and Proper Person"
              errors={{ fitAndProper: errors.fitAndProper, fitAndProperAttachment: errors.fitAndProperAttachment }}
              onChange={handleChange}
              onBlur={handleBlur}
              onFileSelect={handleFileSelect}
              existingFiles={attachments.fitAndProperAttachment || []}
            />
          </div>

          <div className="section-divider" />

          <div id="showCauseAttachment">
            <ARCNewShowCauseSection
              sectionTitle="7. Show Cause Events"
              errors={{ showCause: errors.showCause, showCauseAttachment: errors.showCauseAttachment }}
              onChange={handleChange}
              onBlur={handleBlur}
              onFileSelect={handleFileSelect}
              existingFiles={attachments.showCauseAttachment || []}
            />
          </div>

          <div className="section-divider" />

          <ARCNewProfIndemnitySection
            sectionTitle="8. Professional Indemnity Insurance"
            ref={piiRef}
            onChange={handleChange}
          />

          <div className="section-divider" />

          <div id="supporting-documents-section">
            <ARCRenewSupportingDocumentsSection
              sectionTitle="9. Supporting Documents"
              checklist={{
                currentEvidenceOfRegistration: (formData as any).supportingCurrentEvidenceOfRegistration === 'yes',
                currentCertificateOfFitness: (formData as any).supportingCurrentCertificateOfFitness === 'yes',
              }}
              checklistErrors={{
                currentEvidenceOfRegistration: (errors as any).supportingCurrentEvidenceOfRegistration,
                currentCertificateOfFitness: (errors as any).supportingCurrentCertificateOfFitness,
              }}
              onChecklistChange={(fieldName, checked) => {
                setFormData(prev => ({ ...prev, [fieldName]: checked ? 'yes' : '' }));
                setErrors(prev => ({
                  ...prev,
                  [fieldName]: '',
                  supportingCurrentEvidenceOfRegistration: '',
                  supportingCurrentCertificateOfFitness: '',
                }));
              }}
              onFileSelect={handleFileSelect}
              existingFiles={attachments.supportingDocsAttachment || []}
              error={(errors as any).supportingDocsAttachment}
            />
          </div>

          <div className="section-divider" />

          <div>
            <h2 className="section-title">10. Associate Membership</h2>
            <p style={{ fontSize: 16, color: '#0b1220', lineHeight: '24px', marginTop: 12 }}>
              Would you like to be an Associate member of the Law Society?
              <span style={{ color: '#F26522' }}> *</span>
            </p>
            <div style={{ display: 'flex', gap: 32, marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 16, fontWeight: 400 }}>
                <input
                  type="radio"
                  name="associateMember"
                  value="yes"
                  checked={(formData as any).associateMember === 'yes'}
                  onChange={handleChange}
                  style={{ width: 16, height: 16 }}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 16, fontWeight: 400 }}>
                <input
                  type="radio"
                  name="associateMember"
                  value="no"
                  checked={(formData as any).associateMember === 'no'}
                  onChange={handleChange}
                  style={{ width: 16, height: 16 }}
                />
                No
              </label>
            </div>
            {(errors as any).associateMember && (
              <span className="error-message">{(errors as any).associateMember}</span>
            )}
          </div>

          <div className="section-divider" />

          <ARCRenewDeclarationSection
            sectionTitle="11. Declaration"
            checked={declarationChecks}
            errors={declarationErrors}
            onChange={(i, val) => {
              setDeclarationChecks(prev => { const a = [...prev]; a[i] = val; return a; });
              setDeclarationErrors(prev => { const a = [...prev]; a[i] = ''; return a; });
            }}
          />

          <div className="section-divider" />

          {/* Fee Schedule */}
          <h2 className="section-title">12. Schedule of Fees and Payment</h2>

          <div style={{ marginTop: 12, marginBottom: 24 }}>
          {(() => {
              const fop = (formData as any).formOfPractice as string | undefined;
              const fopLabel: Record<string, string> = {
                sole:              "Foreign lawyer's own account",
                partnership:       'Foreign Lawyer Principal',
                volunteer:         'Foreign Lawyer Principal of an Australian Registered Foreign Lawyer',
                volunteer_probono: 'Volunteer',
                incorporated:      'Foreign Lawyer Employee',
                employee:          'Foreign Lawyer Employee',
                employeeARFL:      'Foreign Lawyer Employee of an Australian Registered Foreign Lawyer',
                other:             'Other',
              };
              const categoryLabel = fop ? (fopLabel[fop] ?? fop) : null;
              const smApplies = (formData as any).associateMember === 'yes' && !!feeData && feeData.feeSm > 0;
              const displayFeePc = feeData?.feePc ?? 0;
              const displayFeeFidelity = feeData?.feeFidelity ?? 0;
              const displayFeeSm = smApplies ? (feeData?.feeSm ?? 0) : 0;
              const displayTotal = smApplies ? (feeData?.feeAmount ?? 0) : (displayFeePc + displayFeeFidelity);
              const hasGst = !!feeData && feeData.logic?.includes('GST');
              return (
                <div style={{ marginTop: 24 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: 'calc(100% - 30px)', borderCollapse: 'collapse', fontSize: 14, minWidth: 560, border: '1px solid #b0a898', marginLeft: 15, marginRight: 15 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#cfc3b0' }}>
                          {[
                            { label: 'Registration Certificate Category',          align: 'left'  as const },
                            { label: 'Registration Certificate Fee',               align: 'right' as const },
                            { label: 'Fidelity Fund Contribution',                 align: 'right' as const },
                            { label: `Associate Membership Fee${hasGst ? ' (incl. GST)' : ''}`, align: 'right' as const },
                            { label: 'Total Fee',                                  align: 'right' as const },
                          ].map(col => (
                            <th key={col.label} style={{
                              textAlign: col.align, padding: '10px 14px',
                              fontWeight: 700, color: '#6b7280',
                              borderBottom: '1px solid #b0a898', whiteSpace: 'nowrap'
                            }}>{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ backgroundColor: '#F4F3EF' }}>
                          {feeLoading ? (
                            <td colSpan={5} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontStyle: 'italic' }}>
                              Calculating fees…
                            </td>
                          ) : (fop && categoryLabel) ? (
                            <>
                              <td style={{ padding: '10px 14px', textAlign: 'left', color: '#0b1220' }}>
                                {categoryLabel}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>
                                {feeData && displayFeePc > 0 ? `$${displayFeePc.toFixed(0)}` : '—'}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>
                                {feeData && displayFeeFidelity > 0 ? `$${displayFeeFidelity.toFixed(0)}` : '—'}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>
                                {smApplies ? `$${displayFeeSm.toFixed(0)}` : '—'}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>
                                {feeData ? <strong>${displayTotal.toFixed(0)}</strong> : '—'}
                              </td>
                            </>
                          ) : (
                            <td colSpan={5} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontStyle: 'italic' }}>
                              Complete form of practice, effective date and practice country above to see your fees.
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: 16, marginBottom: 8, backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '16px 20px', borderRadius: 4 }}>
                    <p style={{ fontSize: 15, lineHeight: '24px', color: '#0b1220', margin: 0 }}>
                      <strong>NOTE:</strong> Please note that the Registration Certificate Fee and Fidelity Fund Contribution do not attract GST. The Associate Membership Fee includes $30 GST ($300 when residing overseas).
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="section-divider" />
            </>
          )}

          {formData.intentToRenew !== '' && (
            <>
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
            </>
          )}

          <ARCRenewNotesSection />
        </section>
      </main>
    </div>
  );
}

export default ARCRenewForm;
