import React, { useState, useEffect } from 'react';
import './App.css';
import './components/components.css';
import Header from './components/Header';
import Footer from './components/Footer';
import FormErrorSummary, { FormErrorSummaryItem } from './components/FormErrorSummary';
import FormField from './components/FormField';
import DateField from './components/DateField';
import apiService, { StripeLineItem } from './services/apiService';
import { usePCFee, practiceTypeLabel } from './hooks/usePCFee';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useAuthPrefill } from './hooks/useAuthPrefill';
import FileUploadField from './components/FileUploadField';
import CountrySelect from './components/CountrySelect';
import { getEmailValidationError, getTotalAttachmentLimitError } from './utils/validation';
import { getCheckoutUrlOrThrow } from './utils/submission';
import { getValidationSummary, focusFieldByName } from './utils/formErrorSummary';
import StateSelect from './components/StateSelect';
import { FORM_TYPES, FORM_TYPES_SHORT } from './constants/formTypes';
import { FORM_NAMES } from './constants/formNames';

const PC_NEW_INTERSTATE_EXIT_URL =
  process.env.REACT_APP_PC_NEW_INTERSTATE_EXIT_URL ||
  'https://az-ae-app-b2capp-qa.azurewebsites.net/Home/Home';



function PCNewForm() {
  const getEffectiveDateMaxForPcYear = (today: Date) => {
    const current = new Date(today);
    current.setHours(0, 0, 0, 0);
    const year = current.getFullYear() + 1;
    const cutoff = new Date(year, 3, 1); // 1 April
    cutoff.setHours(0, 0, 0, 0);

    // After 1 April, allow selecting up to 30 June of next year; otherwise current year.
    const maxYear = current > cutoff ? year + 1 : year;
    return new Date(maxYear, 5, 30); // 30 June
  };

  const pcEffectiveDateMax = getEffectiveDateMaxForPcYear(new Date());

  const [formData, setFormData] = useState({
    // Section 1 - Eligibility
    principalPlace: '',
    foreignJurisdiction: '',
    // Section 2 - Applicant Details
    surname: '',
    firstName: '',
    otherName: '',
    preferredFirstName: '',
    formerNames: '',
    title: '',
    gender: '',
    dateOfBirth: '',
    placeOfBirth: '',
    countryOfBirth: '',
    personalEmail: '',
    aboriginalOrTSI: '',
    // Section 3 - Admission Details
    lawyerAdmissionNumber: '',
    stateOfAdmission: '',
    dateOfAdmission: '',
    admissionCondition: '',
    admissionConditionDetails: '',
    admittedOtherJurisdictions: '',
    additionalAdmissionDetails: '',
    // Section 4 - Practice Details
    intendToEngageLegalPractice: '',
    practiceType: '',
    practiceSpecify: '',
    pcEffectiveDate: '',
    practiceEmployerName: '',
    practiceStreet: '',
    practiceStreet2: '',
    practiceCity: '',
    practiceState: '',
    practicePostcode: '',
    practiceCountry: '',
    practicePublicEmail: '',
    // Section 5 - Addresses
    residentialStreet: '',
    residentialStreet2: '',
    residentialCity: '',
    residentialState: '',
    residentialPostcode: '',
    residentialCountry: '',
    postalSameAsPractice: '',
    serviceSameAsPractice: '',
    serviceStreet: '',
    serviceStreet2: '',
    serviceCity: '',
    serviceState: '',
    servicePostcode: '',
    serviceCountry: '',
    postalStreet: '',
    postalStreet2: '',
    postalCity: '',
    postalState: '',
    postalPostcode: '',
    postalCountry: '',
    // Section 6 - Other Places of Practice
    multipleEntities: '',
    otherEmployerName: '',
    otherPlaceType: '',
    otherPrincipalType: '',
    otherStreet: '',
    otherStreet2: '',
    otherCity: '',
    otherState: '',
    otherPostcode: '',
    otherCountry: '',
    otherEmail: '',
    // Section 7 - Current or Previously Held Practising Certificates
    currentCertOtherJurisdiction: '',
    currentCertDetails: '',
    heldNSWPrevYear: '',
    cpdCompliant: '',
    cpdDetails: '',
    // Section 8 - Fit and Proper Person
    fitAndProper: '',
    // Section 9 - Show Cause Events
    showCause: '',
    // Section 10 - Law Society Membership
    lawSocietyMember: '',
    // Section 11 - Declaration
    declarationTruth: false,
    declarationApply: false,
    declarationNoMatter: false,
    declarationMembership: false,
    declarationNotes: false,
    declarationPrivacy: false,
  });

  const pcEffectiveDateWarningStart = new Date(pcEffectiveDateMax.getFullYear(), 3, 1);
  const pcEffectiveDateWarningEnd = new Date(pcEffectiveDateMax.getFullYear(), 5, 30);

  const parseDateFieldValue = (value: string): Date | null => {
    const [day, month, year] = value.split('/').map(Number);
    if (!day || !month || !year) return null;

    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month - 1 &&
      parsedDate.getDate() === day
      ? parsedDate
      : null;
  };

  const selectedPcEffectiveDate = parseDateFieldValue(formData.pcEffectiveDate);
  const showPcEffectiveDateWarning = selectedPcEffectiveDate !== null &&
    selectedPcEffectiveDate >= pcEffectiveDateWarningStart &&
    selectedPcEffectiveDate <= pcEffectiveDateWarningEnd;
  const warningFinancialYear = `${pcEffectiveDateWarningStart.getFullYear() - 1}-${String(pcEffectiveDateWarningEnd.getFullYear()).slice(-2)}`;
  const warningEndDate = pcEffectiveDateWarningEnd.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const [errors, setErrors] = useState({
    // Section 1
    principalPlace: '',
    foreignJurisdiction: '',
    // Section 2
    surname: '',
    firstName: '',
    title: '',
    gender: '',
    dateOfBirth: '',
    placeOfBirth: '',
    countryOfBirth: '',
    personalEmail: '',
    // Section 3
    stateOfAdmission: '',
    dateOfAdmission: '',
    admissionCondition: '',
    admissionConditionDetails: '',
    admittedOtherJurisdictions: '',
    additionalAdmissionDetails: '',
    certificateAttachment: '',
    // Section 4
    intendToEngageLegalPractice: '',
    practiceType: '',
    practiceSpecify: '',
    pcEffectiveDate: '',
    practiceEmployerName: '',
    practiceStreet: '',
    practiceStreet2: '',
    practiceCity: '',
    practiceState: '',
    practicePostcode: '',
    practiceCountry: '',
    practicePublicEmail: '',
    asicExtractAttachment: '',
    // Section 5
    residentialStreet: '',
    residentialCity: '',
    residentialState: '',
    residentialPostcode: '',
    residentialCountry: '',
    postalSameAsPractice: '',
    serviceSameAsPractice: '',
    serviceStreet: '',
    serviceCity: '',
    serviceState: '',
    servicePostcode: '',
    serviceCountry: '',
    postalStreet: '',
    postalCity: '',
    postalState: '',
    postalPostcode: '',
    postalCountry: '',
    // Section 6
    multipleEntities: '',
    otherEmployerName: '',
    otherPlaceType: '',
    otherPrincipalType: '',
    otherStreet: '',
    otherCity: '',
    otherState: '',
    otherPostcode: '',
    otherCountry: '',
    otherEmail: '',
    otherAsicExtractAttachment: '',
    // Section 7
    currentCertOtherJurisdiction: '',
    currentCertDetails: '',
    heldNSWPrevYear: '',
    cpdCompliant: '',
    cpdDetails: '',
    // Section 8
    fitAndProper: '',
    fitAndProperAttachment: '',
    // Section 9
    showCause: '',
    showCauseAttachment: '',
    // Section 10
    lawSocietyMember: '',
    // Section 11
    declarationTruth: '',
    declarationApply: '',
    declarationNoMatter: '',
    declarationMembership: '',
    declarationNotes: '',
    declarationPrivacy: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentLimitError, setAttachmentLimitError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<FormErrorSummaryItem[]>([]);

  const { feeData, feeLoading, feeError } = usePCFee({
      dateOfAdmission: formData.dateOfAdmission,
      pcEffectiveDate: formData.pcEffectiveDate,
      residentialCountry: formData.residentialCountry,
      practiceType: formData.practiceType,
      practiceSpecify: formData.practiceSpecify,
      notCurrentlyPractising: formData.intendToEngageLegalPractice === 'no',
      lawSocietyMember: formData.lawSocietyMember,
      enabled: formData.multipleEntities !== 'yes',
    });

  // Multi-entity fee calculation state (overrides usePCFee when multipleEntities='yes')
  const [multiEntityFeeData, setMultiEntityFeeData] = useState<{ feePc: number; feeFidelity: number; feeAmount: number; feeSm: number } | null>(null);
  const [multiEntityFeeLoading, setMultiEntityFeeLoading] = useState(false);

  const { lawSocietyId: authenticatedLawSocietyId, email: userEmail, name: userName, firstName: authFirstName, surname: authSurname, otherName: authOtherName, title: authTitle } = useAuthenticatedUser();

  // Conditional section visibility
  const [showConditionDetails, setShowConditionDetails] = useState(false);

  useAuthPrefill(setFormData, {
    firstName: authFirstName,
    surname: authSurname,
    otherName: authOtherName,
    personalEmail: userEmail,
    otherEmail: userEmail,
    title: authTitle,
  });

  // Multi-entity fee calculation logic (3 scenarios based on fee hierarchy)
  useEffect(() => {
    // Extract values at start like PC Variation does
    const multipleEntities = formData.multipleEntities;
    const practiceType = formData.practiceType;
    const practiceSpecify = formData.practiceSpecify;
    const otherPlaceType = formData.otherPlaceType;
    const otherPrincipalType = formData.otherPrincipalType;
    const dateOfAdmission = formData.dateOfAdmission;
    const pcEffectiveDate = formData.pcEffectiveDate;
    const residentialCountry = formData.residentialCountry;
    const lawSocietyMember = formData.lawSocietyMember;

    // Only calculate when multipleEntities='yes' and both practice types are selected
    if (multipleEntities !== 'yes' || !practiceType || !otherPlaceType) {
      setMultiEntityFeeData(null);
      return;
    }

    // For principal categories, subtype is required before fee lookup.
    if ((practiceType === 'principal' && !practiceSpecify) ||
        (otherPlaceType === 'principal' && !otherPrincipalType)) {
      setMultiEntityFeeData(null);
      return;
    }

    // Also require dates and other mandatory fields before calling API
    if (!dateOfAdmission || !pcEffectiveDate || !residentialCountry || !lawSocietyMember) {
      setMultiEntityFeeData(null);
      return;
    }

    // Helper to categorize practice type into Principal/Employee, Gov/Cor, or Volunteer
    const categorizePractice = (type: string, principalType?: string): 'principal-supervisor' | 'principal-employee' | 'gov-cor' | 'volunteer' => {
      if (type === 'principal' && principalType === 'supervising') return 'principal-supervisor';
      if (type === 'principal' || type === 'employee') return 'principal-employee';
      if (type === 'corporate' || type === 'government') return 'gov-cor';
      return 'volunteer';
    };

    const section4Category = categorizePractice(practiceType, practiceSpecify);
    const section6Category = categorizePractice(otherPlaceType, otherPrincipalType);

    const fetchMultiEntityFees = async () => {

      try {
        setMultiEntityFeeLoading(true);

        // Helper to parse DD/MM/YYYY to ISO YYYY-MM-DD
        const parseDMYtoISO = (dmy: string): string | null => {
          if (!dmy) return null;
          const parts = dmy.split('/');
          if (parts.length !== 3) return null;
          const [dd, mm, yyyy] = parts;
          if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        };

        const dateOfAdmissionISO = parseDMYtoISO(dateOfAdmission);
        const pcEffectiveDateISO = parseDMYtoISO(pcEffectiveDate);
        const practiceCountry = residentialCountry === 'Australia' ? 'Australia' : 'Outside Australia';
        if (!dateOfAdmissionISO || !pcEffectiveDateISO) {
          setMultiEntityFeeData(null);
          setMultiEntityFeeLoading(false);
          return;
        }

        // Helper to map category to RegistryType for API
        const categoryToRegistryType = (category: string): string => {
          if (category === 'principal-supervisor') return 'Principal-Supervisor';
          if (category === 'principal-employee') return 'Principal/Employee';
          if (category === 'gov-cor') return 'Gov/Corporate';
          return 'Volunteer';
        };

        // Make 2 API calls
        const [section4Fee, section6Fee] = await Promise.all([
          apiService.getFee({
            formType: FORM_TYPES.PRACTISING_CERTIFICATE_NEW,
            dateOfAdmission: dateOfAdmissionISO,
            effectiveDate: pcEffectiveDateISO,
            practiceCountry,
            registryType: categoryToRegistryType(section4Category),
            SM: lawSocietyMember,
          }),
          apiService.getFee({
            formType: FORM_TYPES.PRACTISING_CERTIFICATE_NEW,
            dateOfAdmission: dateOfAdmissionISO,
            effectiveDate: pcEffectiveDateISO,
            practiceCountry,
            registryType: categoryToRegistryType(section6Category),
            SM: lawSocietyMember,
          }),
        ]);

        // Apply scenario logic based on Section 4 category
        let finalPc = 0;
        let finalFidelity = 0;

        if (section4Category === 'principal-employee' || section4Category === 'principal-supervisor') {
          // Scenario 1: Section 4 is Principal/Employee → PC + Fidelity already charged
          finalPc = section4Fee.feePc;
          finalFidelity = section4Fee.feeFidelity;
          
          if (section4Category === 'principal-supervisor' && section6Category) {
            finalFidelity = section6Fee.feeFidelity;
          }
        } else if (section4Category === 'gov-cor') {
          // Scenario 2: Section 4 is Gov/Cor → PC only charged
          finalPc = section4Fee.feePc;
          // Add Fidelity if Section 6 is Principal/Employee
          if (section6Category === 'principal-employee' || section6Category === 'principal-supervisor') {
            finalFidelity = section6Fee.feeFidelity;
          }
        } else {
          // Scenario 3: Section 4 is Volunteer → No fees charged yet
          if (section6Category === 'principal-employee' || section6Category === 'principal-supervisor') {
            // Add PC + Fidelity
            finalPc = section6Fee.feePc;
            finalFidelity = section6Fee.feeFidelity;
          } else if (section6Category === 'gov-cor') {
            // Add PC only
            finalPc = section6Fee.feePc;
          // If Section 6 is also Volunteer, no fees
          }
        }

        

        // Calculate total with membership fee if applicable
        const smApplies = lawSocietyMember !== 'no' && section4Fee.feeSm > 0;
        const feeAmount = smApplies ? (finalPc + finalFidelity + section4Fee.feeSm) : (finalPc + finalFidelity);

        setMultiEntityFeeData({
          feePc: finalPc,
          feeFidelity: finalFidelity,
          feeAmount,
          feeSm: section4Fee.feeSm,
        });
      } catch (err) {
        console.error('Multi-entity fee calculation error');
        setMultiEntityFeeData(null);
      } finally {
        setMultiEntityFeeLoading(false);
      }
    };

    fetchMultiEntityFees();
  }, [
    formData.multipleEntities,
    formData.practiceType,
    formData.practiceSpecify,
    formData.otherPlaceType,
    formData.otherPrincipalType,
    formData.dateOfAdmission,
    formData.pcEffectiveDate,
    formData.residentialCountry,
    formData.lawSocietyMember,
  ]);

  const [showFitAttachment, setShowFitAttachment] = useState(false);
  const [showCauseAttachment, setShowCauseAttachment] = useState(false);

  const [attachments, setAttachments] = useState<{
    certificateAttachment: File[] | null;
    fitAndProperAttachment: File[] | null;
    showCauseAttachment: File[] | null;
    asicExtractAttachment: File[] | null;
    otherAsicExtractAttachment: File[] | null;
  }>({
    certificateAttachment: null,
    fitAndProperAttachment: null,
    showCauseAttachment: null,
    asicExtractAttachment: null,
    otherAsicExtractAttachment: null,
  });

  useEffect(() => {
    const nextAttachmentLimitError = getTotalAttachmentLimitError(attachments);
    setAttachmentLimitError(nextAttachmentLimitError);
    if (!nextAttachmentLimitError && submitError?.startsWith('Exceeded attachment size')) {
      setSubmitError(null);
    }
  }, [attachments, submitError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    
    // Map for checkbox label text
    const checkboxTextMap: Record<string, string> = {
      'declarationTruth': 'I declare that the contents of this application are true and correct;',
      'declarationApply': 'I wish to apply for an Australian practising certificate and have my name entered in the register of local practising certificates in New South Wales;',
      'declarationNoMatter': 'I declare that I am not aware of any matter (including a finding, conduct or event) referred to in rule 13(1) of the Legal Profession Uniform General Rules 2015 or any Automatic Show Cause event within the meaning of section 87 of the Legal Profession Uniform Law (NSW) which would affect my fitness to hold a practising certificate, other than that which is disclosed above and in respect of which I have provided a statement under rule 12, or which I have previously disclosed;',
      'declarationMembership': `I acknowledge that payment of the Membership Fee indicates that I also wish to be a Solicitor Member of the Law Society of New South Wales for the ${pcYear} year;`,
      'declarationPrivacy': 'I have read the Personal Information Collection Notice before providing my personal information and agree to the below terms',
    };
    
    // Map for radio button options
    const radioTextMap: Record<string, Record<string, string>> = {
      'practiceType': {
        'principal': 'Principal of a law practice',
        'employee': 'Employee of a law practice',
        'corporate': 'Corporate legal practitioner',
        'government': 'Government legal practitioner',
        'volunteer': 'Volunteer of a community legal service (a volunteer PC will only be granted to an applicant who will be volunteering with a community legal service registered with the Law Society, and, will not be granted to an applicant residing or have a PPP outside of Australia)',
      },
      'practiceSpecify': {
        'sole': 'Sole practitioner',
        'incorporated': 'Principal of an Incorporated Legal Practice',
        'partner': 'Partner of a law firm',
        'supervising': 'Supervising legal practitioner of a community legal service',
      },
      'otherPlaceType': {
        'principal': 'Principal of a law practice',
        'employee': 'Employee of a law practice',
        'corporate': 'Corporate legal practitioner',
        'government': 'Government legal practitioner',
        'volunteer': 'Volunteer of a community legal service (a volunteer PC will only be granted to an applicant who will be volunteering with a community legal service registered with the Law Society, and, will not be granted to an applicant residing or have a PPP outside of Australia)',
      },
      'otherPrincipalType': {
        'sole': 'Sole practitioner',
        'incorporated': 'Principal of an Incorporated Legal Practice',
        'partner': 'Partner of a law firm',
        'supervising': 'Supervising legal practitioner of a community legal service',
      },
    };
    
    const updates: any = {
      [name]: type === 'checkbox' ? target.checked : value,
    };
    
    // Add text field for checkboxes
    if (type === 'checkbox' && checkboxTextMap[name]) {
      updates[`${name}Text`] = checkboxTextMap[name];
    }
    
    // Add text field for radio buttons (yes/no or specific options)
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

  const handleBlur = (fieldName: string, value: string) => {
    let err = '';
    if (fieldName === 'dateOfBirth' || fieldName === 'dateOfAdmission') {
      if (!value.trim()) {
        err = fieldName === 'dateOfBirth' ? 'Date of birth is required' :
              'Date of admission is required';
      }
    }
    else if (fieldName === 'surname' && !value.trim()) err = 'Surname is required';
    else if (fieldName === 'firstName' && !value.trim()) err = 'First name is required';
    else if (fieldName === 'personalEmail') err = getEmailValidationError(value, { required: true, requiredMessage: 'Personal email is required' });
    else if (fieldName === 'practicePublicEmail') err = getEmailValidationError(value);
    else if (fieldName === 'otherEmail') err = getEmailValidationError(value);
    else if (fieldName === 'placeOfBirth' && !value.trim()) err = 'Place of birth is required';
    else if (fieldName === 'countryOfBirth' && !value.trim()) err = 'Country of birth is required';
    else if (fieldName === 'stateOfAdmission' && !value.trim()) err = 'State or Territory of admission is required';
    else if (fieldName === 'admissionConditionDetails' && !value.trim()) err = 'Please provide details';
    else if (/^(residential|service|postal)(Street|City|State|Postcode|Country)$/.test(fieldName) && !value.trim()) {
      const label = fieldName.replace(/^(residential|service|postal)/, '').replace(/([A-Z])/g, ' $1').trim().toLowerCase();
      err = `${label.charAt(0).toUpperCase() + label.slice(1)} is required`;
    }
    setErrors(prev => ({ ...prev, [fieldName]: err }));
  };



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

    const ne: typeof errors = { ...errors };
    // Reset all
    (Object.keys(ne) as (keyof typeof ne)[]).forEach(k => { (ne as any)[k] = ''; });

    // Section 1
    if (!formData.principalPlace) ne.principalPlace = 'Please select your principal place of practice';
    if (formData.principalPlace === 'outside' && !formData.foreignJurisdiction.trim()) ne.foreignJurisdiction = 'Foreign jurisdiction is required';
    // Section 2
    if (!formData.surname.trim()) ne.surname = 'Surname is required';
    if (!formData.firstName.trim()) ne.firstName = 'First name is required';
    if (!formData.title.trim()) ne.title = 'Title is required';
    if (!formData.gender) ne.gender = 'Gender is required';
    if (!formData.dateOfBirth.trim()) ne.dateOfBirth = 'Date of birth is required';
    if (!formData.placeOfBirth.trim()) ne.placeOfBirth = 'Place of birth is required';
    if (!formData.countryOfBirth.trim()) ne.countryOfBirth = 'Country of birth is required';
    ne.personalEmail = getEmailValidationError(formData.personalEmail, { required: true, requiredMessage: 'Personal email is required' });
    // Section 3
    if (!formData.stateOfAdmission.trim()) ne.stateOfAdmission = 'State or Territory of admission is required';
    if (!formData.dateOfAdmission.trim()) ne.dateOfAdmission = 'Date of admission is required';
    if (!formData.admissionCondition) ne.admissionCondition = 'Please select an option';
    if (formData.admissionCondition === 'yes' && !formData.admissionConditionDetails.trim()) ne.admissionConditionDetails = 'Please provide details';
    if (!formData.admittedOtherJurisdictions) ne.admittedOtherJurisdictions = 'Please select an option';
    if (formData.admittedOtherJurisdictions === 'yes') {
      if (!formData.additionalAdmissionDetails.trim()) ne.additionalAdmissionDetails = 'Additional admission details are required';
      if (!attachments.certificateAttachment) ne.certificateAttachment = 'Certificate of Fitness is required';
    }
    // Section 4
    if (!formData.intendToEngageLegalPractice) ne.intendToEngageLegalPractice = 'Please select an option';
    if (formData.intendToEngageLegalPractice === 'yes' || formData.intendToEngageLegalPractice === 'no') {
      if (!formData.practiceType) ne.practiceType = 'Please select a practice type';
    }

    if (formData.intendToEngageLegalPractice === 'yes') {
      if (formData.practiceType === 'principal' && !formData.practiceSpecify) ne.practiceSpecify = 'Please specify';
      if (formData.practiceType === 'principal' && formData.practiceSpecify === 'incorporated' && !attachments.asicExtractAttachment) {
        ne.asicExtractAttachment = 'ASIC extract is required';
      }
      if (!formData.pcEffectiveDate) {
        ne.pcEffectiveDate = 'Effective date is required';
      } else {
        // date picker enforces minDate, no further validation needed
      }
      if (!formData.practiceEmployerName.trim()) ne.practiceEmployerName = 'Name of place of practice/employer is required';
      if (!formData.practiceStreet.trim()) ne.practiceStreet = 'Address is required';
      if (!formData.practiceCity.trim()) ne.practiceCity = 'City is required';
      if (!formData.practiceState.trim()) ne.practiceState = 'State is required';
      if (!formData.practicePostcode.trim()) ne.practicePostcode = 'Postcode is required';
      if (!formData.practiceCountry) ne.practiceCountry = 'Country is required';
      ne.practicePublicEmail = getEmailValidationError(formData.practicePublicEmail || '');
    }
    // Section 5
    if (!formData.residentialStreet.trim()) ne.residentialStreet = 'Street address is required';
    if (!formData.residentialCity.trim()) ne.residentialCity = 'City is required';
    if (!formData.residentialState.trim()) ne.residentialState = 'State is required';
    if (!formData.residentialPostcode.trim()) ne.residentialPostcode = 'Postcode is required';
    if (!formData.residentialCountry.trim()) ne.residentialCountry = 'Country is required';
    if (!formData.serviceSameAsPractice) ne.serviceSameAsPractice = 'Please select an option';
    if (formData.serviceSameAsPractice === 'no') {
      if (!formData.serviceStreet.trim()) ne.serviceStreet = 'Street address is required';
      if (!formData.serviceCity.trim()) ne.serviceCity = 'City is required';
      if (!formData.serviceState.trim()) ne.serviceState = 'State is required';
      if (!formData.servicePostcode.trim()) ne.servicePostcode = 'Postcode is required';
      if (!formData.serviceCountry.trim()) ne.serviceCountry = 'Country is required';
    }
    if (!formData.postalSameAsPractice) ne.postalSameAsPractice = 'Please select an option';
    if (formData.postalSameAsPractice === 'no') {
      if (!formData.postalStreet.trim()) ne.postalStreet = 'Street address is required';
      if (!formData.postalCity.trim()) ne.postalCity = 'City is required';
      if (!formData.postalState.trim()) ne.postalState = 'State is required';
      if (!formData.postalPostcode.trim()) ne.postalPostcode = 'Postcode is required';
      if (!formData.postalCountry.trim()) ne.postalCountry = 'Country is required';
    }
    // Section 6
    if (formData.intendToEngageLegalPractice !== 'no') {
      if (!formData.multipleEntities) ne.multipleEntities = 'Please select an option';
      if (formData.multipleEntities === 'yes') {
        if (!formData.otherEmployerName.trim()) ne.otherEmployerName = 'Name of place of practice/employer is required';
        if (!formData.otherPlaceType.trim()) ne.otherPlaceType = 'Please select a practice type';
        if (formData.otherPlaceType === 'principal' && !(formData as any).otherPrincipalType.trim()) ne.otherPrincipalType = 'Please specify practice type';
        if (formData.otherPlaceType === 'principal' && (formData as any).otherPrincipalType === 'incorporated' && !attachments.otherAsicExtractAttachment) ne.otherAsicExtractAttachment = 'ASIC extract is required';
        if (!formData.otherStreet.trim()) ne.otherStreet = 'Street address is required';
        if (!formData.otherCity.trim()) ne.otherCity = 'City is required';
        if (!formData.otherState.trim()) ne.otherState = 'State is required';
        if (!formData.otherPostcode.trim()) ne.otherPostcode = 'Postcode is required';
        if (!formData.otherCountry.trim()) ne.otherCountry = 'Country is required';
        ne.otherEmail = getEmailValidationError(formData.otherEmail || '');
      }
    }
    // Section 7
    if (!formData.currentCertOtherJurisdiction) ne.currentCertOtherJurisdiction = 'Please select an option';
    if (formData.currentCertOtherJurisdiction === 'yes' && !formData.currentCertDetails.trim()) ne.currentCertDetails = 'Details are required';
    if (!formData.heldNSWPrevYear) ne.heldNSWPrevYear = 'Please select an option';
    if (formData.heldNSWPrevYear === 'yes' && !formData.cpdCompliant) ne.cpdCompliant = 'Please select an option';
    if (formData.heldNSWPrevYear === 'yes' && formData.cpdCompliant === 'no' && !formData.cpdDetails.trim()) ne.cpdDetails = 'Details are required';
    // Section 8
    if (!formData.fitAndProper) ne.fitAndProper = 'Please select an option';
    if (formData.fitAndProper === 'yes' && !attachments.fitAndProperAttachment) ne.fitAndProperAttachment = 'Statement attachment is required';
    // Section 9
    if (!formData.showCause) ne.showCause = 'Please select an option';
    if (formData.showCause === 'yes' && !attachments.showCauseAttachment) ne.showCauseAttachment = 'Show cause form is required';
    // Section 10
    if (!formData.lawSocietyMember) ne.lawSocietyMember = 'Please select an option';
    // Section 11
    if (!formData.declarationTruth) ne.declarationTruth = 'You must agree to this declaration';
    if (!formData.declarationApply) ne.declarationApply = 'You must agree to this declaration';
    if (!formData.declarationNoMatter) ne.declarationNoMatter = 'You must agree to this declaration';
    if (!formData.declarationMembership) ne.declarationMembership = 'You must agree to this declaration';
    if (!formData.declarationPrivacy) ne.declarationPrivacy = 'You must agree to this declaration';

    setErrors(ne);
    if (Object.values(ne).some(v => v !== '')) {
      setValidationSummary(getValidationSummary(ne));
      const firstErrorField = Object.keys(ne).find(key => ne[key as keyof typeof ne] !== '');
      if (firstErrorField) {
        focusFieldByName(firstErrorField);
      }
      return;
    }

    setValidationSummary([]);

    const includeOtherPlacesSection = formData.intendToEngageLegalPractice !== 'no';
    const yesNoText = (value: string) => value === 'yes' ? 'Yes' : value === 'no' ? 'No' : '';
    const principalPlaceTextMap: Record<string, string> = {
      nsw: 'New South Wales',
      outside: 'Exclusively outside of Australia',
      interstate: 'Interstate',
    };

    const practiceAddressForDerived = {
      street: formData.practiceStreet || '',
      street2: formData.practiceStreet2 || '',
      city: formData.practiceCity || '',
      state: formData.practiceState || '',
      postcode: formData.practicePostcode || '',
      country: formData.practiceCountry || '',
    };

    const serviceAddressForEform = formData.serviceSameAsPractice === 'yes'
      ? practiceAddressForDerived
      : {
          street: formData.serviceStreet || '',
          street2: formData.serviceStreet2 || '',
          city: formData.serviceCity || '',
          state: formData.serviceState || '',
          postcode: formData.servicePostcode || '',
          country: formData.serviceCountry || '',
        };

    const postalAddressForEform = formData.postalSameAsPractice === 'yes'
      ? practiceAddressForDerived
      : {
          street: formData.postalStreet || '',
          street2: formData.postalStreet2 || '',
          city: formData.postalCity || '',
          state: formData.postalState || '',
          postcode: formData.postalPostcode || '',
          country: formData.postalCountry || '',
        };

    const formType = FORM_TYPES.PRACTISING_CERTIFICATE_NEW;
    const formTypeShort = FORM_TYPES_SHORT.PRACTISING_CERTIFICATE_NEW;
    const submissionData = {
      formType,
      eligibility: { 
        principalPlace: formData.principalPlace,
        principalPlaceText: (formData as any).principalPlaceText || principalPlaceTextMap[formData.principalPlace] || '',
        foreignJurisdiction: formData.foreignJurisdiction || '' 
      },
      applicantDetails: {
        surname: formData.surname,
        firstName: formData.firstName,
        otherName: formData.otherName || '',
        preferredFirstName: formData.preferredFirstName || '',
        formerNames: formData.formerNames || '',
        title: formData.title,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        countryOfBirth: formData.countryOfBirth,
        aboriginalOrTSI: formData.aboriginalOrTSI || '',
      },
      admissionDetails: {
        lawyerAdmissionNumber: formData.lawyerAdmissionNumber || '',
        stateOfAdmission: formData.stateOfAdmission,
        dateOfAdmission: formData.dateOfAdmission,
        admissionCondition: formData.admissionCondition,
        admissionConditionText: (formData as any).admissionConditionText,
        admissionConditionDetails: formData.admissionConditionDetails || '',
        admittedOtherJurisdictions: formData.admittedOtherJurisdictions,
        admittedOtherJurisdictionsText: (formData as any).admittedOtherJurisdictionsText,
        additionalAdmissionDetails: formData.additionalAdmissionDetails || '',
      },
      practiceDetails: {
        intendToEngageLegalPractice: formData.intendToEngageLegalPractice,
        intendToEngageLegalPracticeText: (formData as any).intendToEngageLegalPracticeText,
        ...(formData.pcEffectiveDate ? { dateIntendedToCommence: formData.pcEffectiveDate } : {}),
        practiceType: formData.practiceType || '',
        practiceTypeText: (formData as any).practiceTypeText,
        practiceSpecify: formData.practiceSpecify || '',
        practiceSpecifyText: (formData as any).practiceSpecifyText,
        practiceEmployerName: formData.practiceEmployerName || '',
        practiceAddress: {
          street: formData.practiceStreet || '',
          street2: formData.practiceStreet2 || '',
          city: formData.practiceCity || '',
          state: formData.practiceState || '',
          postcode: formData.practicePostcode || '',
          country: formData.practiceCountry || '',
        },
        publicEmail: formData.practicePublicEmail || '',
      },
      addresses: {
        residential: { street: formData.residentialStreet, street2: formData.residentialStreet2, city: formData.residentialCity, state: formData.residentialState, postcode: formData.residentialPostcode, country: formData.residentialCountry },
        serviceSameAsPractice: yesNoText(formData.serviceSameAsPractice),
        service: serviceAddressForEform,
        postalSameAsPractice: yesNoText(formData.postalSameAsPractice),
        postal: postalAddressForEform,
      },
      ...(includeOtherPlacesSection ? {
        otherPlaces: {
          multipleEntities: formData.multipleEntities,
          multipleEntitiesText: (formData as any).multipleEntitiesText || yesNoText(formData.multipleEntities),
          otherPlace: formData.multipleEntities === 'yes' ? {
            name: formData.otherEmployerName || '',
            practiceType: formData.otherPlaceType || '',
            practiceTypeText: (formData as any).otherPlaceTypeText,
            principalType: (formData as any).otherPrincipalType || '',
            principalTypeText: (formData as any).otherPrincipalTypeText,
            address: {
              street: formData.otherStreet || '',
              street2: formData.otherStreet2 || '',
              city: formData.otherCity || '',
              state: formData.otherState || '',
              postcode: formData.otherPostcode || '',
              country: formData.otherCountry || '',
            },
            email: formData.otherEmail || '',
          } : null
        }
      } : {}),
      certificates: { 
        currentCertOtherJurisdiction: formData.currentCertOtherJurisdiction,
        currentCertOtherJurisdictionText: (formData as any).currentCertOtherJurisdictionText,
        ...(formData.currentCertOtherJurisdiction === 'yes' ? { currentCertDetails: formData.currentCertDetails || '' } : {}),
        heldNSWPrevYear: formData.heldNSWPrevYear,
        heldNSWPrevYearText: (formData as any).heldNSWPrevYearText,
        ...(formData.heldNSWPrevYear === 'yes' ? {
          cpdCompliant: formData.cpdCompliant,
          cpdCompliantText: (formData as any).cpdCompliantText,
          ...(formData.cpdCompliant === 'no' ? { cpdDetails: formData.cpdDetails || '' } : {}),
        } : {}),
      },
      fitAndProper: { 
        hasConcerns: formData.fitAndProper,
        hasConcernsText: (formData as any).fitAndProperText,
      },
      showCause: { 
        hasEvent: formData.showCause,
        hasEventText: (formData as any).showCauseText,
      },
      lawSocietyMembership: {
        lawSocietyMember: formData.lawSocietyMember,
        lawSocietyMemberText: (formData as any).lawSocietyMemberText || yesNoText(formData.lawSocietyMember),
      },
      declaration: {
        truthDeclaration: formData.declarationTruth,
        truthDeclarationText: (formData as any).declarationTruthText,
        applyDeclaration: formData.declarationApply,
        applyDeclarationText: (formData as any).declarationApplyText,
        noMatterDeclaration: formData.declarationNoMatter,
        noMatterDeclarationText: (formData as any).declarationNoMatterText,
        membershipDeclaration: formData.declarationMembership,
        membershipDeclarationText: (formData as any).declarationMembershipText,
        privacyDeclaration: formData.declarationPrivacy,
        privacyDeclarationText: (formData as any).declarationPrivacyText,
      },
      submittedAt: new Date().toISOString().replace('Z', '+00:00'),
    };

    try {
      // Use multi-entity fees when applicable so checkout price matches displayed totals.
      const activeFeeData = (formData.multipleEntities === 'yes' && multiEntityFeeData) ? multiEntityFeeData : feeData;
      if (!activeFeeData) {
        setSubmitError('Fee calculation is not ready yet. Please wait for the fee table to load and try again.');
        return;
      }

      setIsSubmitting(true);
      const formName = FORM_NAMES.PRACTISING_CERTIFICATE_NEW;
      const price = activeFeeData?.feeAmount ?? 0;
      const lawSocietyId = authenticatedLawSocietyId || formData.lawyerAdmissionNumber || '';

      const { submissionId, blobUrls } = await apiService.uploadAllAttachments(
        formType, lawSocietyId, formTypeShort, attachments
      );

      const fieldLabels: Record<string, string> = {
        surname: 'Surname', firstName: 'First Name', otherName: 'Middle/Other Names',
        preferredFirstName: 'Preferred First Name', formerNames: 'Former Names',
        title: 'Title', gender: 'Gender', dateOfBirth: 'Date of Birth',
        placeOfBirth: 'Place of Birth', countryOfBirth: 'Country of Birth',
        aboriginalOrTSI: 'Do you identify as an Australian Aboriginal or Torres Strait Islander?',
        lawyerAdmissionNumber: 'Lawyer/Admission Number',
        stateOfAdmission: 'State or Territory of Admission', dateOfAdmission: 'Date of Admission',
        admissionCondition: 'Have you had any condition imposed on your admission to the Australian legal profession?',
        admissionConditionDetails: 'Please provide details of any condition imposed on your admission',
        admittedOtherJurisdictions: 'Have you been admitted or registered to practise in any other Australian and/or foreign jurisdictions?',
        additionalAdmissionDetails: 'Additional Admission Details',
        principalPlace: 'I reasonably intend my principal place of practice to be',
        foreignJurisdiction: 'Foreign Jurisdiction',
        intendToEngageLegalPractice: 'Do you intend to engage in legal practice during the currency of the certificate?',
        dateIntendedToCommence: 'Effective date of your certificate',
        practiceType: 'I intend to engage in legal practice as a',
        practiceSpecify: 'Please specify', practiceEmployerName: 'Name of place of practice/employer',
        street: 'Street Address', street2: 'Street Address Line 2', city: 'City',
        state: 'State', postcode: 'Postcode', country: 'Country',
        publicEmail: 'Email for Publication', practicePublicEmail: 'Email for Publication',
        multipleEntities: 'Do you intend to practise with more than one entity?',
        name: 'Name of place of practice/employer',
        currentCertOtherJurisdiction: 'Do you hold a current practising certificate in another Australian jurisdiction?',
        currentCertDetails: 'Please provide details regarding your practising certificate(s) held in another Australian jurisdiction',
        heldNSWPrevYear: 'Did you hold an Australian practising certificate issued in NSW in the previous financial year?',
        cpdCompliant: 'Did you comply with your continuing professional development (CPD) requirements in the last CPD year?',
        cpdDetails: 'Please provide CPD details',
        hasConcerns: 'Is there any matter referred to in rule 13(1) of the Legal Profession Uniform General Rules 2015 which is applicable to you?',
        hasEvent: 'Is there any matter referred to in section 87 of the Legal Profession Uniform Law (NSW) which is applicable to you?',
        truthDeclaration: 'Declaration of Truth', applyDeclaration: 'Application Declaration',
        noMatterDeclaration: 'No Matter Declaration', membershipDeclaration: 'Membership Declaration',
        privacyDeclaration: 'Privacy Declaration',
        residential: 'Residential address',
        serviceSameAsPractice: 'Would you like your address for service to be that of your principal place of practice?',
        service: 'Address for service',
        postalSameAsPractice: 'Would you like your postal address to be that of your principal place of practice?',
        postal: 'Postal address',
        practiceAddress: 'Place of practice address',
        lawSocietyMember: 'Would you like to be a member of the Law Society?',
      };

      const sectionLabels: Record<string, string> = {
        eligibility: '1. Eligibility to Apply for a Practising Certificate',
        applicantDetails: '2. Applicant Details',
        admissionDetails: '3. Admission Details',
        practiceDetails: '4. Details of Principal Place of Practice (PPP)',
        addresses: '5. Other Address Details',
        ...(includeOtherPlacesSection ? { otherPlaces: '6. Details of any other place of practice' } : {}),
        certificates: `${7 + sectionOffsetAfter5}. Current or Previously Held Practising Certificates`,
        fitAndProper: `${8 + sectionOffsetAfter5}. Fit and Proper Person`,
        showCause: `${9 + sectionOffsetAfter5}. Show Cause Events`,
        lawSocietyMembership: `${10 + sectionOffsetAfter5}. Law Society Membership`,
        declaration: `${11 + sectionOffsetAfter5}. Declaration`,
      };

      const lineItems: StripeLineItem[] = [];
      const activeLogic = feeData?.logic ?? '';
      
      if ((activeFeeData?.feeFidelity ?? 0) > 0)
        lineItems.push({ name: 'Fidelity Fund', amountCents: Math.round((activeFeeData!.feeFidelity) * 100), hasGst: false });
      if ((activeFeeData?.feePc ?? 0) > 0)
        lineItems.push({ name: 'Practising Certificate', amountCents: Math.round((activeFeeData!.feePc) * 100), hasGst: false });
      if ((activeFeeData?.feeSm ?? 0) > 0) {
        const smName = activeLogic.includes('Associate') ? 'Associate Membership' : 'Solicitor Membership';
        lineItems.push({ name: smName, amountCents: Math.round((activeFeeData!.feeSm) * 100), hasGst: !activeLogic.includes('No GST') });
      }

      const result = await apiService.submitFormWithAttachments(
        formType, submissionId, submissionData, formName, formTypeShort, price,
        blobUrls, lawSocietyId, userEmail || '', userName || undefined,
        { businessUnit: '1000', sku: '80910', receiptCategory: 'registry' },
        fieldLabels,
        sectionLabels,
        activeFeeData?.feeSm ?? 0,
        activeLogic,
        lineItems
      );

      window.location.href = getCheckoutUrlOrThrow(result, apiService.getSafeCheckoutUrl);
    } catch (error) {
      console.error('Error submitting form');
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Helpers for rendering ──
  const clearDynamicFields = (name: string, value: string) => {
    if (name === 'principalPlace' && value !== 'outside') {
      setFormData(prev => ({ ...prev, foreignJurisdiction: '' }));
    }
    if (name === 'intendToEngageLegalPractice' && value === 'no') {
      setFormData(prev => ({
        ...prev,
        practiceType: '',
        practiceSpecify: '',
        practiceEmployerName: '',
        practiceStreet: '',
        practiceStreet2: '',
        practiceCity: '',
        practiceState: '',
        practicePostcode: '',
        practiceCountry: '',
        practicePublicEmail: '',
        multipleEntities: '',
        otherEmployerName: '',
        otherPlaceType: '',
        otherPrincipalType: '',
        otherStreet: '',
        otherStreet2: '',
        otherCity: '',
        otherState: '',
        otherPostcode: '',
        otherCountry: '',
        otherEmail: '',
      }));
      setAttachments(prev => ({ ...prev, asicExtractAttachment: null, otherAsicExtractAttachment: null }));
    }
    if (name === 'practiceSpecify' && value !== 'incorporated') {
      setAttachments(prev => ({ ...prev, asicExtractAttachment: null }));
    }
    if (name === 'otherPrincipalType' && value !== 'incorporated') {
      setAttachments(prev => ({ ...prev, otherAsicExtractAttachment: null }));
    }
  };

  const radioGroup = (name: string, options: { value: string; label: string }[], direction: 'row' | 'column' = 'row') => (
    <div style={{ display: 'flex', flexDirection: direction === 'row' ? 'row' : 'column', gap: direction === 'row' ? 20 : 8, marginTop: 8 }}>
      {options.map(opt => (
        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
          <input type="radio" name={name} value={opt.value} checked={(formData as any)[name] === opt.value}
            onChange={(e) => { handleChange(e); clearDynamicFields(name, opt.value); }} style={{ width: 14, height: 14, cursor: 'pointer' }} />
          <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
        </label>
      ))}
    </div>
  );

  const yesNo = (name: string, onYes?: () => void, onNo?: () => void) => (
    <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
      {['yes', 'no'].map(v => (
        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
          <input type="radio" name={name} value={v} checked={(formData as any)[name] === v}
            onChange={(e) => { handleChange(e); v === 'yes' ? onYes?.() : onNo?.(); }}
            style={{ width: 14, height: 14, cursor: 'pointer' }} />
          <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
        </label>
      ))}
    </div>
  );

  const errorMsg = (field: string) => {
    const val = errors[field as keyof typeof errors];
    return val ? <span className="error-message">{val}</span> : null;
  };

  const sectionDivider = <div className="section-divider" />;

  const pcYear = (() => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1=Jan ... 12=Dec
    const y = now.getFullYear();
    return month <= 6 ? `${y - 1}/${String(y).slice(2)}` : `${y}/${String(y + 1).slice(2)}`;
  })();

  const showOtherPlacesSection = formData.intendToEngageLegalPractice !== 'no';
  const sectionOffsetAfter5 = showOtherPlacesSection ? 0 : -1;

  const addressBlock = (prefix: string, heading: string, note?: string, lockedCountry?: string) => (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 8 }}>{heading} <span style={{ color: '#F26522' }}>*</span></h3>
      <FormField name={`${prefix}Street`} label="Street address: *" placeholder=""
        value={(formData as any)[`${prefix}Street`]} onChange={handleChange}
        onBlur={(ev: any) => handleBlur(`${prefix}Street`, ev.target.value)}
        error={errors[`${prefix}Street` as keyof typeof errors]} required />
      <div style={{ marginTop: 8 }}>
        <FormField name={`${prefix}Street2`} label="Street address line 2:" placeholder=""
          value={(formData as any)[`${prefix}Street2`]} onChange={handleChange} />
      </div>
      <div className="grid" style={{ marginTop: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
        <FormField name={`${prefix}City`} label="City: *" placeholder=""
          value={(formData as any)[`${prefix}City`]} onChange={handleChange}
          onBlur={(ev: any) => handleBlur(`${prefix}City`, ev.target.value)}
          error={errors[`${prefix}City` as keyof typeof errors]} required />
        <FormField name={`${prefix}State`} label="State: *" placeholder=""
          value={(formData as any)[`${prefix}State`]} onChange={handleChange}
          onBlur={(ev: any) => handleBlur(`${prefix}State`, ev.target.value)}
          error={errors[`${prefix}State` as keyof typeof errors]} required />
        <FormField name={`${prefix}Postcode`} label="Postcode: *" placeholder=""
          value={(formData as any)[`${prefix}Postcode`]} onChange={handleChange}
          onBlur={(ev: any) => handleBlur(`${prefix}Postcode`, ev.target.value)}
          error={errors[`${prefix}Postcode` as keyof typeof errors]} required />
      </div>
      <div style={{ marginTop: 8 }}>
        {lockedCountry ? (
          <div>
            <label style={{ display: 'block', fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 6 }}>
              Country <span style={{ color: '#F26522' }}>*</span>
            </label>
            <div style={{ width: '100%', padding: '15px', height: '56px', border: '1px solid #9EA5AB', borderRadius: 4, fontSize: 16, background: '#f5f5f5', color: '#0b1220', boxSizing: 'border-box', display: 'flex', alignItems: 'center', cursor: 'not-allowed', userSelect: 'none' }}>
              {lockedCountry}
            </div>
          </div>
        ) : (
          <CountrySelect name={`${prefix}Country`} label="Country: *"
            value={(formData as any)[`${prefix}Country`]} onChange={handleChange as any}
            error={errors[`${prefix}Country` as keyof typeof errors]} required />
        )}
      </div>
      {note && <p style={{ fontSize: 14, color: '#394F5A', marginTop: 8, lineHeight: '20px', fontStyle: 'italic' }}>{note}</p>}
    </div>
  );

  return (
    <div className="App page-root">
      <main className="form-container">
        <section className="form-card" style={{ padding: '22px 32px 80px 32px' }}>
          <Header
            title={"Application for Grant of an Australian Practising Certificate as a Solicitor"}
            subtitle={formData.principalPlace !== 'interstate' ? (
              <>
                Please read the <a href="https://pages.lawsociety.com.au/rs/822-OZD-837/images/Disclaimer-Only_2024-25%20Application%20for%20Grant%20of%20an%20Australian%20Practising%20Certificate%20as%20a%20Solicitor%20and%20Member.pdf?version=1" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>explanatory notes</a> before completing this application.
              </>
            ) : undefined}
          />

          <FormErrorSummary
            items={validationSummary}
            onSelect={focusFieldByName}
          />

          {/* ── Section 1: Eligibility ── */}
          <h2 className="section-title">1. Eligibility to Apply for a Practising Certificate</h2>

          <div style={{ marginTop: 12, marginBottom: 16 }}>
            {formData.principalPlace && formData.principalPlace !== 'interstate' && (
            <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginBottom:16}}>
              {formData.principalPlace !== 'outside' && formData.principalPlace !== 'interstate' && (
                <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
                  <strong>NOTE:</strong> If you are engaging in legal practice in Australia, you cannot make an application unless you reasonably intend that NSW will be your principal place of practice during the currency of the certificate applied for (<a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.44" target="_blank" rel="noreferrer">Section 44(4)</a> <em>Legal Profession Uniform Law (NSW)</em>).
                </p>
              )}
              {formData.principalPlace !== 'nsw' && formData.principalPlace !== 'interstate' && (
                <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:'8px 0 0'}}>
                  <strong>NOTE:</strong> If you intend to practise exclusively outside Australia, you are still entitled to apply for a practising certificate in New South Wales (Rule 18 <em>Legal Profession Uniform General Rules 2015 (NSW)</em>). In the case of a person who practises both within and outside Australia, the application is to be made by reference to the person's practice in Australia: <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.44" target="_blank" rel="noreferrer">section 44(4)</a> of the Uniform Law. For this purpose of determining the place where the application is to be made, the person's overseas practice is to be disregarded (even if it forms the principal portion of the person's overall practice), so that eligibility is determined by reference to the person's practice in Australia.
                </p>
              )}
            </div>
            )}

            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              I reasonably intend my principal place of practice to be: <span style={{ color: '#F26522' }}>*</span>
            </p>
            {formData.practiceType === 'volunteer' ? (
              <div style={{ display: 'flex', flexDirection: 'row', gap: 20, marginTop: 8 }}>
                {[
                  { value: 'nsw', label: 'New South Wales' },
                  { value: 'outside', label: 'Exclusively outside of Australia' },
                  { value: 'interstate', label: 'Interstate' },
                ].map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: opt.value !== 'nsw' ? 'not-allowed' : 'pointer', fontWeight: 400, opacity: opt.value !== 'nsw' ? 0.4 : 1 }}>
                    <input type="radio" name="principalPlace" value={opt.value}
                      checked={formData.principalPlace === opt.value}
                      disabled={opt.value !== 'nsw'}
                      onChange={(e) => { handleChange(e); clearDynamicFields('principalPlace', opt.value); }}
                      style={{ width: 14, height: 14, cursor: opt.value !== 'nsw' ? 'not-allowed' : 'pointer' }} />
                    <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            ) : radioGroup('principalPlace', [
              { value: 'nsw', label: 'New South Wales' },
              { value: 'outside', label: 'Exclusively outside of Australia' },
              { value: 'interstate', label: 'Interstate' },
            ])}
            {errorMsg('principalPlace')}

            {formData.principalPlace === 'interstate' && (
              <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '16px 20px', borderRadius: 4, marginTop: 12 }}>
                <p style={{ fontSize: 15, lineHeight: '24px', color: '#0b1220', margin: 0 }}>
                  Please do not complete this form. Instead, please contact the relevant Australian State/Territory regulatory authority that you intend to practise in.
                </p>
              </div>
            )}

            {formData.principalPlace === 'outside' && (
              <div style={{ marginTop: 16 }}>
                <FormField
                  name="foreignJurisdiction"
                  label="If practising exclusively outside of Australia, please indicate this foreign jurisdiction: *"
                  placeholder=""
                  value={formData.foreignJurisdiction}
                  onChange={handleChange}
                  onBlur={(e) => handleBlur('foreignJurisdiction', e.target.value)}
                  error={errors.foreignJurisdiction}
                />
              </div>
            )}
          </div>

          {sectionDivider}

          {formData.principalPlace !== 'interstate' && (<>
          <h2 className="section-title">2. Applicant Details</h2>

          <div className="grid" style={{ marginTop: 12 }}>
            <FormField name="surname" label="Surname: *" placeholder="" value={formData.surname}
              onChange={handleChange} onBlur={(ev: any) => handleBlur('surname', ev.target.value)}
              error={errors.surname} required
              readOnly={!!authSurname}
              style={!!authSurname ? { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' } : undefined} />
            <FormField name="firstName" label="First name: *" placeholder="" value={formData.firstName}
              onChange={handleChange} onBlur={(ev: any) => handleBlur('firstName', ev.target.value)}
              error={errors.firstName} required
              readOnly={!!authFirstName}
              style={!!authFirstName ? { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' } : undefined} />
          </div>

          <div className="grid" style={{ marginTop: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
            <FormField name="otherName" label="Middle/Other names:" placeholder="" value={formData.otherName} onChange={handleChange} />
            <FormField name="preferredFirstName" label="Preferred first name (if any):" placeholder="" value={formData.preferredFirstName} onChange={handleChange} />
            <FormField name="formerNames" label="Former names:" placeholder="" value={formData.formerNames} onChange={handleChange} />
          </div>

          <div style={{ display: 'none' }}>
            <FormField name="personalEmail" label="Personal email address: *" placeholder="" type="email"
              value={formData.personalEmail} onChange={handleChange}
              onBlur={(ev: any) => handleBlur('personalEmail', ev.target.value)} error={errors.personalEmail} required
              readOnly={!!userEmail}
              style={!!userEmail ? { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' } : undefined} />
            <FormField name="title" label="Title: *" placeholder="" value={formData.title}
              onChange={handleChange} onBlur={(ev: any) => handleBlur('title', ev.target.value)}
              error={errors.title} required
              readOnly={!!authTitle}
              style={!!authTitle ? { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' } : undefined} />
          </div>

          <div className="grid" style={{ marginTop: 16 }}>
            <div>
              <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                Gender: <span style={{ color: '#F26522' }}>*</span>
              </p>
              {radioGroup('gender', [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ])}
              {errorMsg('gender')}
            </div>
            <DateField label="Date of birth" name="dateOfBirth" value={formData.dateOfBirth}
              onChange={handleChange as any} onBlur={handleBlur} error={errors.dateOfBirth} required />
          </div>

          <div className="grid" style={{ marginTop: 8 }}>
            <FormField name="placeOfBirth" label="Place of birth: *" placeholder="" value={formData.placeOfBirth}
              onChange={handleChange} onBlur={(ev: any) => handleBlur('placeOfBirth', ev.target.value)}
              error={errors.placeOfBirth} required />
            <CountrySelect name="countryOfBirth" label="Country of birth *" value={formData.countryOfBirth}
              onChange={handleChange as any} error={errors.countryOfBirth} required />
          </div>

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Do you identify as an Australian Aboriginal or Torres Strait Islander?
            </p>
            {radioGroup('aboriginalOrTSI', [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ])}
          </div>

          {sectionDivider}

          {/* ── Section 3: Admission Details ── */}
          <h2 className="section-title">3. Admission Details</h2>

          <div className="grid" style={{ marginTop: 12 }}>
            <FormField name="lawyerAdmissionNumber" label="Lawyer/admission number:" placeholder=""
              value={formData.lawyerAdmissionNumber} onChange={handleChange} />
            {/* <div>
              <FormField name="stateOfAdmission" label="State or Territory of admission: *" placeholder=""
                value={formData.stateOfAdmission} onChange={handleChange}
                error={errors.stateOfAdmission} required />
            </div> */}
            <StateSelect name="stateOfAdmission" label="State or Territory of admission: *" value={formData.stateOfAdmission}
              onChange={handleChange as any} error={errors.stateOfAdmission} required />
          </div>

          <div style={{ marginTop: 8 }}>
            <DateField label="Date of admission (approximate)" name="dateOfAdmission" value={formData.dateOfAdmission}
              onChange={handleChange as any} onBlur={handleBlur} error={errors.dateOfAdmission} required
              maxDate={new Date()}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Have you had any condition imposed on your admission to the Australian legal profession? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="admissionCondition" value={v} checked={formData.admissionCondition === v}
                    onChange={(e) => { handleChange(e); if (v === 'yes') { setShowConditionDetails(true); } else { setShowConditionDetails(false); setFormData(prev => ({ ...prev, admissionConditionDetails: '' })); } }}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errorMsg('admissionCondition')}
          </div>

          {showConditionDetails && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 16, color: '#0b1220', marginBottom: 6 }}>
                Please provide details of any condition imposed on your admission to the Australian legal profession: <span style={{ color: '#F26522' }}>*</span>
              </label>
              <textarea name="admissionConditionDetails" value={formData.admissionConditionDetails}
                onChange={handleChange}
                onBlur={(ev) => handleBlur('admissionConditionDetails', ev.target.value)}
                style={{
                  width: 'calc(100% - 20px)', minHeight: 80, padding: '8px 10px',
                  border: `1px solid ${errors.admissionConditionDetails ? '#C0392B' : '#9EA5AB'}`,
                  borderRadius: 3, fontSize: 16, lineHeight: '24px', background: '#eaf0ff',
                  color: '#0b1220', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'content-box',
                }} />
              {errorMsg('admissionConditionDetails')}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Have you been admitted or registered to practise in any other Australian and/or foreign jurisdictions? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="admittedOtherJurisdictions" value={v} checked={formData.admittedOtherJurisdictions === v}
                    onChange={(e) => { handleChange(e); if (v === 'no') { setFormData(prev => ({ ...prev, additionalAdmissionDetails: '' })); } }}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errorMsg('admittedOtherJurisdictions')}
          </div>

          {formData.admittedOtherJurisdictions === 'yes' && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 16, color: '#0b1220', marginBottom: 6 }}>
                List the additional admission details: <span style={{ color: '#F26522' }}>*</span>
              </label>
              <textarea name="additionalAdmissionDetails" value={formData.additionalAdmissionDetails}
                onChange={handleChange}
                onBlur={(ev) => handleBlur('additionalAdmissionDetails', ev.target.value)}
                style={{
                  width: 'calc(100% - 20px)', minHeight: 80, padding: '8px 10px',
                  border: `1px solid ${errors.additionalAdmissionDetails ? '#C0392B' : '#9EA5AB'}`,
                  borderRadius: 3, fontSize: 16, lineHeight: '24px', background: '#eaf0ff',
                  color: '#0b1220', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'content-box',
                }} />
              {errorMsg('additionalAdmissionDetails')}
              <p style={{ fontSize: 14, color: '#394F5A', marginTop: 6, fontStyle: 'italic' }}>
                Provide the lawyer/admission number, admission jurisdiction, date of admission, and any admission conditions, for each other Australian and/or foreign jurisdiction where you have been admitted or registered to practice.
              </p>
            </div>
          )}

          {formData.admittedOtherJurisdictions === 'yes' && (
            <div id="certificateAttachment" style={{ marginTop: 16 }}>
              <p style={{ fontSize: 16, color: '#0b1220', marginBottom: 4, fontWeight: 600 }}>
                You must supply a Certificate of Fitness and Good Standing for any Australian jurisdiction (other than New South Wales) and/or foreign jurisdiction in which you have been admitted or registered to practice. <span style={{ color: '#F26522' }}>*</span>
              </p>
              <FileUploadField
                files={attachments.certificateAttachment}
                onFilesChange={(f) => { setAttachments(prev => ({ ...prev, certificateAttachment: f })); if (f) setErrors(prev => ({ ...prev, certificateAttachment: '' })); }}
                error={errors.certificateAttachment}
              />
              <p style={{ fontSize: 14, color: '#394F5A', marginTop: 8, fontStyle: 'italic' }}>
                A certificate of Fitness and Good Standing is only current for 28 days from the date of its issuance.
              </p>
            </div>
          )}

          {sectionDivider}

          {/* ── Section 4: Details of Principal Place of Practice ── */}
          <h2 className="section-title">4. Details of Principal Place of Practice (PPP)</h2>

          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Do you intend to engage in legal practice during the currency of the certificate applied for? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="intendToEngageLegalPractice" value={v} checked={formData.intendToEngageLegalPractice === v}
                    onChange={(e) => { handleChange(e); clearDynamicFields('intendToEngageLegalPractice', v); }}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errorMsg('intendToEngageLegalPractice')}
          </div>

          {formData.intendToEngageLegalPractice === 'yes' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 16 }}>
                <div>
                  <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                    I intend to engage in legal practice as a: <span style={{ color: '#F26522' }}>*</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {[
                      { value: 'principal', label: 'Principal of a law practice' },
                      { value: 'employee', label: 'Employee of a law practice' },
                      { value: 'corporate', label: 'Corporate legal practitioner' },
                      { value: 'government', label: 'Government legal practitioner' },
                      { value: 'volunteer', label: 'Volunteer of a community legal service (a volunteer PC will only be granted to an applicant who will be volunteering with a community legal service registered with the Law Society, and, will not be granted to an applicant residing or have a PPP outside of Australia)' },
                    ].map(opt => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" name="practiceType" value={opt.value} checked={formData.practiceType === opt.value}
                          onChange={(e) => {
                            // Explicitly set the value like PC Variation does
                            setFormData(prev => ({ 
                              ...prev, 
                              practiceType: opt.value, 
                              practiceTypeText: opt.label,
                              practiceSpecify: '', 
                              ...(opt.value === 'volunteer' ? { practiceCountry: 'Australia', residentialCountry: 'Australia', principalPlace: 'nsw' } : {}) 
                            }));
                            setAttachments(prev => ({ ...prev, asicExtractAttachment: null }));
                            if (errors.practiceType) setErrors(prev => ({ ...prev, practiceType: '' }));
                          }}
                          style={{ width: 14, height: 14, cursor: 'pointer', flexShrink: 0, marginTop: 3 }} />
                        <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
                      </label>
                    ))}
                  {errorMsg('practiceType')}
                  </div>
                </div>
                
                {formData.practiceType === 'principal' ? (
                  <div>
                    <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                      Please specify: <span style={{ color: '#F26522' }}>*</span>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {[
                        { value: 'sole', label: 'Sole practitioner' },
                        { value: 'incorporated', label: 'Principal of an Incorporated Legal Practice' },
                        { value: 'partner', label: 'Partner of a law firm' },
                        { value: 'supervising', label: 'Supervising legal practitioner of a community legal service' },
                      ].map(opt => (
                        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                          <input type="radio" name="practiceSpecify" value={opt.value} checked={formData.practiceSpecify === opt.value}
                            onChange={(e) => { handleChange(e); clearDynamicFields('practiceSpecify', opt.value); }}
                            style={{ width: 14, height: 14, cursor: 'pointer' }} />
                          <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {errorMsg('practiceSpecify')}
                  </div>
                ) : null}
              </div>

              {formData.practiceType === 'principal' && (
                <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '2px 20px', borderRadius: 4, marginTop: 10 }}>
                    <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: (formData.practiceSpecify !== 'supervising' ? 0 : 16) }}>
                      <strong>NOTE:</strong> To be eligible to hold a principal of a law practice PC, you must have satisfied the statutory condition of <a href="https://www.lawsociety.com.au/practising-law-in-NSW/working-as-a-solicitor-in-NSW/supervised-legal-practice" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522', whiteSpace: 'nowrap' }}>supervised legal practice (condition 2)</a> and completed an accredited practice management course (condition 3), among other requirements.
                    </p>
                    {formData.practiceSpecify !== 'supervising' && (
                      <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginTop: 16 }}>
                        <strong>NOTE: </strong>You must contribute to the <a href="https://www.lawsociety.com.au/practising-law-in-NSW/trust-money-and-fidelity-funds/legal-practitioners-fidelity-fund" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>Legal Practitioners Fidelity Fund</a> before practising in this manner. If you have not made a contribution to the fidelity fund for the current certificate year, you will be required to make payment as part of this application. You are not authorised to engage in legal practice as a principal of a law practice until payment has been received for the current certificate year.
                      </p>
                    )}
                </div>
              )}
            </>
          )}

          {formData.intendToEngageLegalPractice === 'no' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 16 }}>
                <div>
                  <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                    I am applying for a practising certificate as a: <span style={{ color: '#F26522' }}>*</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {[
                      { value: 'employee', label: 'Employee of a law practice' },
                      { value: 'corporate', label: 'Corporate legal practitioner' },
                      { value: 'government', label: 'Government legal practitioner' },
                    ].map(opt => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" name="practiceType" value={opt.value} checked={formData.practiceType === opt.value}
                          onChange={(e) => {
                            // Explicitly set the value like PC Variation does
                            setFormData(prev => ({ 
                              ...prev, 
                              practiceType: opt.value, 
                              practiceTypeText: opt.label,
                              practiceSpecify: '', 
                            }));
                            setAttachments(prev => ({ ...prev, asicExtractAttachment: null }));
                            if (errors.practiceType) setErrors(prev => ({ ...prev, practiceType: '' }));
                          }}
                          style={{ width: 14, height: 14, cursor: 'pointer', flexShrink: 0, marginTop: 3 }} />
                        <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
                      </label>
                    ))}
                  {errorMsg('practiceType')}
                  </div>
                </div>

              </div>

              <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '16px 20px', borderRadius: 4, marginTop: 16 }}>
                <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 12 }}>
                  <strong>NOTE:</strong> You may make an application for a practising certificate even if you do not presently intend to engage in legal practice. We will record you as not currently practising.
                </p>
                <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px' }}>
                  Should you commence engaging in legal practice, you must notify the Law Society Registry department of this within 7 days, by completing the relevant form <a href="/change-in-employment-details" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>here</a>.
                </p>
              </div>
            </>
          )}

          {formData.practiceType === 'employee' && (
            <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '2px 20px', borderRadius: 4, marginTop: 10 }}>
                <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginTop: 16 }}>
                  <strong>NOTE: </strong>You must contribute to the <a href="https://www.lawsociety.com.au/practising-law-in-NSW/trust-money-and-fidelity-funds/legal-practitioners-fidelity-fund" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>Legal Practitioners Fidelity Fund</a> before practising in this manner. If you have not made a contribution to the fidelity fund for the current certificate year, you will be required to make payment as part of this application. You are not authorised to engage in legal practice as an employee of a law practice until payment has been received for the current certificate year.
                </p>
            </div>
          )}

          {(formData.practiceType === 'corporate' || formData.practiceType === 'government') && (
            <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '2px 20px', borderRadius: 4, marginTop: 10 }}>
              <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 12 }}>
                <strong>NOTE:</strong> Please refer to the definition of a {formData.practiceType === 'corporate' ? 'corporate legal practitioner' : 'government legal practitioner'}, pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.6" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>section 6</a> of the Uniform Law. Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>section 47(1)</a> of the Uniform Law the holder is authorised to engage in legal practice as a corporate legal practitioner or government legal practitioner and also as a volunteer at a community legal service, or otherwise on a pro bono basis**.
              </p>
            </div>
          )}

          {formData.practiceType === 'volunteer' && (
            <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '2px 20px', borderRadius: 4, marginTop: 10 }}>
              <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 12 }}>
                <strong>NOTE:</strong> Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>section 47(1)</a> of the Uniform Law, the holder is authorised to engage in legal practice both as a volunteer at a community legal service and otherwise on a pro bono basis, only**.
              </p>
            </div>
          )}

          {formData.practiceSpecify === 'incorporated' && (
            <div id="asicExtractAttachment" style={{ marginTop: 16 }}>
              <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 12 }}>
                If you are being appointed as a principal of an existing Incorporated Legal Practice on our records, please upload a copy of a current ASIC extract evidencing your current appointment as a Director of the company. <span style={{ color: '#F26522' }}>*</span>
              </p>
              <FileUploadField
                files={attachments.asicExtractAttachment}
                onFilesChange={(f) => { setAttachments(prev => ({ ...prev, asicExtractAttachment: f })); if (f) setErrors(prev => ({ ...prev, asicExtractAttachment: '' })); }}
                error={errors.asicExtractAttachment}
              />
            </div>
          )}
          {formData.intendToEngageLegalPractice === 'yes' && (
          <>
            <div style={{ marginTop: 16 }}>
              <FormField name="practiceEmployerName" label="Name of place of practice/employer: *" placeholder=""
                value={formData.practiceEmployerName} onChange={handleChange}
                onBlur={(ev: any) => handleBlur('practiceEmployerName', ev.target.value)} error={errors.practiceEmployerName} required />
            </div>

            <div style={{ marginTop: 16 }}>
              <DateField
                name="pcEffectiveDate"
                label="Effective date of your practising certificate *"
                value={formData.pcEffectiveDate}
                minDate={new Date()}
                maxDate={pcEffectiveDateMax}
                allowFuture={true}
                onChange={handleChange}
                onBlur={(_name: string, val: string) => {
                  if (!val) { setErrors(prev => ({ ...prev, pcEffectiveDate: 'Effective date is required' })); return; }
                  setErrors(prev => ({ ...prev, pcEffectiveDate: '' }));
                }}
                error={errors.pcEffectiveDate}
              />
            </div>
            {showPcEffectiveDateWarning && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginBottom: 16}}>
                <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
                  <strong>IMPORTANT:</strong> This application is for the {warningFinancialYear} financial year ending <strong>{warningEndDate}</strong>. Only complete this application if you need a practising certificate prior to 1 July {pcEffectiveDateWarningEnd.getFullYear()}. Once issued, you will need to also submit a separate application for renewal of this practising certificate, effective from 1 July {pcEffectiveDateWarningEnd.getFullYear()}. You will receive a separate email inviting you to renew.
                </p>
              </div>
            )}
            

            <div style={{ marginTop: 8 }}>
              <FormField name="practiceStreet" label="Address of place of practice/employer: *" placeholder=""
                value={formData.practiceStreet} onChange={handleChange}
                onBlur={(ev: any) => handleBlur('practiceStreet', ev.target.value)} error={errors.practiceStreet} required />
            </div>
            <div style={{ marginTop: 8 }}>
              <FormField name="practiceStreet2" label="Address line two:" placeholder=""
                value={formData.practiceStreet2} onChange={handleChange} />
            </div>
            <div className="grid" style={{ marginTop: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
              <FormField name="practiceCity" label="City: *" placeholder="" value={formData.practiceCity}
                onChange={handleChange} onBlur={(ev: any) => handleBlur('practiceCity', ev.target.value)} error={errors.practiceCity} required />
              <FormField name="practiceState" label="State: *" placeholder="" value={formData.practiceState}
                onChange={handleChange} onBlur={(ev: any) => handleBlur('practiceState', ev.target.value)} error={errors.practiceState} required />
              <FormField name="practicePostcode" label="Postcode: *" placeholder="" value={formData.practicePostcode}
                onChange={handleChange} onBlur={(ev: any) => handleBlur('practicePostcode', ev.target.value)} error={errors.practicePostcode} required />
            </div>
            <div style={{ marginTop: 8 }}>
              {formData.practiceType === 'volunteer' ? (
                <div>
                  <label style={{ display: 'block', fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 6 }}>
                    Country <span style={{ color: '#F26522' }}>*</span>
                  </label>
                  <div style={{ width: '100%', padding: '15px', height: '56px', border: '1px solid #9EA5AB', borderRadius: 4, fontSize: 16, background: '#f5f5f5', color: '#0b1220', boxSizing: 'border-box', display: 'flex', alignItems: 'center', cursor: 'not-allowed', userSelect: 'none' }}>
                    Australia
                  </div>
                </div>
              ) : (
                <CountrySelect name="practiceCountry" label="Country *"
                  value={formData.practiceCountry} onChange={handleChange as any}
                  error={errors.practiceCountry} required />
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <FormField name="practicePublicEmail" label="Your email address for publication:" placeholder="" type="email"
                value={formData.practicePublicEmail} onChange={handleChange}
                onBlur={(ev: any) => handleBlur('practicePublicEmail', ev.target.value)} error={errors.practicePublicEmail} />
              <p style={{ fontSize: 14, color: '#394F5A', marginTop: 4, fontStyle: 'italic' }}>
                This is the email address that will be publicly displayed on the register of solicitors.
              </p>
            </div>
          </>
          )}

          {sectionDivider}

          {/* ── Section 5: Other Address Details ── */}
          <h2 className="section-title">5. Other Address Details</h2>

          {addressBlock('residential', 'Residential address:', 'This address will not be publicly displayed on the register of solicitors.', formData.practiceType === 'volunteer' ? 'Australia' : undefined)}

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Would you like your postal address to be that of your principal place of practice? <span style={{ color: '#F26522' }}>*</span>
            </p>
            {radioGroup('postalSameAsPractice', [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], 'column')}
            {errorMsg('postalSameAsPractice')}
          </div>

          {/* Show postal address when postal = no */}
          {formData.postalSameAsPractice === 'no' && (
            addressBlock('postal', 'Postal address:', 'Please provide an address that may be published, as your postal address will be displayed on the online register of solicitors.')
          )}

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Would you like your address for service to be that of your principal place of practice? <span style={{ color: '#F26522' }}>*</span>
            </p>
            {radioGroup('serviceSameAsPractice', [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], 'column')}
            {errorMsg('serviceSameAsPractice')}
          </div>

          {/* Show service address when service = no */}
          {formData.serviceSameAsPractice === 'no' && (
            addressBlock('service', 'Address for service:', 'Please provide an address that may be published, as your address for service will be displayed on the online register of solicitors. This cannot be a PO Box address.')
          )}

          {showOtherPlacesSection && (
            <>
              {sectionDivider}

              {/* ── Section 6: Other Places of Practice ── */}
              <h2 className="section-title">6. Details of any other place of practice</h2>

              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                  Do you intend to practise with more than one entity? <span style={{ color: '#F26522' }}>*</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {['yes', 'no'].map(v => (
                    <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                      <input type="radio" name="multipleEntities" value={v} checked={formData.multipleEntities === v}
                        onChange={(e) => {
                          // Explicitly set multipleEntities and clear all Section 6 dynamic fields
                          setFormData(prev => ({
                            ...prev,
                            multipleEntities: v,
                            otherEmployerName: '',
                            otherPlaceType: '',
                            otherPrincipalType: '',
                            otherStreet: '',
                            otherStreet2: '',
                            otherCity: '',
                            otherState: '',
                            otherPostcode: '',
                            otherCountry: '',
                            otherEmail: '',
                          }));
                          setAttachments(prev => ({
                            ...prev,
                            otherAsicExtractAttachment: null,
                          }));
                          setErrors(prev => ({
                            ...prev,
                            multipleEntities: '',
                            otherEmployerName: '',
                            otherPlaceType: '',
                            otherPrincipalType: '',
                            otherStreet: '',
                            otherCity: '',
                            otherState: '',
                            otherPostcode: '',
                            otherCountry: '',
                            otherAsicExtractAttachment: '',
                          }));
                        }}
                        style={{ width: 14, height: 14, cursor: 'pointer' }} />
                      <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                    </label>
                  ))}
                </div>
                {errorMsg('multipleEntities')}
              </div>

              {formData.multipleEntities === 'yes' && (
            <div style={{ marginTop: 20 }}>
              <FormField name="otherEmployerName" label="Name of place of practice/employer: *" placeholder=""
                value={formData.otherEmployerName} onChange={handleChange}
                onBlur={(ev: any) => handleBlur('otherEmployerName', ev.target.value)} error={errors.otherEmployerName} required />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 4 }}>
                <div>
                  <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                    I intend to engage in legal practice as a: <span style={{ color: '#F26522' }}>*</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {[
                      { value: 'principal', label: 'Principal of a law practice' },
                      { value: 'employee', label: 'Employee of a law practice' },
                      { value: 'corporate', label: 'Corporate legal practitioner' },
                      { value: 'government', label: 'Government legal practitioner' },
                      { value: 'volunteer', label: 'Volunteer of a community legal service (a volunteer PC will only be granted to an applicant who will be volunteering with a community legal service registered with the Law Society, and, will not be granted to an applicant residing or have a PPP outside of Australia)' },
                    ].map(opt => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" name="otherPlaceType" value={opt.value} checked={formData.otherPlaceType === opt.value}
                          onChange={(e) => {
                            // Explicitly set the value like PC Variation does
                            setFormData(prev => ({
                              ...prev,
                              otherPlaceType: opt.value,
                              otherPlaceTypeText: opt.label,
                              otherPrincipalType: '',
                              ...(opt.value === 'volunteer' ? { otherCountry: 'Australia' } : {})
                            }));
                            setAttachments(prev => ({ ...prev, otherAsicExtractAttachment: null }));
                            if (errors.otherPlaceType) setErrors(prev => ({ ...prev, otherPlaceType: '' }));
                          }}
                          style={{ width: 14, height: 14, cursor: 'pointer' }} />
                        <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {errorMsg('otherPlaceType')}
                </div>

                {formData.otherPlaceType === 'principal' ? (
                  <div>
                    <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                      Please specify: <span style={{ color: '#F26522' }}>*</span>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {[
                        { value: 'sole', label: 'Sole practitioner' },
                        { value: 'incorporated', label: 'Principal of an Incorporated Legal Practice' },
                        { value: 'partner', label: 'Partner of a law firm' },
                        { value: 'supervising', label: 'Supervising legal practitioner of a community legal service' },
                      ].map(opt => (
                        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                          <input type="radio" name="otherPrincipalType" value={opt.value} checked={(formData as any).otherPrincipalType === opt.value}
                            onChange={(e) => { handleChange(e); clearDynamicFields('otherPrincipalType', opt.value); }}
                            style={{ width: 14, height: 14, cursor: 'pointer' }} />
                          <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {errorMsg('otherPrincipalType')}
                  </div>
                ) : null}
              </div>

              {formData.otherPlaceType === 'principal' && (
                <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '4px 20px', borderRadius: 4, marginTop: 16 }}>
                  <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: (formData.practiceSpecify !== 'supervising' ? 0 : 16) }}>
                    <strong>NOTE:</strong> To be eligible to hold a principal of a law practice PC, you must have satisfied the statutory condition of <a href="https://www.lawsociety.com.au/practising-law-in-NSW/working-as-a-solicitor-in-NSW/supervised-legal-practice" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522', whiteSpace: 'nowrap' }}>supervised legal practice (condition 2)</a> and completed an accredited practice management course (condition 3), among other requirements.
                  </p>
                  {formData.otherPrincipalType !== 'supervising' && (
                    <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 16 }}>
                      You must contribute to the <a href="https://www.lawsociety.com.au/practising-law-in-NSW/trust-money-and-fidelity-funds/legal-practitioners-fidelity-fund" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>Legal Practitioners Fidelity Fund</a> before practising in this manner. If you have not made a contribution to the fidelity fund for the current certificate year, you will be required to make payment as part of this application. You are not authorised to engage in legal practice as a principal of a law practice until payment has been received for the current certificate year.
                    </p>
                  )}
                </div>
              )}

              {formData.otherPlaceType === 'employee' && (
                <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '16px 20px', borderRadius: 4, marginTop: 16 }}>
                  <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', margin: 0 }}>
                    You must contribute to the <a href="https://www.lawsociety.com.au/practising-law-in-NSW/trust-money-and-fidelity-funds/legal-practitioners-fidelity-fund" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>Legal Practitioners Fidelity Fund</a> before practising in this manner. If you have not made a contribution to the fidelity fund for the current certificate year, you will be required to make payment as part of this application. You are not authorised to engage in legal practice as an employee of a law practice until payment has been received for the current certificate year.
                  </p>
                </div>
              )}

              {(formData.otherPlaceType === 'corporate' || formData.otherPlaceType === 'government') && (
                <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '2px 20px', borderRadius: 4, marginTop: 10 }}>
                  <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 12 }}>
                    <strong>NOTE:</strong> Please refer to the definition of a {formData.otherPlaceType === 'corporate' ? 'corporate legal practitioner' : 'government legal practitioner'}, pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.6" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>section 6</a> of the Uniform Law. Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>section 47(1)</a> of the Uniform Law the holder is authorised to engage in legal practice as a corporate legal practitioner or government legal practitioner and also as a volunteer at a community legal service, or otherwise on a pro bono basis**.
                  </p>
                </div>
              )}
              
              {formData.otherPlaceType === 'volunteer' && (
                <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '2px 20px', borderRadius: 4, marginTop: 10 }}>
                  <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 12 }}>
                    <strong>NOTE:</strong> Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>section 47(1)</a> of the Uniform Law, the holder is authorised to engage in legal practice both as a volunteer at a community legal service and otherwise on a pro bono basis, only**.
                  </p>
                </div>
              )}

              {(formData as any).otherPrincipalType === 'incorporated' && (
                <div id="otherAsicExtractAttachment" style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 12 }}>
                    If you are being appointed as a principal of an existing Incorporated Legal Practice on our records, please upload a copy of a current ASIC extract evidencing your current appointment as a Director of the company. <span style={{ color: '#F26522' }}>*</span>
                  </p>
                  <FileUploadField
                    files={attachments.otherAsicExtractAttachment}
                    onFilesChange={(f) => { setAttachments(prev => ({ ...prev, otherAsicExtractAttachment: f })); if (f) setErrors(prev => ({ ...prev, otherAsicExtractAttachment: '' })); }}
                    error={errors.otherAsicExtractAttachment}
                  />
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <FormField name="otherStreet" label="Address of place of practice/employer: *" placeholder=""
                  value={formData.otherStreet} onChange={handleChange}
                  onBlur={(ev: any) => handleBlur('otherStreet', ev.target.value)} error={errors.otherStreet} required />
                <div style={{ marginTop: 8 }}>
                  <FormField name="otherStreet2" label="Address line 2:" placeholder=""
                    value={formData.otherStreet2} onChange={handleChange} />
                </div>
                <div className="grid" style={{ marginTop: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <FormField name="otherCity" label="City: *" placeholder="" value={formData.otherCity}
                    onChange={handleChange} onBlur={(ev: any) => handleBlur('otherCity', ev.target.value)} error={errors.otherCity} required />
                  <FormField name="otherState" label="State: *" placeholder=""
                    value={formData.otherState} onChange={handleChange}
                    error={errors.otherState} required />
                  <FormField name="otherPostcode" label="Postcode: *" placeholder="" value={formData.otherPostcode}
                    onChange={handleChange} onBlur={(ev: any) => handleBlur('otherPostcode', ev.target.value)} error={errors.otherPostcode} required />
                </div>
                <div style={{ marginTop: 8 }}>
                  {formData.otherPlaceType === 'volunteer' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 6 }}>
                        Country <span style={{ color: '#F26522' }}>*</span>
                      </label>
                      <div style={{ width: '100%', padding: '15px', height: '56px', border: '1px solid #9EA5AB', borderRadius: 4, fontSize: 16, background: '#f5f5f5', color: '#0b1220', boxSizing: 'border-box', display: 'flex', alignItems: 'center', cursor: 'not-allowed', userSelect: 'none' }}>
                        Australia
                      </div>
                    </div>
                  ) : (
                    <CountrySelect name="otherCountry" label="Country: *"
                      value={formData.otherCountry} onChange={handleChange as any}
                      error={errors.otherCountry} required />
                  )}
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <FormField name="otherEmail" label="Your email address for publication:" placeholder="" type="email"
                  value={formData.otherEmail} onChange={handleChange}
                  onBlur={(ev: any) => handleBlur('otherEmail', ev.target.value)} error={errors.otherEmail} />
                <p style={{ fontSize: 14, color: '#394F5A', marginTop: 4, fontStyle: 'italic' }}>
                  This is the email address that will be publicly displayed on the register of solicitors.
                </p>
              </div>

              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginTop:20}}>
                <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
                  <strong>NOTE:</strong> If you will be practising with more than 2 entities, please email the Law Society Registry Department with the additional details at{' '}
                  <a href="mailto:registry@lawsociety.com.au" style={{color:'#F26522',textDecoration:'none'}}>registry@lawsociety.com.au</a> after submitting this form.
                </p>
              </div>
            </div>
              )}
            </>
          )}

          {sectionDivider}

          {/* ── Section 7: Current or Previously Held Practising Certificates ── */}
          <h2 className="section-title">{`${7 + sectionOffsetAfter5}. Current or Previously Held Practising Certificates`}</h2>

          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4, lineHeight: '24px' }}>
              Do you hold a current practising certificate, as a solicitor or a barrister, in another Australian jurisdiction as at the date of this application? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="currentCertOtherJurisdiction" value={v} checked={formData.currentCertOtherJurisdiction === v}
                    onChange={handleChange}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errorMsg('currentCertOtherJurisdiction')}
          </div>

          {formData.currentCertOtherJurisdiction === 'yes' && (
            <>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 16, color: '#0b1220', marginBottom: 6 }}>
                  Please provide details regarding your practising certificate(s) held in another Australian jurisdiction: <span style={{ color: '#F26522' }}>*</span>
                </label>
                <textarea name="currentCertDetails" value={formData.currentCertDetails}
                  onChange={handleChange}
                  onBlur={(ev) => handleBlur('currentCertDetails', ev.target.value)}
                  style={{
                    width: 'calc(100% - 20px)', minHeight: 100, padding: '8px 10px',
                    border: `1px solid ${errors.currentCertDetails ? '#C0392B' : '#9EA5AB'}`,
                    borderRadius: 3, fontSize: 16, lineHeight: '24px', background: '#eaf0ff',
                    color: '#0b1220', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'content-box',
                  }} />
                {errorMsg('currentCertDetails')}
                <p style={{ fontSize: 14, color: '#394F5A', marginTop: 8, fontStyle: 'italic' }}>
                  Please ensure that you have already attached a current Certificate of Fitness and Good Standing from the appropriate regulatory authority under '<strong>3. Admission Details</strong>'.
                </p>
              </div>

              <div style={{ backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '16px 20px', borderRadius: 4, marginTop: 16 }}>
                <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 0 }}>
                  <strong>NOTE:</strong> You are not permitted to concurrently hold two Australian practising certificates. Please note that this other practising certificate will need to be surrendered before your New South Wales practising certificate may be issued.
                </p>
              </div>
            </>
          )}

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4, lineHeight: '24px' }}>
              Did you hold an Australian practising certificate, issued in New South Wales, authorising you to practise as a solicitor in the previous financial year? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="heldNSWPrevYear" value={v} checked={formData.heldNSWPrevYear === v}
                    onChange={handleChange}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errorMsg('heldNSWPrevYear')}
          </div>

          {formData.heldNSWPrevYear === 'yes' && (
            <>
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4, lineHeight: '24px' }}>
                  Did you comply with your continuing professional development (CPD) requirements in the last CPD year? <span style={{ color: '#F26522' }}>*</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {['yes', 'no'].map(v => (
                    <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                      <input type="radio" name="cpdCompliant" value={v} checked={formData.cpdCompliant === v}
                        onChange={handleChange}
                        style={{ width: 14, height: 14, cursor: 'pointer' }} />
                      <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                    </label>
                  ))}
                </div>
                {errorMsg('cpdCompliant')}
              </div>

              {formData.cpdCompliant === 'no' && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, color: '#0b1220', marginBottom: 6 }}>
                    Please provide details of your non-compliance: <span style={{ color: '#F26522' }}>*</span>
                  </label>
                  <textarea name="cpdDetails" value={formData.cpdDetails}
                    onChange={handleChange}
                    onBlur={(ev) => handleBlur('cpdDetails', ev.target.value)}
                    style={{
                      width: 'calc(100% - 20px)', minHeight: 100, padding: '8px 10px',
                      border: `1px solid ${errors.cpdDetails ? '#C0392B' : '#9EA5AB'}`,
                      borderRadius: 3, fontSize: 16, lineHeight: '24px', background: '#eaf0ff',
                      color: '#0b1220', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'content-box',
                    }} />
                  {errorMsg('cpdDetails')}
                </div>
              )}
            </>
          )}

          {sectionDivider}

          {/* ── Section 8: Fit and Proper Person ── */}
          <h2 className="section-title">{`${8 + sectionOffsetAfter5}. Fit and Proper Person`}</h2>

          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 16, color: '#0b1220', marginBottom: 12, lineHeight: '24px' }}>
              Is there any matter (including a finding, conduct or event) referred to in <a href="https://legislation.nsw.gov.au/view/html/inforce/current/sl-2015-0246#sec.13" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>rule 13(1)</a> of the <em>Legal Profession Uniform General Rules 2015 (Rules)</em> which is applicable to you and which you have not previously disclosed in writing to the Law Society? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="fitAndProper" value={v} checked={formData.fitAndProper === v}
                    onChange={(e) => { handleChange(e); if (v === 'yes') { setShowFitAttachment(true); } else { setShowFitAttachment(false); setAttachments(prev => ({ ...prev, fitAndProperAttachment: null })); } }}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errorMsg('fitAndProper')}
            <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginTop:12}}>
              <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
                <strong>NOTE:</strong> You must still disclose such matters even if you have already disclosed them to the Legal Profession Admissions Board (or the equivalent in another jurisdiction) at the time of admission or to a body that issued you with a practising certificate in another jurisdiction.
              </p>
            </div>

            {formData.fitAndProper === 'yes' && (
              <div id="fitAndProperAttachment" style={{ marginTop: 16 }}>
                <p style={{ fontSize: 15, color: '#0b1220', lineHeight: '22px', marginBottom: 12 }}>
                  Please attach a completed statement in accordance with <a href="https://legislation.nsw.gov.au/view/html/inforce/current/sl-2015-0246#sec.12" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>rule 12</a> of the <em>Rules</em> which addresses all of the matters in <a href="https://legislation.nsw.gov.au/view/html/inforce/current/sl-2015-0246#sec.13" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>rule 13</a> relevant to you that you have not previously disclosed, including why you are a fit and proper person to hold an Australian practising certificate notwithstanding the matter disclosed: <span style={{ color: '#F26522' }}>*</span>
                </p>
                <FileUploadField
                  files={attachments.fitAndProperAttachment}
                  onFilesChange={(f) => { setAttachments(prev => ({ ...prev, fitAndProperAttachment: f })); if (f) setErrors(prev => ({ ...prev, fitAndProperAttachment: '' })); }}
                  error={errors.fitAndProperAttachment}
                />
              </div>
            )}
          </div>

          {sectionDivider}

          {/* ── Section 9: Show Cause Events ── */}
          <h2 className="section-title">{`${9 + sectionOffsetAfter5}. Show Cause Events`}</h2>

          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 16, color: '#0b1220', marginBottom: 12, lineHeight: '24px' }}>
              Is there any matter referred to in <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.87" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 87</a> of the <em>Legal Profession Uniform Law (NSW)</em> which is applicable to you and which you have not previously disclosed in writing to the Law Society? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="showCause" value={v} checked={formData.showCause === v}
                    onChange={(e) => { handleChange(e); if (v === 'yes') { setShowCauseAttachment(true); } else { setShowCauseAttachment(false); setAttachments(prev => ({ ...prev, showCauseAttachment: null })); } }}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errorMsg('showCause')}
            <p style={{ fontSize: 14, color: '#394F5A', lineHeight: '20px', marginTop: 12 }}>
              An automatic show cause event is a bankruptcy-related event, a conviction for a serious offence or a tax offence. Please refer to sections 86 and 87, and the definitions in section 6, of the <em>Legal Profession Uniform Law (NSW)</em> to determine if you are required to provide a statement. For further details, please refer to <a href="https://www.lawsociety.com.au/practising-law-in-NSW/rules-and-legislation/show-cause-events" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>this page</a>.
            </p>
            {showCauseAttachment && (
              <div id="showCauseAttachment" style={{ marginTop: 12 }}>
                <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginBottom:16}}>
                  <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
                    <strong>NOTE:</strong> Please complete and submit a <a href="https://www.lawsociety.com.au/sites/default/files/2018-03/Statement%20ASCE.pdf" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>'Notice of Show Cause Event'</a> form.
                  </p>
                </div>
                <label style={{ fontSize: 16, color: '#0b1220', display: 'block', marginBottom: 6 }}>
                  Please attach a completed &lsquo;Notice of Show Cause Event&rsquo; form: <span style={{ color: '#F26522' }}>*</span>
                </label>
                <FileUploadField
                  files={attachments.showCauseAttachment}
                  onFilesChange={(f) => { setAttachments(prev => ({ ...prev, showCauseAttachment: f })); if (f) setErrors(prev => ({ ...prev, showCauseAttachment: '' })); }}
                  error={errors.showCauseAttachment}
                />
              </div>
            )}
          </div>

          {sectionDivider}

          {/* ── Section 10: Law Society Membership ── */}
          <h2 className="section-title">{`${10 + sectionOffsetAfter5}. Law Society Membership`}</h2>

          <div style={{ marginTop: 12, marginBottom: 24 }}>
            <p style={{ fontSize: 16, color: '#0b1220', marginBottom: 12, lineHeight: '24px' }}>
              Would you like to be a member of the Law Society? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 16, color: '#0b1220', fontWeight: 'normal' }}>
                  <input type="radio" name="lawSocietyMember" value={opt.value}
                    checked={formData.lawSocietyMember === opt.value}
                    onChange={handleChange}
                    style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  {opt.label}
                </label>
              ))}
            </div>
            {errorMsg('lawSocietyMember')}
          </div>

          {sectionDivider}

          {/* ── Section 11: Declaration ── */}
          <h2 className="section-title">{`${11 + sectionOffsetAfter5}. Declaration`}</h2>

          <div style={{ marginTop: 12, marginBottom: 16 }}>
            {[
              { name: 'declarationTruth', text: 'I declare that the contents of this application are true and correct;' },
              { name: 'declarationApply', text: 'I wish to apply for an Australian practising certificate and have my name entered in the register of local practising certificates in New South Wales;' },
              { name: 'declarationMembership', text: `I acknowledge that payment of the Membership Fee indicates that I also wish to be a Solicitor Member of the Law Society of New South Wales for the ${pcYear} year;` },
            ].map(decl => (
              <div key={decl.name} style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" name={decl.name} checked={(formData as any)[decl.name]}
                    onChange={handleChange}
                    style={{ width: 14, height: 14, marginTop: 3, flexShrink: 0, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, lineHeight: '24px', color: '#0b1220' }}>
                    {decl.text} <span style={{ color: '#F26522' }}>*</span>
                  </span>
                </label>
                {errorMsg(decl.name)}
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" name="declarationNoMatter" checked={(formData as any).declarationNoMatter}
                  onChange={handleChange}
                  style={{ width: 14, height: 14, marginTop: 3, flexShrink: 0, cursor: 'pointer' }} />
                <span style={{ fontSize: 16, lineHeight: '24px', color: '#0b1220' }}>
                  I declare that I am not aware of any matter (including a finding, conduct or event) referred to in <a href="https://legislation.nsw.gov.au/view/html/inforce/current/sl-2015-0246#sec.13" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>rule 13(1)</a> of the <em>Legal Profession Uniform General Rules 2015</em> or any Automatic Show Cause event within the meaning of <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.87" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 87</a> of the <em>Legal Profession Uniform Law (NSW)</em> which would affect my fitness to hold a practising certificate, other than that which is disclosed above and in respect of which I have provided a statement under <a href="https://legislation.nsw.gov.au/view/html/inforce/current/sl-2015-0246#sec.12" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>rule 12</a>, or which I have previously disclosed; <span style={{ color: '#F26522' }}>*</span>
                </span>
              </label>
              {errorMsg('declarationNoMatter')}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" name="declarationPrivacy" checked={formData.declarationPrivacy}
                  onChange={handleChange}
                  style={{ width: 14, height: 14, marginTop: 3, flexShrink: 0, cursor: 'pointer' }} />
                <span style={{ fontSize: 16, lineHeight: '24px', color: '#0b1220' }}>
                  I have read the <a href="https://www.lawsociety.com.au/privacy-policy/personal-information-collection-notice" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>Personal Information Collection Notice</a> before providing my personal information and agree to the below terms: <span style={{ color: '#F26522' }}>*</span>
                </span>
              </label>
              {errorMsg('declarationPrivacy')}
            </div>

            <div style={{ marginLeft: 24, marginBottom: 12 }}>
              <p style={{ fontSize: 14, lineHeight: '22px', color: '#394F5A', margin: 0 }}>
                Please <a href="https://pages.lawsociety.com.au/rs/822-OZD-837/images/Disclaimer-Only_2024-25 Application for Grant of an Australian Practising Certificate as a Solicitor and Member.pdf?version=1" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>click here</a> to read the general notes and explanatory notes
              </p>
            </div>

            <div style={{ marginLeft: 24, marginTop: 8, marginBottom: 16, fontSize: 14, color: '#394F5A', lineHeight: '22px' }}>
              <p style={{ marginBottom: 8 }}>
                The Law Society of New South Wales respects your privacy and the confidentiality and security of personal information provided by you to us. The information provided by you to the Law Society on this form will be used by the Law Society for the purposes of communicating with you in relation to our regulatory functions with our{' '}
                <a href="https://www.lawsociety.com.au/privacy-policy/personal-information-collection-notice" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522' }}>Personal Information Collection Notice</a>.
              </p>

            </div>
          </div>

          {sectionDivider}

          {/* ── Section 12: Schedule of Fees and Payment ── */}
          <h2 className="section-title">{`${12 + sectionOffsetAfter5}. Schedule of Fees and Payment`}</h2>

          <div style={{ marginTop: 12, marginBottom: 24 }}>
            {feeError && (
              <div style={{ color: '#c0392b', fontSize: 14, marginBottom: 12 }}>{feeError}</div>
            )}

            {(() => {
              const isMultiEntity = formData.multipleEntities === 'yes';
              const categoryColumnCount = isMultiEntity ? 2 : 1;
              const totalColumns = 4 + categoryColumnCount;

              return (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: 'calc(100% - 30px)', borderCollapse: 'collapse', fontSize: 14, minWidth: 560, border: '1px solid #b0a898', marginLeft: 15, marginRight: 15 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#cfc3b0' }}>
                        {[
                          ...(isMultiEntity
                            ? [
                                { label: 'PC Category (Entity 1)', align: 'left' as const },
                                { label: 'PC Category (Entity 2)', align: 'left' as const },
                              ]
                            : [
                                { label: 'Practising Certificate Category', align: 'left' as const },
                              ]),
                          { label: 'Practising Certificate Fee',      align: 'right' as const },
                          { label: 'Fidelity Fund Contribution',      align: 'right' as const },
                          { label: 'Membership Fee',                  align: 'right' as const },
                          { label: 'Total Fee',                       align: 'right' as const },
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
                        {(multiEntityFeeLoading || (formData.multipleEntities === 'yes' && !formData.otherPlaceType)) ? (
                          <td colSpan={totalColumns} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontStyle: 'italic' }}>
                            {formData.multipleEntities === 'yes' && !formData.otherPlaceType 
                              ? 'Complete both practice types to see your fees.'
                              : 'Calculating fees…'}
                          </td>
                        ) : feeLoading ? (
                          <td colSpan={totalColumns} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontStyle: 'italic' }}>
                            Calculating fees…
                          </td>
                        ) : formData.practiceType ? (
                          (() => {
                            // Use multi-entity fees if applicable, otherwise use single-entity fees
                            const activeFeeData = (formData.multipleEntities === 'yes' && multiEntityFeeData) ? multiEntityFeeData : feeData;
                            if (!activeFeeData) {
                              return (
                                <td colSpan={totalColumns} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontStyle: 'italic' }}>
                                  Complete practice type, practice country and date of admission above to see your fees.
                                </td>
                              );
                            }
                            
                            const smApplies = formData.lawSocietyMember !== 'no' && !!activeFeeData && activeFeeData.feeSm > 0;
                            const displayFeePc = activeFeeData?.feePc ?? 0;
                            const displayFeeFidelity = activeFeeData?.feeFidelity ?? 0;
                            const displayFeeSm = smApplies ? (activeFeeData?.feeSm ?? 0) : 0;
                            const displayTotal = smApplies ? (activeFeeData?.feeAmount ?? 0) : (displayFeePc + displayFeeFidelity);
                            
                            // Always show practice type label from Section 4
                            const practiceLabel = practiceTypeLabel(formData.practiceType);
                            const practiceLabelEntity2 = formData.otherPlaceType
                              ? practiceTypeLabel(formData.otherPlaceType)
                              : '—';
                            
                            return (
                              <>
                                <td style={{ padding: '10px 14px', textAlign: 'left', color: '#0b1220' }}>
                                  {practiceLabel}
                                </td>
                                {isMultiEntity && (
                                  <td style={{ padding: '10px 14px', textAlign: 'left', color: '#0b1220' }}>
                                    {practiceLabelEntity2}
                                  </td>
                                )}
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>
                                  {displayFeePc > 0 ? `$${displayFeePc.toFixed(0)}` : '—'}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>
                                  {displayFeeFidelity > 0 ? `$${displayFeeFidelity.toFixed(0)}` : '—'}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>
                                  {smApplies ? `$${displayFeeSm.toFixed(0)}` : '—'}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>
                                  <strong>${displayTotal.toFixed(0)}</strong>
                                </td>
                              </>
                            );
                          })()
                        ) : (
                          <td colSpan={totalColumns} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontStyle: 'italic' }}>
                            Complete practice type, practice country and date of admission above to see your fees.
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          <div style={{ marginTop: 16, marginBottom: 8, backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '16px 20px', borderRadius: 4 }}>
            <p style={{ fontSize: 15, lineHeight: '24px', color: '#0b1220', margin: 0 }}>
              <strong>NOTE:</strong> Please note that the Practising Certificate Fee and Fidelity Fund Contribution do not attract GST. The Membership Fee includes $40 GST ($400 when residing overseas).
            </p>
          </div>

          {sectionDivider}

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
          </>)}

          <Footer
            variant="registry"
            onSubmit={formData.principalPlace === 'interstate' ? () => { window.location.href = PC_NEW_INTERSTATE_EXIT_URL; } : handleSubmit}
            hideSubmit={false}
            submitLabel={formData.principalPlace === 'interstate' ? 'EXIT' : undefined}
            isSubmitting={isSubmitting}
            isSubmitDisabled={Boolean(attachmentLimitError)}
          />
        </section>
      </main>
    </div>
  );
}

export default PCNewForm;
