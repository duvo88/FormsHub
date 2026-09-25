import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import './components/components.css';
import Header from './components/Header';
import Footer from './components/Footer';
import FormErrorSummary, { FormErrorSummaryItem } from './components/FormErrorSummary';
import InstructionsSection from './components/InstructionsSection';
import ApplicantDetails from './components/ApplicantDetails';
import AdmissionDetailsSection from './components/AdmissionDetailsSection';
import EligibilitySection from './components/EligibilitySection';
import PracticeDetailsSection from './components/PracticeDetailsSection';
import OtherAddressDetailsSection from './components/OtherAddressDetailsSection';
import AddressDetailsSection from './components/AddressDetailsSection';
import ARCFitAndProperSection from './components/ARCFitAndProperSection';
import ARCNewShowCauseSection from './components/ARCNewShowCauseSection';
import ARCNewCurrentCertSection from './components/ARCNewCurrentCertSection';
import ARCNewProfIndemnitySection, { ARCNewProfIndemnitySectionHandle } from './components/ARCNewProfIndemnitySection';
import ARCNewDeclarationSection from './components/ARCNewDeclarationSection';
import ARCNewNotesSection from './components/ARCNewNotesSection';
import apiService, { StripeLineItem } from './services/apiService';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useAuthPrefill } from './hooks/useAuthPrefill';
import { getEmailValidationError, getTotalAttachmentLimitError } from './utils/validation';
import { getCheckoutUrlOrThrow } from './utils/submission';
import { getValidationSummary, focusFieldByName as focusSummaryField } from './utils/formErrorSummary';
import { FORM_TYPES, FORM_TYPES_SHORT } from './constants/formTypes';
import { FORM_NAMES } from './constants/formNames';

function ARCNewForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    otherName: '',
    preferredFirstName: '',
    formerNames: '',
    postNominals: '',
    title: '',
    titleOther: '',
    gender: '',
    dateOfBirth: '',
    placeOfBirth: '',
    countryOfBirth: '',
    personalEmail: '',
    foreignLawJurisdictions: '',
    lawID: '',
    streetNumber: '',
    city: '',
    state: '',
    country: '',
    postcode: '',
    dl: '',
    telephone: '',
    emailAddress: '',
    principalJurisdiction: '',
    // Section 2 - Qualifications
    eduQualification1: '',
    eduInstitution1: '',
    eduYear1: '',
    eduQualification2: '',
    eduInstitution2: '',
    eduYear2: '',
    professionalQualifications: '',
    placeOfAdmission: '',
    dateOfAdmission: '',
    
    otherJurisdictionRadio: '',
    otherJurisdictionDate: '',
    otherJurisdictionPlace: '',
    eduQualificationAttachment: '',
    proQualificationAttachment: '',
    jurisdictionAttachment: '',
    // Section 3 - Eligibility
    foreignRegistrationAuthority: '',
    foreignJurisdictions: '',
    specialCondition: '',
    specialConditionDetails: '',
    disciplinaryProceedings: '',
    disciplinaryProceedingsDetails: '',
    // Section 4 - Practice Details
    lawPracticeEmployer: '',
    officeStreet: '',
    officeStreet2: '',
    officeCity: '',
    officeState: '',
    officeCountry: '',
    officePostcode: '',
    communicationEmail: '',
    practicePublicEmail: '',
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
    addressForService: '',
    preferredPostalAddress: '',
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
    // Section 12 - PII Undertaking
    piiUndertaking: '',
    // Section 10.5 - Associate Member
    associateMember: '',
    // Section 13 - Declaration
  });

  const [declarationChecks, setDeclarationChecks] = React.useState<boolean[]>([false,false,false,false,false]);
  const [declarationErrors, setDeclarationErrors] = React.useState<string[]>(['','','','','']);

  const [errors, setErrors] = useState<Record<string, string>>({
    firstName: '',
    surname: '',
    title: '',
    titleOther: '',
    gender: '',
    dateOfBirth: '',
    placeOfBirth: '',
    countryOfBirth: '',
    personalEmail: '',
    foreignLawJurisdictions: '',
    formerNames: '',
    // Section 2
    eduQualification1: '',
    eduInstitution1: '',
    eduYear1: '',
    eduQualification2: '',
    eduInstitution2: '',
    eduYear2: '',
    professionalQualifications: '',
    placeOfAdmission: '',
    dateOfAdmission: '',
    otherJurisdictionPlace: '',
    otherJurisdictionRadio: '',
    eduQualificationAttachment: '',
    proQualificationAttachment: '',
    jurisdictionAttachment: '',
    principalJurisdiction: '',
    // Section 3
    foreignRegistrationAuthority: '',
    foreignJurisdictions: '',
    registrationDocsAttachment: '',
    specialCondition: '',
    specialConditionDetails: '',
    disciplinaryProceedings: '',
    disciplinaryProceedingsDetails: '',
    // Section 4
    lawPracticeEmployer: '',
    officeStreet: '',
    officeCity: '',
    officeState: '',
    officeCountry: '',
    officePostcode: '',
    communicationEmail: '',
    practicePublicEmail: '',
    // Section 5
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
    addressForService: '',
    preferredPostalAddress: '',
    // Section 6,
    formOfPractice: '',
    formOfPracticeOther: '',
    multipleEntities: '',
    otherLawPracticeEmployer: '',
    otherStreetNumberName: '',
    otherSuburb: '',
    otherState: '',
    otherCountry: '',
    otherPostcode: '',
    // Section 9
    fitAndProper: '',
    fitAndProperAttachment: '',
    // Section 10
    showCause: '',
    showCauseAttachment: '',
    // Section 11
    heldNSWCertificate: '',
    nswCertificateDetails: '',
    currentAustralianCertificate: '',
    currentAustralianCertificateDetails: '',
    heldOtherAustralianCertificate: '',
    otherAustralianCertificateDetails: '',
    heldForeignCertificate: '',
    foreignCertificateDetails: '',
    associateMember: '',
    // Section 12
  });
  const [eduQualifications, setEduQualifications] = useState<Array<{qualification: string; institution: string; year: string}>>([{ qualification: '', institution: '', year: '' }]);
  const [otherJurisdictions, setOtherJurisdictions] = useState<Array<{otherJurisdictionPlace: string; otherJurisdictionDate: string}>>([{ otherJurisdictionPlace: '', otherJurisdictionDate: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentLimitError, setAttachmentLimitError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<FormErrorSummaryItem[]>([]);

  // Fee state — fetched from GetFeeARCNew whenever key fields change
  const [feeData, setFeeData] = useState<{ feePc: number; feeFidelity: number; feeSm: number; feeAmount: number; logic: string } | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const { lawSocietyId: authenticatedLawSocietyId, email: userEmail, name: userName, firstName: authFirstName, surname: authSurname, otherName: authOtherName, title: authTitle } = useAuthenticatedUser();

  useAuthPrefill(setFormData, {
    firstName: authFirstName,
    surname: authSurname,
    otherName: authOtherName,
    emailAddress: userEmail,
    personalEmail: userEmail,
    communicationEmail: userEmail,
    title: authTitle,
  });

  // Fetch fee whenever effective date, form of practice, country, or AM changes
  useEffect(() => {
    const rawDate = (formData as any).commencePracticeDate as string | undefined;
    // DateField emits DD/MM/YYYY — convert to ISO YYYY-MM-DD for the API
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
    apiService.getFee({ formType: FORM_TYPES.AUSTRALIAN_REGISTRATION_CERTIFICATE_NEW, effectiveDate, formOfPractice, practiceCountry: country, AM: am })
      .then(r => { if (!cancelled) { setFeeData(r); setFeeLoading(false); } })
      .catch(() => { if (!cancelled) { setFeeData(null); setFeeLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(formData as any).commencePracticeDate, (formData as any).formOfPractice, formData.residentialCountry, (formData as any).associateMember]);

  // State for storing actual File objects
  const [attachments, setAttachments] = useState<{
    eduQualificationAttachment: File[] | null;
    proQualificationAttachment: File[] | null;
    jurisdictionAttachment: File[] | null;
    registrationDocsAttachment: File[] | null;
    cert9Attachment: File[] | null;
    eligibilityAttachment: File[] | null;
    eligibilityAttachment2: File[] | null;
    fitAndProperAttachment: File[] | null;
    showCauseAttachment: File[] | null;
  }>({
    eduQualificationAttachment: null,
    proQualificationAttachment: null,
    jurisdictionAttachment: null,
    registrationDocsAttachment: null,
    cert9Attachment: null,
    eligibilityAttachment: null,
    eligibilityAttachment2: null,
    fitAndProperAttachment: null,
    showCauseAttachment: null
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
      'formOfPractice': {
        'sole': "On the foreign lawyer's own account",
        'partnership': 'As a partner in a law firm, as defined in the legal profession legislation',
        'volunteer': 'In a partnership with one or more Australian-registered foreign lawyers in circumstances where, if the Australian-registered foreign lawyer were an Australian legal practitioner, the partnership would be permitted under a law of this jurisdiction',
        'volunteer_probono': 'As a volunteer at a community legal service or otherwise on a pro bono basis',
        'incorporated': 'As a partner, director, officer or employee of an incorporated legal practice or unincorporated legal practice',
        'employee': 'As an employee of a law practice, as defined in the legal profession legislation',
        'employeeARFL': 'As an employee of an Australian-registered foreign lawyer',
        'other': 'Other',
      },
    };
    
    const updates: any = { [name]: value };
    
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
    const certErrorKeys = ['heldNSWCertificate', 'nswCertificateDetails', 'currentAustralianCertificate', 'currentAustralianCertificateDetails', 'heldOtherAustralianCertificate', 'otherAustralianCertificateDetails', 'heldForeignCertificate', 'foreignCertificateDetails'];
    const admissionErrorKeys = ['eduQualificationAttachment', 'proQualificationAttachment', 'jurisdictionAttachment'];
    const eligibilityErrorKeys = ['registrationDocsAttachment'];
    const isAdmissionDynamicError = (field: string) => field.startsWith('qual_') || field.startsWith('otherJurisdiction_');

    if (admissionErrorKeys.includes(fieldName) || isAdmissionDynamicError(fieldName)) {
      return document.getElementById('admission-details-section');
    }
    if (eligibilityErrorKeys.includes(fieldName)) {
      return document.getElementById('eligibility-section');
    }
    if (certErrorKeys.includes(fieldName)) {
      return document.getElementById('cert-section');
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
    else if (fieldName === 'titleOther' && !value.trim()) errorMessage = 'Please specify title';
    else if (fieldName === 'gender' && !value.trim()) errorMessage = 'Gender is required';
    else if (fieldName === 'placeOfBirth' && !value.trim()) errorMessage = 'Place of birth is required';
    else if (fieldName === 'countryOfBirth' && !value.trim()) errorMessage = 'Country of birth is required';
    else if (fieldName === 'foreignLawJurisdictions' && !value.trim()) errorMessage = 'This field is required';
    else if (fieldName === 'communicationEmail') errorMessage = getEmailValidationError(value);
    else if (fieldName === 'practicePublicEmail') errorMessage = getEmailValidationError(value);
    
    // Section 2 - Qualifications
    else if (fieldName.startsWith('qual_qualification_') && !value.trim()) errorMessage = 'Qualification is required';
    else if (fieldName.startsWith('qual_institution_') && !value.trim()) errorMessage = 'Institution is required';
    else if (fieldName.startsWith('qual_year_') && !value.trim()) errorMessage = 'Year completed is required';
    else if (fieldName === 'otherJurisdictionRadio' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName.startsWith('otherJurisdiction_place_') && !value.trim()) errorMessage = 'Place of admission is required';
    else if (fieldName.startsWith('otherJurisdiction_date_') && !value.trim()) errorMessage = 'Date of admission is required';
    else if (fieldName === 'dateOfAdmission' && !value.trim()) errorMessage = 'Date of admission is required';
    else if (fieldName === 'placeOfAdmission' && !value.trim()) errorMessage = 'Place of admission is required';
    else if (fieldName === 'principalJurisdiction' && !value.trim()) errorMessage = 'Jurisdiction is required';
    
    // Section 3 - Eligibility
    else if (fieldName === 'foreignRegistrationAuthority' && !value.trim()) errorMessage = 'Foreign registration authority is required';
    else if (fieldName === 'foreignJurisdictions' && !value.trim()) errorMessage = 'Foreign jurisdictions are required';
    
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
    else if (fieldName === 'formOfPractice' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'formOfPracticeOther' && (formData as any).formOfPractice === 'other' && !value.trim()) errorMessage = 'Please include details of other form of practice';
    else if (fieldName === 'multipleEntities' && !value.trim()) errorMessage = 'Please select an option';
    else if (fieldName === 'otherLawPracticeEmployer' && !value.trim()) errorMessage = 'Law practice/employer name is required';    else if (fieldName === 'commencePracticeDate' && !value.trim()) errorMessage = 'Date is required';    else if (fieldName === 'otherStreetNumberName' && !value.trim()) errorMessage = 'Street number and name is required';
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

    // Section 1 - Applicant Details
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
    if (!formData.foreignLawJurisdictions.trim()) newErrors.foreignLawJurisdictions = 'This field is required';
    // title hidden from UI, populated from auth - no UI validation needed
    if (formData.title === 'other' && !formData.titleOther.trim()) newErrors.titleOther = 'Please specify title';
    if (!formData.gender.trim()) newErrors.gender = 'Gender is required';
    if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.placeOfBirth.trim()) newErrors.placeOfBirth = 'Place of birth is required';
    if (!formData.countryOfBirth.trim()) newErrors.countryOfBirth = 'Country of birth is required';
    // personalEmail hidden from UI, populated from auth - no UI validation needed
    newErrors.communicationEmail = getEmailValidationError(formData.communicationEmail || '');
    newErrors.practicePublicEmail = getEmailValidationError(formData.practicePublicEmail || '');

    // Section 2 - Qualifications
    if (!formData.dateOfAdmission.trim()) newErrors.dateOfAdmission = 'Date of admission is required';
    if (!formData.placeOfAdmission.trim()) newErrors.placeOfAdmission = 'Place of admission is required';
    if (!formData.principalJurisdiction.trim() && (formData as any).nswPrincipalPlaceYesNo === 'no') newErrors.principalJurisdiction = 'Jurisdiction is required';
    if (!formData.eduQualificationAttachment.trim()) newErrors.eduQualificationAttachment = 'Please attach documents verifying your educational qualifications';
    if (!formData.proQualificationAttachment.trim()) newErrors.proQualificationAttachment = 'Please attach professional qualifications document';
     if (!formData.otherJurisdictionRadio.trim()) newErrors.otherJurisdictionRadio = 'Please select an option';
    if ((formData as any).otherJurisdictionRadio === 'yes') {
      otherJurisdictions.forEach((j, i) => {
        if (!j.otherJurisdictionPlace.trim()) newErrors[`otherJurisdiction_place_${i}`] = 'Place of admission is required';
        if (!j.otherJurisdictionDate.trim()) newErrors[`otherJurisdiction_date_${i}`] = 'Date of admission is required';
      });
      if (!attachments.jurisdictionAttachment?.length) {
        newErrors.jurisdictionAttachment = 'Please attach documents verifying your qualifications for all jurisdictions';
      }
    }

    eduQualifications.forEach((q, i) => {
      if (!q.qualification.trim()) newErrors[`qual_qualification_${i}`] = 'Qualification is required';
      if (!q.institution.trim()) newErrors[`qual_institution_${i}`] = 'Institution is required';
      if (!q.year.trim()) newErrors[`qual_year_${i}`] = 'Year completed is required';
    });

    // Section 3 - Eligibility
    if (!formData.foreignRegistrationAuthority.trim()) newErrors.foreignRegistrationAuthority = 'Foreign registration authority is required';
    if (!formData.foreignJurisdictions.trim()) newErrors.foreignJurisdictions = 'Foreign jurisdictions are required';
    if (!attachments.registrationDocsAttachment?.length) newErrors.registrationDocsAttachment = 'Please attach documents verifying your current registration(s)';
    if (!formData.specialCondition.trim()) newErrors.specialCondition = 'Please select an option';
    if (formData.specialCondition === 'yes' && !formData.specialConditionDetails.trim()) newErrors.specialConditionDetails = 'Please provide details';
    if (!formData.disciplinaryProceedings.trim()) newErrors.disciplinaryProceedings = 'Please select an option';
    if (formData.disciplinaryProceedings === 'yes' && !formData.disciplinaryProceedingsDetails.trim()) newErrors.disciplinaryProceedingsDetails = 'Please provide details';

    // Section 5 - Address Details
    if (!formData.residentialStreet.trim()) newErrors.residentialStreet = 'Street address is required';
    if (!formData.residentialCity.trim()) newErrors.residentialCity = 'City is required';
    if (!formData.residentialState.trim()) newErrors.residentialState = 'State is required';
    if (!formData.residentialCountry.trim()) newErrors.residentialCountry = 'Country is required';
    if (!formData.residentialPostcode.trim()) newErrors.residentialPostcode = 'Postcode is required';
    if (!formData.addressForService.trim()) newErrors.addressForService = 'Please select an option';
    if (!formData.preferredPostalAddress.trim()) newErrors.preferredPostalAddress = 'Please select an option';
    if (formData.addressForService === 'other') {
      if (!(formData as any).serviceOtherStreet?.trim()) newErrors.serviceStreet = 'Street address is required';
      if (!(formData as any).serviceOtherCity?.trim()) newErrors.serviceSuburb = 'City is required';
      if (!(formData as any).serviceOtherState?.trim()) newErrors.serviceState = 'State is required';
      if (!(formData as any).serviceOtherCountry?.trim()) newErrors.serviceCountry = 'Country is required';
      if (!(formData as any).serviceOtherPostcode?.trim()) newErrors.servicePostcode = 'Postcode is required';
    }

    // Section 6 - Other Places of Practice
    if (!(formData as any).formOfPractice?.trim()) newErrors.formOfPractice = 'Please select an option';
    if ((formData as any).formOfPractice === 'other' && !(formData as any).formOfPracticeOther?.trim()) {
      newErrors.formOfPracticeOther = 'Please include details of other form of practice';
    }


    // Section 9 - Fit and Proper Person
    if (!formData.fitAndProper.trim()) newErrors.fitAndProper = 'Please select an option';
    if (formData.fitAndProper === 'yes' && !formData.fitAndProperAttachment.trim()) newErrors.fitAndProperAttachment = 'Statement attachment is required';

    // Section 10 - Show Cause
    if (!formData.showCause.trim()) newErrors.showCause = 'Please select an option';
    if (formData.showCause === 'yes' && !formData.showCauseAttachment.trim()) newErrors.showCauseAttachment = 'Show cause form is required';

    // Section 11 - Current or Previous Certificates
    if (!(formData as any).heldOtherAusCertificate?.trim()) newErrors.heldOtherAustralianCertificate = 'Please select an option';
    if ((formData as any).heldOtherAusCertificate === 'yes' && !(formData as any).heldOtherAusCertificateDetails?.trim()) newErrors.otherAustralianCertificateDetails = 'Details are required';
    if (!(formData as any).currentAusPractisingCert?.trim()) newErrors.heldForeignCertificate = 'Please select an option';
    if ((formData as any).currentAusPractisingCert === 'yes' && !(formData as any).currentAusPractisingCertDetails?.trim()) newErrors.foreignCertificateDetails = 'Details are required';

    // Associate Member
    if (!(formData as any).associateMember) newErrors.associateMember = 'Please select an option';

    // Section 11 - Declaration
    const newDeclErrors = declarationChecks.map(checked => checked ? '' : 'This declaration is required');
    setDeclarationErrors(newDeclErrors);
    const hasDeclarationErrors = newDeclErrors.some(e => e !== '');

    const piiValid = piiRef.current?.validate() ?? true;
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
    // Read PII values directly from component ref (same fix as ARCRenewForm)
    const piiValues = piiRef.current?.getValues() ?? { q1: '', q2: '', q4: '', undertaking: false };

    const formType = FORM_TYPES.AUSTRALIAN_REGISTRATION_CERTIFICATE_NEW;
    const formTypeShort = FORM_TYPES_SHORT.AUSTRALIAN_REGISTRATION_CERTIFICATE_NEW;
    const submissionData = {
      formType,
      applicantDetails: {
        firstName: formData.firstName,
        surname: formData.surname,
        ...(formData.otherName ? { otherName: formData.otherName } : {}),
        ...(formData.preferredFirstName ? { preferredFirstName: formData.preferredFirstName } : {}),
        ...(formData.formerNames ? { formerNames: formData.formerNames } : {}),
        ...(formData.postNominals ? { postNominals: formData.postNominals } : {}),
        title: formData.title,
        ...(formData.titleOther ? { titleOther: formData.titleOther } : {}),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        countryOfBirth: formData.countryOfBirth,
        // personalEmail: formData.personalEmail,
        foreignLawJurisdictions: formData.foreignLawJurisdictions || '',
      },
      admissionDetails: {
        educationalQualifications: eduQualifications,
        professionalQualifications: {
          ...(formData.placeOfAdmission ? { placeOfAdmission: formData.placeOfAdmission } : {}),
          ...(formData.dateOfAdmission ? { dateOfAdmission: formData.dateOfAdmission } : {})
        },
        admittedInOtherJurisdiction: (formData as any).otherJurisdictionRadio === 'yes' ? 'Yes' : (formData as any).otherJurisdictionRadio === 'no' ? 'No' : '',
        ...((formData as any).otherJurisdictionRadio === 'yes' ? { otherJurisdictions: otherJurisdictions } : {}),
      },
      eligibility: {
        foreignRegistrationAuthority: formData.foreignRegistrationAuthority || '',
        foreignJurisdictions: formData.foreignJurisdictions || '',
        specialCondition: formData.specialCondition === 'yes' ? 'Yes' : formData.specialCondition === 'no' ? 'No' : '',
        ...(formData.specialCondition === 'yes' ? { specialConditionDetails: formData.specialConditionDetails || '' } : {}),
        disciplinaryProceedings: formData.disciplinaryProceedings === 'yes' ? 'Yes' : formData.disciplinaryProceedings === 'no' ? 'No' : '',
        ...(formData.disciplinaryProceedings === 'yes' ? { disciplinaryProceedingsDetails: formData.disciplinaryProceedingsDetails || '' } : {}),
      },
      practiceDetails: {
        nswWillBePrincipalPlace: (formData as any).nswPrincipalPlaceYesNo === 'yes' ? 'Yes' : (formData as any).nswPrincipalPlaceYesNo === 'no' ? 'No' : '',
        ...((formData as any).commencePracticeDate ? { dateIntendedToCommence: (formData as any).commencePracticeDate } : {}),
        ...((formData as any).nswPrincipalPlaceYesNo === 'no' && (formData as any).principalJurisdiction ? {
          principalJurisdiction: (formData as any).principalJurisdiction,
        } : {}),
        ...((formData as any).nswPrincipalPlaceYesNo === 'yes' ? {
          nameOfLawPracticeOrEmployer: formData.lawPracticeEmployer || '',
          ...(formData.officeStreet ? { streetAddress: formData.officeStreet } : {}),
          ...(formData.officeStreet2 ? { streetAddress2: formData.officeStreet2 } : {}),
          ...(formData.officeCity ? { city: formData.officeCity } : {}),
          ...(formData.officeState ? { state: formData.officeState } : {}),
          ...(formData.officeCountry ? { country: formData.officeCountry } : {}),
          ...(formData.officePostcode ? { postcode: formData.officePostcode } : {}),
          ...(formData.communicationEmail ? { communicationEmail: formData.communicationEmail } : {}),
          ...(formData.practicePublicEmail ? { publicEmail: formData.practicePublicEmail } : {}),
        } : {}),
      },
      addresses: {
        residential: {
          street: formData.residentialStreet,
          ...(formData.residentialStreet2 ? { street2: formData.residentialStreet2 } : {}),
          city: formData.residentialCity,
          state: formData.residentialState,
          country: formData.residentialCountry,
          postcode: formData.residentialPostcode
        },
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
      otherPlaces: {
        formOfPractice: (formData as any).formOfPractice || '',
        formOfPracticeText: (formData as any).formOfPracticeText || '',
        ...((formData as any).formOfPractice === 'other' && (formData as any).formOfPracticeOther ? { formOfPracticeOther: (formData as any).formOfPracticeOther } : {}),
        multipleEntities: formData.multipleEntities === 'yes' ? 'Yes' : formData.multipleEntities === 'no' ? 'No' : '',
        ...(formData.multipleEntities === 'yes' ? {
          lawPracticeEmployer: formData.otherLawPracticeEmployer || '',
          street: formData.otherStreetNumberName || '',
          suburb: formData.otherSuburb || '',
          state: formData.otherState || '',
          country: formData.otherCountry || '',
          postcode: formData.otherPostcode || ''
        } : {}),
      },
      fitAndProper: {
        hasConcerns: formData.fitAndProper === 'yes' ? 'Yes' : formData.fitAndProper === 'no' ? 'No' : '',
      },
      showCause: {
        hasEvent: formData.showCause === 'yes' ? 'Yes' : formData.showCause === 'no' ? 'No' : '',
      },
      certificates: {
        heldNSWCertificate: formData.heldNSWCertificate === 'yes' ? 'Yes' : formData.heldNSWCertificate === 'no' ? 'No' : '',
        ...(formData.heldNSWCertificate === 'yes' ? { heldNSWCertificateDetails: (formData as any).heldNSWCertificateDetails || '' } : {}),
        heldOtherAusCertificate: (formData as any).heldOtherAusCertificate === 'yes' ? 'Yes' : (formData as any).heldOtherAusCertificate === 'no' ? 'No' : '',
        ...((formData as any).heldOtherAusCertificate === 'yes' ? { heldOtherAusCertificateDetails: (formData as any).heldOtherAusCertificateDetails || '' } : {}),
        currentOtherAusCertificate: (formData as any).currentOtherAusCertificate === 'yes' ? 'Yes' : (formData as any).currentOtherAusCertificate === 'no' ? 'No' : '',
        ...((formData as any).currentOtherAusCertificate === 'yes' ? { currentOtherAusCertificateDetails: (formData as any).currentOtherAusCertificateDetails || '' } : {}),
        currentAusPractisingCert: (formData as any).currentAusPractisingCert === 'yes' ? 'Yes' : (formData as any).currentAusPractisingCert === 'no' ? 'No' : '',
        ...((formData as any).currentAusPractisingCert === 'yes' ? { currentAusPractisingCertDetails: (formData as any).currentAusPractisingCertDetails || '' } : {}),
      },
      professionalIndemnityInsurance: {
        doYouHoldPii: piiValues.q1 === 'yes' ? 'Yes' : piiValues.q1 === 'no' ? 'No' : '',
        ...(piiValues.q1 === 'yes' ? { coveredByAustralianPolicy: piiValues.q2 === 'yes' ? 'Yes' : piiValues.q2 === 'no' ? 'No' : '' } : {}),
        ...(piiValues.q1 === 'yes' && piiValues.q2 === 'no' ? { coveredByForeignPolicy: piiValues.q4 === 'yes' ? 'Yes' : piiValues.q4 === 'no' ? 'No' : '' } : {}),
        ...(piiValues.undertaking ? { undertakingConfirmed: true, undertakingConfirmedText: 'I am the applicant named in this form and undertake to provide a disclosure statement in writing to each client (Note I)' } : {}),
      },
      associateMember: {
        wouldYouLikeToBeAnAssociateMember: (formData as any).associateMember === 'yes' ? 'Yes' : (formData as any).associateMember === 'no' ? 'No' : '',
      },
      declaration: {
        notAnAustralianLegalPractitioner: declarationChecks[0],
        notAnAustralianLegalPractitionerText: 'I am not an Australian legal practitioner.',
        intendToEngageInPractice: declarationChecks[1],
        intendToEngageInPracticeText: 'I intend to engage in legal practice in New South Wales within a reasonable time after registration.',
        notSubjectToDisciplinaryProceedings: declarationChecks[2],
        notSubjectToDisciplinaryProceedingsText: 'I am not the subject of disciplinary proceedings in Australia or a foreign country (including any preliminary investigations or action that might lead to disciplinary proceedings) in my capacity as an overseas-registered foreign lawyer or an Australian-registered foreign lawyer.',
        notConvictedOfOffence: declarationChecks[3],
        notConvictedOfOffenceText: 'I have not been convicted of an offence in Australia or a foreign country other than as disclosed in this application.',
        registrationNotCancelledOrSuspended: declarationChecks[4],
        registrationNotCancelledOrSuspendedText: 'My registration or authorisation is not cancelled or currently suspended in any place as a result of disciplinary action.'
      },
      submittedAt: new Date().toISOString().replace('Z', '+00:00')
    };

    try {
      setIsSubmitting(true);
      const formName = FORM_NAMES.AUSTRALIAN_REGISTRATION_CERTIFICATE_NEW;
      // Use fee from table lookup; fall back to $500 if fee hasn't loaded yet
      const price = feeData ? feeData.feeAmount : 500;
      const isAustralia = formData.residentialCountry?.trim().toLowerCase() === 'australia';
      const isAssociateMember = (formData as any).associateMember === 'yes';
      const feeSm = feeData ? feeData.feeSm : ((isAssociateMember && isAustralia) ? 500 : 0);
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
        firstName: 'First Name', surname: 'Surname', otherName: 'Middle/Other Names', title: 'Title',
        preferredFirstName: 'Preferred first name (if any)', formerNames: 'Former names', postNominals: 'Post nominals',
        titleOther: 'Other Title', gender: 'Gender', dateOfBirth: 'Date of Birth',
        placeOfBirth: 'Place of Birth', countryOfBirth: 'Country of Birth',
        foreignLawJurisdictions: 'I will be practising the foreign laws of (insert name of the foreign jurisdiction/s)',
        educationalQualifications: 'Educational qualifications',
        professionalQualifications: 'Professional qualifications',
        placeOfAdmission: 'Place of admission', dateOfAdmission: 'Date of admission', otherJurisdictionPlace: 'Place of admission', otherJurisdictionDate: 'Date of admission',
        admittedInOtherJurisdiction: 'Are you admitted in any other jurisdiction?',
        otherJurisdiction: 'Other jurisdiction',
        foreignRegistrationAuthority: 'Name of the foreign registration authority',
        foreignJurisdictions: 'Foreign jurisdiction where you are registered or authorised to engage in legal practice',
        specialCondition: 'Have you had any special condition or undertaking imposed in Australia or a foreign country?',
        specialConditionDetails: 'Please provide details',
        disciplinaryProceedings: 'Are you currently the subject of disciplinary proceedings?',
        disciplinaryProceedingsDetails: 'Please provide details',
        nswWillBePrincipalPlace: 'Do you intend that NSW will be your principal place of practice in Australia?',
        principalJurisdiction: 'Provide the name of the jurisdiction you intend to be your principal place of practice',
        nameOfLawPracticeOrEmployer: 'Name of law practice/employer',
        streetAddress: 'Street Address', streetAddress2: 'Street Address Line 2',
        city: 'City', state: 'State', country: 'Country', postcode: 'Postcode',
        communicationEmail: 'Communication email address for the Law Society',
        publicEmail: 'Email address for publication',
        dateIntendedToCommence: 'Effective date of your certificate',
        residential: 'Residential address',
        addressForService: 'Address for service',
        preferredPostalAddress: 'Preferred postal address',
        multipleEntities: 'Do you intend to practise with more than one entity?',
        formOfPractice: 'Form of practice',
        formOfPracticeOther: 'Please specify form of practice',
        lawPracticeEmployer: 'Name of other law practice/employer',
        hasConcerns: 'Is there any matter referred to in rule 15(1) of the Legal Profession Uniform General Rules 2015 which is applicable to you?',
        hasEvent: 'Is there any matter referred to in section 67 of the Legal Profession Uniform Law (NSW) which is applicable to you?',
        heldNSWCertificate: 'Have you ever held a registration certificate in New South Wales?',
        heldNSWCertificateDetails: 'Please provide details',
        heldOtherAusCertificate: 'Have you ever held a registration certificate in an Australian jurisdiction other than New South Wales?',
        heldOtherAusCertificateDetails: 'Please provide details',
        currentOtherAusCertificate: 'Do you hold a current registration certificate in another Australian jurisdiction as at the date of this application?',
        currentOtherAusCertificateDetails: 'Please provide details',
        currentAusPractisingCert: 'Do you hold a current Australian practising certificate as at the date of this application?',
        currentAusPractisingCertDetails: 'Please provide details',
        doYouHoldPii: '1. Do you hold or are you covered by an approved professional indemnity insurance policy that covers your practice of foreign law in New South Wales?',
        coveredByAustralianPolicy: '2. Do you hold or are you covered by an approved insurance policy issued by an Australian jurisdiction?',
        coveredByForeignPolicy: '3. Do you hold or are you covered by an insurance policy issued by a foreign jurisdiction?',
      };

      const sectionLabels: Record<string, string> = {
        applicantDetails: '1. Applicant Details',
        admissionDetails: '2. Qualifications',
        eligibility: '3. Foreign Registration/s',
        practiceDetails: '4. Details of Principal Place of Practice in Australia',
        addresses: '5. Other Address Details',
        otherPlaces: '6. Details of form of principal place of practice in Australia',
        fitAndProper: '7. Fit and Proper Person',
        showCause: '8. Show Cause Events',
        certificates: '9. Current or Previously Held Australian Certificate',
        professionalIndemnityInsurance: '10. Professional Indemnity Insurance',
        associateMember: '11. Associate Membership',
        declaration: '12. Declaration',
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
          receiptCategory: 'registry',
          sku: '80910'
        },
        fieldLabels,
        sectionLabels,
        feeSm,
        smLogic,
        lineItems
      );

      console.log('Form submitted successfully:', result);
      window.location.href = getCheckoutUrlOrThrow(result, apiService.getSafeCheckoutUrl);
      
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
            title={"Application for Grant of an Australian Registration Certificate as an Australian-Registered Foreign Lawyer in New South Wales"} 
            subtitle={"This is an application for the grant of an Australian Registration Certificate as an Australian-Registered Foreign Lawyer."} 
          />

          <FormErrorSummary
            items={validationSummary}
            onSelect={(field) => focusSummaryField(field, resolveSummaryFieldFallback)}
          />

          <InstructionsSection items={[
            "To be completed by a foreign lawyer who wishes to practise foreign law as an Australian-registered foreign lawyer in this jurisdiction.",
            <>Applications for registration certificates in New South Wales are made in accordance with the legal profession legislation (as defined in s3A of the <em>Legal Profession Uniform Law Application Act</em> 2014).</>,
          ]} />

          <div className="section-divider" />

          <ApplicantDetails 
            variant="practising-certificate"
            formData={formData}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
            showForeignLawField={true}
            readOnlyFields={{ firstName: !!authFirstName, surname: !!authSurname, personalEmail: !!userEmail, title: !!authTitle }}
          />

          <div className="section-divider" />

          <div id="admission-details-section">
            <AdmissionDetailsSection 
              formData={formData}
              errors={errors}
              onChange={handleChange}
              onBlur={handleBlur}
              onFileSelect={handleFileSelect}
              existingFiles={attachments.eduQualificationAttachment || []}
              existingFiles1={attachments.proQualificationAttachment || []}
              existingFiles2={attachments.jurisdictionAttachment || []}
              onQualificationsChange={setEduQualifications}
              onOtherJurisdictionsChange={setOtherJurisdictions}
            />
          </div>

          <div className="section-divider" />

          <div id="eligibility-section">
            <EligibilitySection 
              formData={formData}
              errors={errors} 
              onChange={handleChange}
              onBlur={handleBlur}
              onFileSelect={handleFileSelect}
              existingFiles={attachments.registrationDocsAttachment || []}
              existingFilesEligibility={attachments.eligibilityAttachment || []}
              existingFiles2={attachments.eligibilityAttachment2 || []}
            />
          </div>

          <div className="section-divider" />

          <PracticeDetailsSection
            formData={formData}
            errors={errors}
            onChange={handleChange as any}
            onBlur={handleBlur}
            publicEmailOptional
            hidePublicEmailNote
          />

          <div className="section-divider" />

          <OtherAddressDetailsSection formData={formData} errors={errors} onChange={handleChange as any} onBlur={handleBlur} />

          <div className="section-divider" />

          <AddressDetailsSection 
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
            hideFormOfPracticeNumber
            sectionTitle="6. Details of form of principal place of practice in Australia"
          />

          <div className="section-divider" />

          <div id="fitAndProperAttachment">
            <ARCFitAndProperSection
              errors={errors}
              onChange={handleChange}
              onBlur={handleBlur}
              onFileSelect={handleFileSelect}
              existingFiles={attachments.fitAndProperAttachment || []}
            />
          </div>

          <div className="section-divider" />

          <div id="showCauseAttachment">
            <ARCNewShowCauseSection
              errors={errors}
              onChange={handleChange}
              onBlur={handleBlur}
              onFileSelect={handleFileSelect}
              existingFiles={attachments.showCauseAttachment || []}
            />
          </div>

          <div className="section-divider" />

          <div id="cert-section">
            <ARCNewCurrentCertSection
              errors={{
                heldNSWCertificate: errors.heldNSWCertificate,
                heldNSWCertificateDetails: errors.nswCertificateDetails,
                heldOtherAusCertificate: errors.heldOtherAustralianCertificate,
                heldOtherAusCertificateDetails: errors.otherAustralianCertificateDetails,
                currentOtherAusCertificate: errors.currentAustralianCertificate,
                currentOtherAusCertificateDetails: errors.currentAustralianCertificateDetails,
                currentAusPractisingCert: errors.heldForeignCertificate,
                currentAusPractisingCertDetails: errors.foreignCertificateDetails,
              }}
              onChange={handleChange}
              onBlur={handleBlur}
              onFileSelect={handleFileSelect}
              existingFiles={attachments.cert9Attachment || []}
            />
          </div>

          <div className="section-divider" />

          <ARCNewProfIndemnitySection
            ref={piiRef}
            onChange={handleChange}
          />

          <div className="section-divider" />

          <div>
            <h2 className="section-title">11. Associate Membership</h2>
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
            {errors.associateMember && (
              <span className="error-message">{errors.associateMember}</span>
            )}
          </div>

          <div className="section-divider" />

          <ARCNewDeclarationSection
            checked={declarationChecks}
            errors={declarationErrors}
            onChange={(i, val) => {
              setDeclarationChecks(prev => { const a = [...prev]; a[i] = val; return a; });
              setDeclarationErrors(prev => { const a = [...prev]; a[i] = ''; return a; });
            }}
          />

          <div className="section-divider" />

          {/* Fee Schedule */}
          <h2 className="section-title">13. Schedule of Fees and Payment</h2>

          <div style={{ marginTop: 12, marginBottom: 24 }}>
          {(() => {
            const fop = (formData as any).formOfPractice as string | undefined;
            const fopLabel: Record<string, string> = {
              sole:              'Foreign lawyer\'s own account',
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

          <ARCNewNotesSection />
        </section>
      </main>
    </div>
  );
}

export default ARCNewForm;
