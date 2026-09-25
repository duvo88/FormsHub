import React, { useState, useEffect } from 'react';
import './App.css';
import './components/components.css';
import Header from './components/Header';
import Footer from './components/Footer';
import FormErrorSummary, { FormErrorSummaryItem } from './components/FormErrorSummary';
import FormField from './components/FormField';
import DateField from './components/DateField';
import apiService, { StripeLineItem } from './services/apiService';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useAuthPrefill } from './hooks/useAuthPrefill';
import CountrySelect from './components/CountrySelect';
import FileUploadField from './components/FileUploadField';
import { getEmailValidationError, getTotalAttachmentLimitError } from './utils/validation';
import { FORM_TYPES, FORM_TYPES_SHORT } from './constants/formTypes';
import { FORM_NAMES } from './constants/formNames';
import { getValidationSummary, focusFieldByName } from './utils/formErrorSummary';

const parseDMYtoISO = (dmy: string): string | null => {
  if (!dmy) return null;
  const parts = dmy.split('/');
  if (parts.length !== 3) return null;

  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;

  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
};

const parseDMYtoDate = (dmy: string): Date | null => {
  const parts = dmy.split('/').map(Number);
  if (parts.length !== 3 || parts.some(part => !part)) return null;

  const [day, month, year] = parts;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
};

const getCurrentFinancialYearStart = (today: Date = new Date()): Date => {
  const year = today.getFullYear();
  const financialYearStartYear = today.getMonth() >= 6 ? year : year - 1;
  return new Date(financialYearStartYear, 6, 1);
};

const buildCategoryForFee = (category: string, subtype?: string): string => {
  if (category === 'principal' && subtype === 'supervising') {
    return 'principal-supervisor';
  }

  return category;
};

const previousFinancialYearNoticeContent = (): React.ReactNode => (
  <p style={{fontSize:15,lineHeight:'24px',color:'#0b1220',margin:0}}>
    <strong>IMPORTANT:</strong> If your change in practice/employment is from a previous financial year(s) and you have not made a contribution to the <a href="https://www.lawsociety.com.au/practising-law-in-NSW/trust-money-and-fidelity-funds/legal-practitioners-fidelity-fund" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>Legal Practitioners Fidelity Fund</a> for those previous year(s), then the Law Society Registry will request payment from you by email. You are not authorised to engage in legal practice as an employee or principal of a law practice until payment has been received for any previous financial year(s). Fees charged apply only to the current financial year.
  </p>
);

function ChangeEmploymentDetailsForm() {
  const currentFinancialYearStart = getCurrentFinancialYearStart();
  const showsPreviousFinancialYearNotice = (value: string): boolean => {
    const selectedDate = parseDMYtoDate(value);
    return selectedDate !== null && selectedDate < currentFinancialYearStart;
  };

  const previousFinancialYearNotice = (
    showsNotice: boolean,
    noticeContent: React.ReactNode
  ): React.ReactNode => showsNotice && (
    <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,marginBottom:16}}>
      {noticeContent}
    </div>
  );

  const [formData, setFormData] = useState({
    // Section 1 - Your Personal Details
    lawID: '',
    firstName: '',
    surname: '',
    otherName: '',
    dateOfBirth: '',
    // Section 2 - Current Practising Certificate
    currentCertificate: '',
    // Section 3 - Previous Employment Details
    ceasedPractice: '',
    previousPracticeCategory: '',
    previousEmployerName: '',
    previousPosition: '',
    previousStreet: '',
    previousSuburb: '',
    previousState: '',
    previousCountry: '',
    previousPostcode: '',
    dateOfCessation: '',
    reasonForLeaving: '',
    // Section 4 - New Employment Details
    engagingInPractice: '',
    principalPlacePractice: '',
    newEmployerName: '',
    newPosition: '',
    newStreet: '',
    newSuburb: '',
    newState: '',
    newCountry: '',
    newPostcode: '',
    newEmail: '',
    newPhone: '',
    dateOfCommencement: '',
    typeOfPractice: '',
    typeOfPracticeOther: '',
    multipleEntities: '',
    practiceCategory: '',
    practiceCategorySpecify: '',
    addlName: '',
    addlStreet: '',
    addlStreet2: '',
    addlCity: '',
    addlState: '',
    addlPostcode: '',
    addlCountry: '',
    addlEmail: '',
    addlPhone: '',
    addlDateCommencement: '',
    // Section 5 - Declaration
    declarationConfirm: '',
  });

  const [errors, setErrors] = useState({
    lawID: '',
    firstName: '',
    surname: '',
    dateOfBirth: '',
    emailAddress: '',
    // Section 2
    currentCertificate: '',
    // Section 3
    ceasedPractice: '',
    previousPracticeCategory: '',
    previousEmployerName: '',
    dateOfCessation: '',
    // Section 4
    engagingInPractice: '',
    principalPlacePractice: '',
    newEmployerName: '',
    newPosition: '',
    newStreet: '',
    newSuburb: '',
    newState: '',
    newCountry: '',
    newPostcode: '',
    newEmail: '',
    dateOfCommencement: '',
    typeOfPractice: '',
    typeOfPracticeOther: '',
    multipleEntities: '',
    practiceCategory: '',
    practiceCategorySpecify: '',
    addlName: '',
    addlStreet: '',
    addlStreet2: '',
    addlCity: '',
    addlState: '',
    addlPostcode: '',
    addlCountry: '',
    addlEmail: '',
    addlPhone: '',
    addlDateCommencement: '',
    // Section 5
    declarationConfirm: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentLimitError, setAttachmentLimitError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<FormErrorSummaryItem[]>([]);
  const [feeData, setFeeData] = useState<{ feePc: number; feeFidelity: number; feeAmount: number; logic: string } | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [ilpAsicAttachment, setIlpAsicAttachment] = useState<File[] | null>(null);
  const { lawSocietyId: authenticatedLawSocietyId, email: userEmail, name: userName, firstName: authFirstName, surname: authSurname, otherName: authOtherName } = useAuthenticatedUser();

  // Fetch fee whenever relevant fields change
  useEffect(() => {
    const prevCat = buildCategoryForFee(
      (formData as any).previousPracticeCategory as string,
      (formData as any).previousPracticeCategorySpecify as string
    );
    const newCat = buildCategoryForFee(
      (formData as any).practiceCategory as string,
      (formData as any).practiceCategorySpecify as string
    );
    const addlCat = buildCategoryForFee(
      (formData as any).addlPracticeCategory as string,
      (formData as any).addlPracticeCategorySpecify as string
    );
    const multipleEntities = (formData as any).multipleEntities as string;
    const part1DateRaw = formData.dateOfCommencement;
    const part2DateRaw = (formData as any).addlDateCommencement as string;

    if (!prevCat || !newCat || !part1DateRaw) { setFeeData(null); return; }

    if (multipleEntities === 'yes' && (!addlCat || !part2DateRaw)) { setFeeData(null); return; }

    setFeeLoading(true);

    const calculateCombinedFee = async () => {
      try {
        const part1DateISO = parseDMYtoISO(part1DateRaw);
        const part2DateISO = parseDMYtoISO(part2DateRaw || '');

        if (!part1DateISO) { setFeeData(null); return; }

        if (multipleEntities !== 'yes') {
          const result = await apiService.getFee({
            formType: FORM_TYPES.CHANGE_IN_EMPLOYMENT_DETAILS,
            effectiveDate: part1DateISO,
            practiceCountry: 'Australia',
            prevCategory: prevCat,
            newCategory: newCat,
          });
          setFeeData(result);
          return;
        }

        if (!addlCat || !part2DateISO) { setFeeData(null); return; }

        const entity1Fee = await apiService.getFee({
          formType: FORM_TYPES.CHANGE_IN_EMPLOYMENT_DETAILS,
          effectiveDate: part1DateISO,
          practiceCountry: 'Australia',
          prevCategory: prevCat,
          newCategory: newCat,
        });

        const entity2Fee = await apiService.getFee({
          formType: FORM_TYPES.CHANGE_IN_EMPLOYMENT_DETAILS,
          effectiveDate: part2DateISO,
          practiceCountry: 'Australia',
          prevCategory: prevCat,
          newCategory: addlCat,
        });

        const feePc = Math.max(entity1Fee.feePc || 0, entity2Fee.feePc || 0);
        const feeFidelity = Math.max(entity1Fee.feeFidelity || 0, entity2Fee.feeFidelity || 0);

        setFeeData({
          feePc,
          feeFidelity,
          feeAmount: feePc + feeFidelity,
          logic: `Combined Entity1/Entity2 using max components (PC=${feePc}, Fidelity=${feeFidelity})`,
        });
      } catch (error) {
        setFeeData(null);
      } finally {
        setFeeLoading(false);
      }
    };
    
    calculateCombinedFee();
  }, [
    (formData as any).previousPracticeCategory, 
    (formData as any).previousPracticeCategorySpecify,
    (formData as any).practiceCategory, 
    (formData as any).practiceCategorySpecify,
    (formData as any).addlPracticeCategory,
    (formData as any).addlPracticeCategorySpecify,
    (formData as any).multipleEntities,
    formData.dateOfCommencement,
    (formData as any).addlDateCommencement
  ]);
  const [showTypeOther, setShowTypeOther] = useState(false);

  useEffect(() => {
    const nextAttachmentLimitError = getTotalAttachmentLimitError({ ilpAsicAttachment });
    setAttachmentLimitError(nextAttachmentLimitError);
    if (!nextAttachmentLimitError && submitError?.startsWith('Exceeded attachment size')) {
      setSubmitError(null);
    }
  }, [ilpAsicAttachment, submitError]);

  useAuthPrefill(setFormData, {
    lawID: userEmail,
    firstName: authFirstName,
    surname: authSurname,
    otherName: authOtherName,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const updates: any = { [name]: value };
    
    // For yes/no radio buttons, store the display text
    if (type === 'radio' && (value === 'yes' || value === 'no')) {
      updates[`${name}Text`] = value === 'yes' ? 'Yes' : 'No';
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
      setValidationSummary(prev => prev.filter(item => item.field !== name));
    }
  };

  const handleBlur = (fieldName: string, value: string) => {
    let errorMessage = '';

    // Date field validation
    if (fieldName === 'dateOfBirth' || fieldName === 'dateOfCessation' || fieldName === 'dateOfCommencement') {
      if (!value.trim()) {
        if (fieldName === 'dateOfBirth') errorMessage = 'Date of birth is required';
        else if (fieldName === 'dateOfCessation') errorMessage = 'Date of cessation is required';
        else errorMessage = 'Date of commencement is required';
      }
    }
    // Section 1
    else if (fieldName === 'lawID' && !value.trim()) errorMessage = 'LawID is required';
    else if (fieldName === 'firstName' && !value.trim()) errorMessage = 'First name is required';
    else if (fieldName === 'surname' && !value.trim()) errorMessage = 'Surname is required';
    // Section 2
    else if (fieldName === 'previousEmployerName' && !value.trim()) errorMessage = 'Previous employer name is required';
    // Section 3
    else if (fieldName === 'newEmployerName' && !value.trim()) errorMessage = 'New employer name is required';
    else if (fieldName === 'newPosition' && !value.trim()) errorMessage = 'Position is required';
    else if (fieldName === 'newStreet' && !value.trim()) errorMessage = 'Street number and name is required';
    else if (fieldName === 'newSuburb' && !value.trim()) errorMessage = 'Suburb is required';
    else if (fieldName === 'newState' && !value.trim()) errorMessage = 'State is required';
    else if (fieldName === 'newCountry' && !value.trim()) errorMessage = 'Country is required';
    else if (fieldName === 'newPostcode' && !value.trim()) errorMessage = 'Postcode is required';
    else if (fieldName === 'newEmail') errorMessage = getEmailValidationError(value);
    else if (fieldName === 'typeOfPractice' && !value.trim()) errorMessage = 'Type of practice is required';
    else if (fieldName === 'typeOfPracticeOther' && !value.trim()) errorMessage = 'Please specify type of practice';
    else if (fieldName === 'addlEmail') errorMessage = getEmailValidationError(value);
    // Section 4
    else if (fieldName === 'declarationConfirm' && !value.trim()) errorMessage = 'You must confirm the declaration';

    setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
  };

  const handleBlurInput = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    handleBlur(fieldName, e.target.value);
  };

  const handleTypeOfPracticeChange = (value: string) => {
    // Map of typeOfPractice values to their display labels
    const labelMap: Record<string, string> = {
      'solicitor': 'Solicitor',
      'barrister': 'Barrister',
      'in-house': 'In-house counsel',
      'government': 'Government solicitor',
      'corporate': 'Corporate counsel',
      'community-legal': 'Community legal centre',
      'other': 'Other'
    };
    
    setShowTypeOther(value === 'other');
    setFormData(prev => ({ 
      ...prev, 
      typeOfPractice: value,
      typeOfPracticeText: labelMap[value] || value,
      ...(value !== 'other' ? { typeOfPracticeOther: '' } : {}) 
    }));
    if (errors.typeOfPractice) {
      setErrors(prev => ({ ...prev, typeOfPractice: '' }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    setSubmitError(null);
    setValidationSummary([]);

    const currentAttachmentLimitError = getTotalAttachmentLimitError({ ilpAsicAttachment });
    if (currentAttachmentLimitError) {
      setSubmitError(currentAttachmentLimitError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Reset all errors before revalidating so stale errors from previous attempts don't persist
    const newErrors = Object.fromEntries(Object.keys(errors).map(k => [k, ''])) as typeof errors;

    // Section 1 - Your Personal Details
    if (!formData.lawID.trim()) newErrors.lawID = 'LawID is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
    if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required';

    // Section 2 - Current Practising Certificate
    if (!formData.currentCertificate) newErrors.currentCertificate = 'Please select an option';

    // Section 3 - Previous Employment
    if (formData.currentCertificate === 'yes') {
      if (!formData.ceasedPractice) newErrors.ceasedPractice = 'Please select an option';

      if (!(formData as any).previousPracticeCategory) (newErrors as any).previousPracticeCategory = 'Please select a category';
      if (formData.ceasedPractice === 'yes') {
        if (!formData.previousEmployerName.trim()) newErrors.previousEmployerName = 'Name of entity/law practice/employer is required';
        if (!formData.dateOfCessation.trim()) newErrors.dateOfCessation = 'Date you ceased practice is required';
      }

      // Section 4 - New Employment
      if (!formData.engagingInPractice) newErrors.engagingInPractice = 'Please select an option';

      if (formData.engagingInPractice === 'yes') {
        if (!formData.newEmployerName.trim()) newErrors.newEmployerName = 'New employer name is required';
        if (!formData.newPosition.trim()) newErrors.newPosition = 'Position is required';

        if (!formData.newSuburb.trim()) newErrors.newSuburb = 'Suburb is required';
        if (!formData.newState.trim()) newErrors.newState = 'State is required';
        if (!formData.newCountry.trim()) newErrors.newCountry = 'Country is required';
        if (!formData.newPostcode.trim()) newErrors.newPostcode = 'Postcode is required';
        newErrors.newEmail = getEmailValidationError(formData.newEmail || '');
        if (!formData.dateOfCommencement.trim()) newErrors.dateOfCommencement = 'Date of commencement is required';
        if (!formData.principalPlacePractice) newErrors.principalPlacePractice = 'Please select an option';
        if (!(formData as any).multipleEntities) newErrors.multipleEntities = 'Please select an option';
        if (!(formData as any).practiceCategory) newErrors.practiceCategory = 'Please select a category';
        if ((formData as any).practiceCategory === 'principal' && !(formData as any).practiceCategorySpecify) (newErrors as any).practiceCategorySpecify = 'Please specify';
        if ((formData as any).practiceCategory === 'principal' && (formData as any).practiceCategorySpecify === 'ilp' && !ilpAsicAttachment) (newErrors as any).ilpAsicAttachment = 'Please upload a copy of the ASIC extract';
        if ((formData as any).multipleEntities === 'yes') {
          if (!(formData as any).addlName?.trim()) (newErrors as any).addlName = 'Name is required';
          if (!(formData as any).addlStreet?.trim()) (newErrors as any).addlStreet = 'Street address is required';
          if (!(formData as any).addlCity?.trim()) (newErrors as any).addlCity = 'City is required';
          if (!(formData as any).addlState?.trim()) (newErrors as any).addlState = 'State is required';
          if (!(formData as any).addlPostcode?.trim()) (newErrors as any).addlPostcode = 'Postcode is required';
          if (!(formData as any).addlCountry?.trim()) (newErrors as any).addlCountry = 'Country is required';
          (newErrors as any).addlEmail = getEmailValidationError((formData as any).addlEmail || '');
          if (!(formData as any).addlDateCommencement?.trim()) (newErrors as any).addlDateCommencement = 'Date is required';
          if (!(formData as any).addlPracticeCategory) (newErrors as any).addlPracticeCategory = 'Please select a category';
          if ((formData as any).addlPracticeCategory === 'principal' && !(formData as any).addlPracticeCategorySpecify) (newErrors as any).addlPracticeCategorySpecify = 'Please specify';
        }
        if (formData.typeOfPractice === 'other' && !formData.typeOfPracticeOther.trim()) newErrors.typeOfPracticeOther = 'Please specify type of practice';
      }

      // Section 5 - Declaration
      if (!formData.declarationConfirm) newErrors.declarationConfirm = 'You must confirm the declaration';
      if (!(formData as any).declarationContentsTrue) newErrors.declarationConfirm = 'You must confirm the declaration';
      if (!(formData as any).declarationPrivacy) newErrors.declarationConfirm = 'You must confirm the declaration';
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

    // Prepare form data for submission
    const practiceCategoryMap: Record<string, string> = {
      'principal': 'Principal of a law practice',
      'employee': 'Employee of a law practice',
      'corporate': 'Corporate legal practitioner',
      'government': 'Government legal practitioner',
      'volunteer': 'Volunteer of a community legal service (a volunteer PC will only be granted to an applicant who will be volunteering with a community legal service registered with the Law Society, and, will not be granted to an applicant residing or have a PPP outside of Australia)',
    };
    const practiceCategorySpecifyMap: Record<string, string> = {
      'sole': 'Sole practitioner',
      'ilp': 'Principal of an ILP',
      'partner': 'Partner of a law firm',
      'supervising': 'Supervising legal practitioner of a community legal service',
    };

    const formType = FORM_TYPES.CHANGE_IN_EMPLOYMENT_DETAILS;
    const formTypeShort = FORM_TYPES_SHORT.CHANGE_IN_EMPLOYMENT_DETAILS;
    const submissionData = {
      formType,
      applicantDetails: {
        firstName: formData.firstName,
        surname: formData.surname,
        otherName: formData.otherName || '',
        dateOfBirth: formData.dateOfBirth,
      },
      changeInPracticeDetails: {
        doYouHoldCurrentPractisingCertificate: formData.currentCertificate === 'yes' ? 'Yes' : 'No',
      },
      ...(formData.currentCertificate === 'yes' ? {
        previousEmploymentDetails: {
          haveYouCeasedPracticeWithPreviousEmployer: formData.ceasedPractice === 'yes' ? 'Yes' : formData.ceasedPractice === 'no' ? 'No' : '',
          categoryOfPractice: ({
            principal: 'Principal of a law practice',
            employee: 'Employee of a law practice',
            government: 'Government legal practitioner',
            corporate: 'Corporate legal practitioner',
            volunteer: 'Volunteer',
          } as Record<string, string>)[(formData as any).previousPracticeCategory] || (formData as any).previousPracticeCategory || '',
          nameOfEntityOrLawPractice: formData.previousEmployerName,
          dateYouCeasedPractice: formData.dateOfCessation,
        },
        newEmploymentDetails: {
          currentlyEngagingInLegalPractice: formData.engagingInPractice === 'yes' ? 'Yes' : formData.engagingInPractice === 'no' ? 'No' : '',
          ...(formData.engagingInPractice === 'yes' ? {
            nameOfPlaceOfPractice: formData.newEmployerName,
            addressLine1: formData.newPosition,
            ...(formData.newStreet ? { addressLine2: formData.newStreet } : {}),
            city: formData.newSuburb,
            state: formData.newState,
            country: formData.newCountry,
            postcode: formData.newPostcode,
            ...(formData.newEmail ? { emailAddress: formData.newEmail } : {}),
            ...(formData.newPhone ? { phoneNumber: formData.newPhone } : {}),
            dateOfCommencement: formData.dateOfCommencement,
            isThisPrincipalPlaceOfPractice: formData.principalPlacePractice === 'yes' ? 'Yes' : formData.principalPlacePractice === 'no' ? 'No' : '',
            newCategoryOfPractice: practiceCategoryMap[(formData as any).practiceCategory] || (formData as any).practiceCategory || '',
            ...((formData as any).practiceCategorySpecify ? { practiceType: practiceCategorySpecifyMap[(formData as any).practiceCategorySpecify] || (formData as any).practiceCategorySpecify } : {}),
            intendToPracticeWithMoreThanOneEntity: (formData as any).multipleEntities === 'yes' ? 'Yes' : (formData as any).multipleEntities === 'no' ? 'No' : '',
          } : {}),
        },
        ...((formData as any).multipleEntities === 'yes' && formData.engagingInPractice === 'yes' ? {
          additionalPracticeDetails: {
            nameOfPlaceOfPractice: (formData as any).addlName || '',
            address: (formData as any).addlStreet || '',
            ...((formData as any).addlStreet2 ? { addressLine2: (formData as any).addlStreet2 } : {}),
            city: (formData as any).addlCity || '',
            state: (formData as any).addlState || '',
            country: (formData as any).addlCountry || '',
            postcode: (formData as any).addlPostcode || '',
            ...((formData as any).addlEmail ? { emailAddress: (formData as any).addlEmail } : {}),
            ...((formData as any).addlPhone ? { phoneNumber: (formData as any).addlPhone } : {}),
            dateOfCommencement: (formData as any).addlDateCommencement || '',
            categoryOfPractice: practiceCategoryMap[(formData as any).addlPracticeCategory] || (formData as any).addlPracticeCategory || '',
            ...((formData as any).addlPracticeCategorySpecify ? { practiceType: practiceCategorySpecifyMap[(formData as any).addlPracticeCategorySpecify] || (formData as any).addlPracticeCategorySpecify } : {}),
          },
        } : {}),
        declaration: {
          iAmTheNamedIndividual: formData.declarationConfirm === 'yes',
          iAmTheNamedIndividualText: 'I am the above-named Australian legal practitioner',
          contentsAreTrue: Boolean((formData as any).declarationContentsTrue),
          contentsAreTrueText: 'The contents of this form are true and correct to the best of my knowledge; and',
          privacyNotice: Boolean((formData as any).declarationPrivacy),
          privacyNoticeText: 'I have read the Personal Information Collection Notice before providing my personal information and agreed to the terms of the privacy notice. The Law Society of New South Wales respects your privacy and the confidentiality and security of personal information provided by you to us.',
        },
      } : {}),
      submittedAt: new Date().toISOString().replace('Z', '+00:00')
    };

    try {
      setIsSubmitting(true);
      const formName = FORM_NAMES.CHANGE_IN_EMPLOYMENT_DETAILS;
      const price = formData.engagingInPractice === 'no' ? 0 : (feeData?.feeAmount ?? 0);

      const lawSocietyId = authenticatedLawSocietyId || formData.lawID || '';
      console.log('Using LawID for submission:', lawSocietyId);

      const { submissionId, blobUrls } = await apiService.uploadAllAttachments(
        formType,
        lawSocietyId,
        formTypeShort,
        ilpAsicAttachment ? { ilpAsicAttachment } : {}
      );
      
      console.log('Submission ID from backend (Australian time):', submissionId);

      const fieldLabels: Record<string, string> = {
        firstName: 'First Name', surname: 'Surname',
        otherName: 'Middle/Other Names', dateOfBirth: 'Date of Birth',
        doYouHoldCurrentPractisingCertificate: 'Do you hold a current practising certificate issued by the Council of the Law Society of NSW?',
        haveYouCeasedPracticeWithPreviousEmployer: 'Have you ceased practice with your previous place of practice or employer?',
        categoryOfPractice: 'What is the category of practice you are engaging in?',
        newCategoryOfPractice: 'What is the category of practice you are engaging in?',
        nameOfEntityOrLawPractice: 'Name of entity/law practice/employer',
        dateYouCeasedPractice: 'Date you ceased practice',
        currentlyEngagingInLegalPractice: 'Are you currently, or will you commence engaging in legal practice?',
        nameOfPlaceOfPractice: 'Name of place of practice/employer',
        addressLine1: 'Address of place of practice/employer',
        addressLine2: 'Address line 2',
        city: 'City', state: 'State', country: 'Country', postcode: 'Postcode',
        emailAddress: 'Email address',
        phoneNumber: 'Phone number of place of practice/employer',
        dateOfCommencement: 'Date from when you commenced, or will commence practice/employment',
        isThisPrincipalPlaceOfPractice: 'Is this your principal place of practice?',
        practiceType: 'Please specify the type of principal practice',
        intendToPracticeWithMoreThanOneEntity: 'Do you intend to practice with more than one entity?',
        address: 'Address',
        contentsAreTrue: 'The contents of this form are true and correct to the best of my knowledge;',
      };

      const sectionLabels: Record<string, string> = {
        applicantDetails: '1. Your Personal Details',
        changeInPracticeDetails: '2. Change in Practice/Employment Details',
        previousEmploymentDetails: '3. Your Previous Place of Practice/Employment Details',
        newEmploymentDetails: '4. Your New Practice/Employment Details',
        additionalPracticeDetails: 'Additional Practice/Employment Details',
        declaration: '5. Declaration',
      };

      const lineItems: StripeLineItem[] = [];
      if ((feeData?.feeFidelity ?? 0) > 0)
        lineItems.push({ name: 'Fidelity Fund', amountCents: Math.round((feeData!.feeFidelity) * 100), hasGst: false });
      if ((feeData?.feePc ?? 0) > 0)
        lineItems.push({ name: 'Practising Certificate', amountCents: Math.round((feeData!.feePc) * 100), hasGst: false });

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
        undefined,
        undefined,
        lineItems
      );

      console.log('Form submitted successfully:', result);

      if (result.checkoutUrl) {
        console.log('Redirecting to Stripe checkout:', result.checkoutUrl);
        window.location.href = apiService.getSafeCheckoutUrl(result.checkoutUrl);
      } else {
        // No payment required (price = $0) — redirect to success page directly
        console.log('No payment required, redirecting to success page');
        window.location.href = `/submission-success?free=true&formType=${formType}`;
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
            title={"Change in Practice/Employment Details"} 
            subtitle={""} 
          />

          <FormErrorSummary
            items={validationSummary}
            onSelect={focusFieldByName}
          />

          <div style={{ marginTop: '12px', marginBottom: '20px', fontSize: '16px', lineHeight: '24px', color: '#0b1220' }}>
            Use this form to update and/or notify the Law Society of any changes to your employment details. If you would like to make changes to your personal details, please do so by completing the{' '}
            <a href="https://www.lawsociety.com.au/resources/publications/forms-directory/change-in-personal-details" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522', fontWeight: 600 }}>change in personal details form</a> instead.
          </div>

          <div className="section-divider" />

          {/* Section 1 - Your Personal Details */}
          <h2 className="section-title">1. Your Personal Details</h2>

          {/* NOTE */}
          <div style={{
            marginTop: '16px',
            marginBottom: '16px',
            padding: '16px 20px',
            backgroundColor: '#e8f0f6',
            borderLeft: '4px solid #394F5A',
            borderRadius: '4px',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#0b1220'
          }}>
            <strong>NOTE:</strong> It is important that you provide us with personal details below that match our records. If the personal details provided below do not match our records, we will be required to contact you to verify your identity. This will delay processing times.
          </div>

          <div className="grid" style={{marginTop:8, gridTemplateColumns: '1fr 1fr'}}>
            <FormField 
              name="firstName"
              label="First name *"
              placeholder=""
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlurInput('firstName')}
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
              onBlur={handleBlurInput('surname')}
              error={errors.surname}
              required
              readOnly={!!authSurname}
              style={!!authSurname ? { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' } : undefined}
            />
          </div>

          <div className="grid" style={{marginTop:12, gridTemplateColumns: '1fr 1fr'}}>
            <div style={{ display: 'none' }}>
              {/* LawID hidden from UI but in formData for PDF */}
              <FormField 
                name="lawID"
                label="LawID *"
                placeholder=""
                value={formData.lawID}
                onChange={handleChange}
                readOnly={!!authenticatedLawSocietyId}
              />
            </div>
            <DateField
              name="dateOfBirth"
              label="Date of birth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.dateOfBirth}
              required
            />
            <FormField 
              name="otherName"
              label="Middle/Other names"
              placeholder=""
              value={formData.otherName}
              onChange={handleChange}
            />
          </div>

          <div className="section-divider" />

          {/* Section 2 - Change in Practice/Employment Details */}
          <h2 className="section-title">2. CHANGE IN PRACTICE/EMPLOYMENT DETAILS</h2>

          <div style={{marginTop:12}}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Do you hold a current practising certificate issued by the Council of the Law Society of NSW? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="currentCertificate" value={v} checked={formData.currentCertificate === v}
                    onChange={handleChange}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errors.currentCertificate && <span className="error-message">{errors.currentCertificate}</span>}
          </div>

          {formData.currentCertificate === 'no' && (
            <>
            <div style={{
              marginTop: '16px',
              marginBottom: '16px',
              padding: '16px 20px',
              backgroundColor: '#e8f0f6',
              borderLeft: '4px solid #394F5A',
              borderRadius: '4px',
              fontSize: '15px',
              lineHeight: '24px',
              color: '#0b1220'
            }}>
              <strong>NOTE:</strong> Please do not complete this form. Instead, please complete an application for grant of a <a href="/practising-certificate-new" style={{color: '#F26522'}}>practising certificate</a>.
            </div>

            <div className="section-divider" />
            </>
          )}

          {formData.currentCertificate === 'yes' && (
            <>
          <div className="section-divider" />

          {/* Section 3 - Previous Employment Details */}
          <h2 className="section-title">3. YOUR PREVIOUS PLACE OF PRACTICE/EMPLOYMENT DETAILS</h2>

          {/* NOTE */}
          <div style={{
            marginTop: '16px',
            marginBottom: '16px',
            padding: '16px 20px',
            backgroundColor: '#e8f0f6',
            borderLeft: '4px solid #394F5A',
            borderRadius: '4px',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#0b1220'
          }}>
            <strong>NOTE:</strong> You are required to notify us of the date that you ceased practice/employment with any previous law practices or entities. If you have ceased practice with any law practice/entity since last notifying the Law Society, please indicate the date you ceased practice, below.
          </div>

          <div style={{marginTop:12}}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Have you ceased practice with your previous place of practice or employer? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="ceasedPractice" value={v} checked={formData.ceasedPractice === v}
                    onChange={(e) => {
                      handleChange(e);
                      if (v === 'no') {
                        setFormData(prev => ({
                          ...prev,
                          previousEmployerName: '',
                          dateOfCessation: '',
                        }));
                        setErrors(prev => ({
                          ...prev,
                          previousEmployerName: '',
                          dateOfCessation: '',
                        }));
                      }
                    }}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errors.ceasedPractice && <span className="error-message option-group">{errors.ceasedPractice}</span>}
          </div>

          <div style={{marginTop:16}}>
            <div style={{display:'grid', gridTemplateColumns:(formData as any).previousPracticeCategory === 'principal' ? '1fr 1fr' : '1fr', gap:32}}>
              <div>
                <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                  What is the category of practice you are engaging in? <span style={{ color: '#F26522' }}>*</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {[
                    { value: 'principal', label: 'Principal of a law practice' },
                    { value: 'employee', label: 'Employee of a law practice' },
                    { value: 'government', label: 'Government legal practitioner' },
                    { value: 'corporate', label: 'Corporate legal practitioner' },
                    { value: 'volunteer', label: 'Volunteer' },
                  ].map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="radio" name="previousPracticeCategory" value={opt.value}
                        checked={(formData as any).previousPracticeCategory === opt.value}
                        onChange={e => {
                          if (opt.value !== 'principal') {
                            setFormData(prev => ({ ...prev, previousPracticeCategory: opt.value, previousPracticeCategorySpecify: '' }));
                            setIlpAsicAttachment(null);
                          } else {
                            handleChange(e);
                          }
                          if ((errors as any).previousPracticeCategory) setErrors(prev => ({ ...prev, previousPracticeCategory: '' }));
                        }} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                      <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {(errors as any).previousPracticeCategory && <span className="error-message">{(errors as any).previousPracticeCategory}</span>}
              </div>

              {(formData as any).previousPracticeCategory === 'principal' && (
                <div>
                  <p style={{fontSize:16,color:'#0b1220',fontWeight:600,marginBottom:4}}>Please specify: <span style={{color:'#F26522'}}>*</span></p>
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                    {[
                      { value: 'sole', label: 'Sole practitioner' },
                      { value: 'ilp', label: 'Principal of an ILP' },
                      { value: 'partner', label: 'Partner of a law firm' },
                      { value: 'supervising', label: 'Supervising legal practitioner of a community legal service' },
                    ].map(opt => (
                      <label key={opt.value} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                        <input type="radio" name="previousPracticeCategorySpecify" value={opt.value}
                          checked={(formData as any).previousPracticeCategorySpecify === opt.value}
                          onChange={e => setFormData(prev => ({...prev, previousPracticeCategorySpecify: e.target.value}))}
                          style={{width:14,height:14,cursor:'pointer'}} />
                        <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {(errors as any).previousPracticeCategorySpecify && <span className="error-message">{(errors as any).previousPracticeCategorySpecify}</span>}
                </div>
              )}
            </div>

          </div>

          {formData.ceasedPractice === 'yes' && (
            <>
              <div style={{marginTop:12}}>
                <FormField 
                  name="previousEmployerName"
                  label="Name of entity/law practice/employer *"
                  placeholder=""
                  value={formData.previousEmployerName}
                  onChange={handleChange}
                  onBlur={handleBlurInput('previousEmployerName')}
                  error={errors.previousEmployerName}
                  required
                />
              </div>

              <div style={{marginTop:8}}>
                <DateField
                  name="dateOfCessation"
                  label="Date you ceased practice"
                  value={formData.dateOfCessation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.dateOfCessation}
                  required
                  allowFuture
                />
              </div>
            </>
          )}

          <div className="section-divider" />

          {/* Section 4 - New Employment Details */}
          <h2 className="section-title">4. YOUR NEW PRACTICE/EMPLOYMENT DETAILS</h2>

          <div style={{marginTop:12}}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Are you currently, or will you commence engaging in legal practice? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="engagingInPractice" value={v} checked={formData.engagingInPractice === v}
                    onChange={handleChange}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errors.engagingInPractice && (
              <span className="error-message">{errors.engagingInPractice}</span>
            )}
          </div>

          {formData.engagingInPractice === 'no' && (
            <div style={{
              marginTop: '16px',
              marginBottom: '16px',
              padding: '16px 20px',
              backgroundColor: '#e8f0f6',
              borderLeft: '4px solid #394F5A',
              borderRadius: '4px',
              fontSize: '15px',
              lineHeight: '24px',
              color: '#0b1220'
            }}>
              <strong>NOTE:</strong> We will record you as not currently engaging in legal practice.
            </div>
          )}

          {formData.engagingInPractice === 'yes' && (
            <>
            <p>This information will be displayed on our public register, pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-016#sec.149" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 149</a> of the <em>Legal Profession Uniform Law Application Act 2014</em> and <a href="https://legislation.nsw.gov.au/view/html/inforce/current/sl-2015-0330#sec.60" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>regulation 60(1)-(4)</a> of the <em>Legal Profession Uniform Law Application Regulation 2015</em>.</p>
            {/* NOTE */}
          <div style={{
            marginTop: '16px',
            marginBottom: '16px',
            padding: '16px 20px',
            backgroundColor: '#e8f0f6',
            borderLeft: '4px solid #394F5A',
            borderRadius: '4px',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#0b1220'
          }}>
            <strong>NOTE:</strong> Please refer to our public register of solicitors for the contact details of the entity through which you are engaging in legal practice. If you are wishing to establish a new law practice, please do not complete this form and instead refer to our  <a href="https://www.lawsociety.com.au/resources/publications/forms-directory" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522', fontWeight: 600 }}>forms webpage </a>for more information.
          </div>
          <div style={{marginTop:12}}>
            <FormField 
              name="newEmployerName"
              label="Name of place of practice/employer *"
              placeholder=""
              value={formData.newEmployerName}
              onChange={handleChange}
              onBlur={handleBlurInput('newEmployerName')}
              error={errors.newEmployerName}
              required
            />
          </div>

          <div style={{marginTop:8}}>
            <FormField 
              name="newPosition"
              label="Address of place of practice/employer *"
              placeholder=""
              value={formData.newPosition}
              onChange={handleChange}
              onBlur={handleBlurInput('newPosition')}
              error={errors.newPosition}
              required
            />
          </div>

          <div style={{marginTop:8}}>
            <FormField 
              name="newStreet"
              label="Street Address line 2"
              placeholder=""
              value={formData.newStreet}
              onChange={handleChange}
            />
          </div>

          <div className="grid" style={{marginTop:8, gridTemplateColumns: '1fr 1fr 1fr'}}>
            <FormField 
              name="newSuburb"
              label="City *"
              placeholder=""
              value={formData.newSuburb}
              onChange={handleChange}
              onBlur={handleBlurInput('newSuburb')}
              error={errors.newSuburb}
              required
            />
            <FormField
              name="newState"
              label="State *"
              placeholder=""
              value={formData.newState}
              onChange={handleChange}
              onBlur={handleBlurInput('newState')}
              error={errors.newState}
              required
            />
             <FormField 
              name="newPostcode"
              label="Postcode *"
              placeholder=""
              value={formData.newPostcode}
              onChange={handleChange}
              onBlur={handleBlurInput('newPostcode')}
              error={errors.newPostcode}
              required
            />
          </div>

          <div style={{marginTop:8}}>
            <CountrySelect 
              name="newCountry"
              label="Country *"
              value={formData.newCountry}
              onChange={handleChange as any}
              error={errors.newCountry}
              required
            />
          </div>

          <div className="grid" style={{marginTop:8}}>
            <div>
              <FormField
                name="newEmail"
                label="Email address"
                placeholder=""
                type="email"
                value={(formData as any).newEmail}
                onChange={handleChange}
                onBlur={handleBlurInput('newEmail')}
                error={(errors as any).newEmail}
              />
              <p style={{fontSize:'12px',color:'#6b7280',marginTop:'4px',marginBottom:'8px'}}>
                This is the email address that will be publicly displayed on the register of solicitors.
              </p>
            </div>
            <FormField
              name="newPhone"
              label="Phone number of place of practice/employer"
              placeholder="+61 2 0000 0000"
              type="tel"
              value={(formData as any).newPhone}
              onChange={handleChange}
            />
          </div>

 <div style={{marginTop:8}}>
   <DateField
     name="dateOfCommencement"
     label="Date from when you commenced, or will commence practice/employment"
     value={formData.dateOfCommencement}
     onChange={handleChange}
     onBlur={handleBlur}
     error={errors.dateOfCommencement}
     required
     allowFuture
   />
   {previousFinancialYearNotice(
     showsPreviousFinancialYearNotice(formData.dateOfCommencement),
    previousFinancialYearNoticeContent()
   )}
 </div>
 <div style={{marginTop:12}}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Is this your principal place of practice? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {['yes', 'no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                  <input type="radio" name="principalPlacePractice" value={v} checked={formData.principalPlacePractice === v}
                    onChange={handleChange}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
            {errors.principalPlacePractice && (
              <span className="error-message">{errors.principalPlacePractice}</span>
            )}
          </div>

          <div style={{marginTop:16}}>
            <div style={{display:'grid', gridTemplateColumns:(formData as any).practiceCategory === 'principal' ? '1fr 1fr' : '1fr', gap:32}}>
              <div>
                <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                  What is the category of practice you are engaging in? <span style={{ color: '#F26522' }}>*</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {[
                    { value: 'principal', label: 'Principal of a law practice' },
                    { value: 'employee', label: 'Employee of a law practice' },
                    { value: 'corporate', label: 'Corporate legal practitioner' },
                    { value: 'government', label: 'Government legal practitioner' },
                    { value: 'volunteer', label: 'Volunteer of a community legal service (a volunteer PC will only be granted to an applicant who will be volunteering with a community legal service registered with the Law Society, and, will not be granted to an applicant residing or have a PPP outside of Australia)' },
                  ].map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="radio" name="practiceCategory" value={opt.value} checked={(formData as any).practiceCategory === opt.value} onChange={e => {
                        if (opt.value !== 'principal') {
                          setFormData(prev => ({ ...prev, practiceCategory: opt.value, practiceCategorySpecify: '' }));
                          setIlpAsicAttachment(null);
                        } else {
                          handleChange(e);
                        }
                        if ((errors as any).practiceCategory) setErrors(prev => ({ ...prev, practiceCategory: '' }));
                      }} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                      <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {(errors as any).practiceCategory && <span className="error-message">{(errors as any).practiceCategory}</span>}
              </div>

              {(formData as any).practiceCategory === 'principal' && (
                <div>
                  <p style={{fontSize:16,color:'#0b1220',fontWeight:600,marginBottom:4}}>Please specify: <span style={{color:'#F26522'}}>*</span></p>
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                    {[
                      { value: 'sole', label: 'Sole practitioner' },
                      { value: 'ilp', label: 'Principal of an ILP' },
                      { value: 'partner', label: 'Partner of a law firm' },
                      { value: 'supervising', label: 'Supervising legal practitioner of a community legal service' },
                    ].map(opt => (
                      <label key={opt.value} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                        <input type="radio" name="practiceCategorySpecify" value={opt.value}
                          checked={(formData as any).practiceCategorySpecify === opt.value}
                          onChange={e => setFormData(prev => ({...prev, practiceCategorySpecify: e.target.value}))}
                          style={{width:14,height:14,cursor:'pointer'}} />
                        <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {(errors as any).practiceCategorySpecify && <span className="error-message">{(errors as any).practiceCategorySpecify}</span>}

                </div>
              )}
            </div>

            {(formData as any).practiceCategory === 'principal' && (
              <div style={{display:'grid', gridTemplateColumns:(formData as any).practiceCategorySpecify === 'supervising' ? '1fr' : '1fr 1fr', gap:32, marginTop:16}}>
                <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220'}}>
                  You must hold a principal of a law practice practising certificate (PC) to practice in this manner. Please access your LawID account to check the category and conditions of your current PC before submitting this form. To be eligible to hold a principal of a law practice PC, you must have satisfied the statutory condition of <a href="https://www.lawsociety.com.au/practising-law-in-NSW/working-as-a-solicitor-in-NSW/supervised-legal-practice" target="_blank" rel="noopener noreferrer" style={{color:'#F26522',whiteSpace:'nowrap'}}>supervised legal practice (condition 2)</a> and completed an <a href="https://www.lawsociety.com.au/practising-law-nsw/working-solicitor-nsw/managing-your-practice/practice-management-course" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>accredited practice management course (condition 3)</a>, among other requirements.
                </div>
                {(formData as any).practiceCategorySpecify !== 'supervising' && (
                  <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220'}}>
                    You must contribute to the <a href="https://www.lawsociety.com.au/practising-law-in-NSW/trust-money-and-fidelity-funds/legal-practitioners-fidelity-fund" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>Legal Practitioners Fidelity Fund</a> before practising in this manner. If you have not made a contribution to the fidelity fund for the current certificate year, you will be required to make payment as part of this application. You are not authorised to engage in legal practice as a principal of a law practice until payment has been received for the current certificate year.
                  </div>
                )}
              </div>
            )}

            {(formData as any).practiceCategory === 'employee' && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220',marginTop:16}}>
                You must contribute to the <a href="https://www.lawsociety.com.au/practising-law-in-NSW/trust-money-and-fidelity-funds/legal-practitioners-fidelity-fund" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>Legal Practitioners Fidelity Fund</a> before practising in this manner. If you have not made a contribution to the fidelity fund for the current certificate year, you will be required to make payment as part of this application. You are not authorised to engage in legal practice as an employee of a law practice until payment has been received for the current certificate year.
              </div>
            )}

            {(formData as any).practiceCategory === 'corporate' && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220',marginTop:16}}>
                <p style={{margin:'0 0 12px 0'}}>Please refer to the definition of a corporate legal practitioner, pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.6" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 6</a> of the Uniform Law. Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 47(1)</a> of the Uniform Law the holder is authorised to engage in legal practice as a corporate legal practitioner or government legal practitioner and also as a volunteer at a community legal service, or otherwise on a pro bono basis<sup>**</sup>.</p>
              </div>
            )}

            {(formData as any).practiceCategory === 'government' && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220',marginTop:16}}>
                <p style={{margin:'0 0 12px 0'}}>Please refer to the definition of a government legal practitioner, pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.6" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 6</a> of the Uniform Law. Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 47(1)</a> of the Uniform Law the holder is authorised to engage in legal practice as a government legal practitioner or corporate legal practitioner and also as a volunteer at a community legal service, or otherwise on a pro bono basis<sup>**</sup>.</p>
              </div>
            )}

            {(formData as any).practiceCategory === 'volunteer' && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220',marginTop:16}}>
                <p style={{margin:'0 0 12px 0'}}>Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 47(1)</a> of the Uniform Law, the holder is authorised to engage in legal practice both as a volunteer at a community legal service and otherwise on a pro bono basis, only<sup>**</sup>.</p>
              </div>
            )}

            {(formData as any).practiceCategory === 'principal' && (formData as any).practiceCategorySpecify === 'ilp' && (
              <div id="ilpAsicAttachment" style={{marginTop:16}}>
                <p style={{fontSize:15,color:'#0b1220',lineHeight:'22px',marginBottom:8}}>
                  If you are being appointed as a principal of an existing Incorporated Legal Practice on our records, please upload a copy of a current ASIC extract evidencing your current appointment as a Director of the company. <span style={{color:'#F26522'}}>*</span>
                </p>
                <FileUploadField
                  files={ilpAsicAttachment}
                  onFilesChange={(f) => { setIlpAsicAttachment(f); if (f) setErrors((prev: any) => ({...prev, ilpAsicAttachment: ''})); }}
                  error={(errors as any).ilpAsicAttachment}
                />
              </div>
            )}
          </div>

          <div style={{marginTop:16}}>
            <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
              Do you intend to practice with more than one entity? <span style={{ color: '#F26522' }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                <input type="radio" name="multipleEntities" value="yes" checked={(formData as any).multipleEntities === 'yes'}
                  onChange={(e) => {
                    handleChange(e);
                    // Clear dynamic fields when switching to 'yes'
                    if ((formData as any).multipleEntities !== 'yes') {
                      setFormData(prev => ({
                        ...prev,
                        addlName: '',
                        addlPracticeCategory: '',
                        addlPracticeCategorySpecify: '',
                        addlStreet: '',
                        addlStreet2: '',
                        addlCity: '',
                        addlState: '',
                        addlPostcode: '',
                        addlCountry: '',
                        addlEmail: '',
                      }));
                      setErrors(prev => ({
                        ...prev,
                        addlName: '',
                        addlPracticeCategory: '',
                        addlPracticeCategorySpecify: '',
                        addlStreet: '',
                        addlCity: '',
                        addlState: '',
                        addlPostcode: '',
                        addlCountry: '',
                      }));
                    }
                  }}
                  style={{ width: 14, height: 14, cursor: 'pointer' }} />
                <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>Yes (please complete additional practice details below)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
                <input type="radio" name="multipleEntities" value="no" checked={(formData as any).multipleEntities === 'no'}
                  onChange={(e) => {
                    handleChange(e);
                    // Clear dynamic fields when switching to 'no'
                    setFormData(prev => ({
                      ...prev,
                      addlName: '',
                      addlPracticeCategory: '',
                      addlPracticeCategorySpecify: '',
                      addlStreet: '',
                      addlStreet2: '',
                      addlCity: '',
                      addlState: '',
                      addlPostcode: '',
                      addlCountry: '',
                      addlEmail: '',
                    }));
                    setErrors(prev => ({
                      ...prev,
                      addlName: '',
                      addlPracticeCategory: '',
                      addlPracticeCategorySpecify: '',
                      addlStreet: '',
                      addlCity: '',
                      addlState: '',
                      addlPostcode: '',
                      addlCountry: '',
                    }));
                  }}
                  style={{ width: 14, height: 14, cursor: 'pointer' }} />
                <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>No</span>
              </label>
            </div>
            {(errors as any).multipleEntities && <span className="error-message">{(errors as any).multipleEntities}</span>}
          </div>

          {(formData as any).multipleEntities === 'yes' && (
            <div style={{marginTop:20}}>
              <h3 style={{fontSize:16,fontWeight:700,color:'#0b1220',textTransform:'uppercase',marginBottom:12}}>Additional Practice/Employment Details</h3>

              <FormField
                name="addlName"
                label="Name of place of practice/employer *"
                placeholder=""
                value={(formData as any).addlName}
                onChange={handleChange}
                onBlur={handleBlurInput('addlName')}
                error={(errors as any).addlName}
                required
              />
              <div style={{marginTop:8}}>
                <FormField
                  name="addlStreet"
                  label="Address of additional place of practice/employer *"
                  placeholder=""
                  value={(formData as any).addlStreet}
                  onChange={handleChange}
                  onBlur={handleBlurInput('addlStreet')}
                  error={(errors as any).addlStreet}
                  required
                />
              </div>
              <div style={{marginTop:8}}>
                <FormField
                  name="addlStreet2"
                  label="Street Address line 2"
                  placeholder=""
                  value={(formData as any).addlStreet2}
                  onChange={handleChange}
                />
              </div>
              <div className="grid" style={{marginTop:8, gridTemplateColumns:'1fr 1fr 1fr'}}>
                <FormField
                  name="addlCity"
                  label="City *"
                  placeholder=""
                  value={(formData as any).addlCity}
                  onChange={handleChange}
                  onBlur={handleBlurInput('addlCity')}
                  error={(errors as any).addlCity}
                  required
                />
                <FormField
                  name="addlState"
                  label="State *"
                  placeholder=""
                  value={(formData as any).addlState}
                  onChange={handleChange}
                  onBlur={handleBlurInput('addlState')}
                  error={(errors as any).addlState}
                  required
                />
                <FormField
                  name="addlPostcode"
                  label="Postcode *"
                  placeholder=""
                  value={(formData as any).addlPostcode}
                  onChange={handleChange}
                  onBlur={handleBlurInput('addlPostcode')}
                  error={(errors as any).addlPostcode}
                  required
                />
              </div>
              <div style={{marginTop:8}}>
                <CountrySelect
                  name="addlCountry"
                  label="Country *"
                  value={(formData as any).addlCountry}
                  onChange={handleChange as any}
                  error={(errors as any).addlCountry}
                  required
                />
              </div>
              <div className="grid" style={{marginTop:8}}>
                <div>
                  <FormField
                    name="addlEmail"
                    label="Email address"
                    placeholder=""
                    type="email"
                    value={(formData as any).addlEmail}
                    onChange={handleChange}
                    onBlur={handleBlurInput('addlEmail')}
                    error={(errors as any).addlEmail}
                  />
                  <p style={{fontSize:'12px',color:'#6b7280',marginTop:'4px',marginBottom:'8px'}}>
                    This is the email address that will be publicly displayed on the register of solicitors.
                  </p>
                </div>
                <FormField
                  name="addlPhone"
                  label="Phone number of place of practice/employer"
                  placeholder="+61 2 0000 0000"
                  type="tel"
                  value={(formData as any).addlPhone}
                  onChange={handleChange}
                />
              </div>
              <div style={{marginTop:8}}>
                <DateField
                  name="addlDateCommencement"
                  label="Date from when you commenced, or will commence practice/employment"
                  value={(formData as any).addlDateCommencement}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={(errors as any).addlDateCommencement}
                  required
                  allowFuture
                />
                {previousFinancialYearNotice(
                  showsPreviousFinancialYearNotice((formData as any).addlDateCommencement || ''),
                  previousFinancialYearNoticeContent()
                )}
              </div>

              <div>
                <div style={{display:'grid', gridTemplateColumns:(formData as any).addlPracticeCategory === 'principal' ? '1fr 1fr' : '1fr', gap:32}}>
                  <div>
                    <p style={{ fontSize: 16, color: '#0b1220', fontWeight: 600, marginBottom: 4 }}>
                      What is the category of practice you are engaging in? <span style={{ color: '#F26522' }}>*</span>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      {[
                        { value: 'principal', label: 'Principal of a law practice' },
                        { value: 'employee', label: 'Employee of a law practice' },
                        { value: 'corporate', label: 'Corporate legal practitioner' },
                        { value: 'government', label: 'Government legal practitioner' },
                        { value: 'volunteer', label: 'Volunteer of a community legal service (a volunteer PC will only be granted to an applicant who will be volunteering with a community legal service registered with the Law Society, and, will not be granted to an applicant residing or have a PPP outside of Australia)' },
                      ].map(opt => (
                        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="radio" name="addlPracticeCategory" value={opt.value} checked={(formData as any).addlPracticeCategory === opt.value} onChange={e => {
                            if (opt.value !== 'principal') {
                              setFormData(prev => ({ ...prev, addlPracticeCategory: opt.value, addlPracticeCategorySpecify: '' }));
                            } else {
                              handleChange(e);
                            }
                            if ((errors as any).addlPracticeCategory) setErrors(prev => ({ ...prev, addlPracticeCategory: '' }));
                          }} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                          <span style={{ fontSize: 16, color: '#0b1220', fontWeight: 400 }}>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {(errors as any).addlPracticeCategory && <span className="error-message">{(errors as any).addlPracticeCategory}</span>}
                  </div>

                  {(formData as any).addlPracticeCategory === 'principal' && (
                    <div>
                      <p style={{fontSize:16,color:'#0b1220',fontWeight:600,marginBottom:4}}>Please specify: <span style={{color:'#F26522'}}>*</span></p>
                      <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                        {[
                          { value: 'sole', label: 'Sole practitioner' },
                          { value: 'ilp', label: 'Principal of an ILP' },
                          { value: 'partner', label: 'Partner of a law firm' },
                          { value: 'supervising', label: 'Supervising legal practitioner of a community legal service' },
                        ].map(opt => (
                          <label key={opt.value} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                            <input type="radio" name="addlPracticeCategorySpecify" value={opt.value}
                              checked={(formData as any).addlPracticeCategorySpecify === opt.value}
                              onChange={e => setFormData(prev => ({...prev, addlPracticeCategorySpecify: e.target.value}))}
                              style={{width:14,height:14,cursor:'pointer'}} />
                            <span style={{fontSize:16,color:'#0b1220',fontWeight:400}}>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                      {(errors as any).addlPracticeCategorySpecify && <span className="error-message">{(errors as any).addlPracticeCategorySpecify}</span>}
                    </div>
                  )}
                </div>
				      {(formData as any).addlPracticeCategory === 'principal' && (
                <div style={{display:'grid', gridTemplateColumns:(formData as any).addlPracticeCategorySpecify === 'supervising' ? '1fr' : '1fr 1fr', gap:32, marginTop:16}}>
                  <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220'}}>
                    You must hold a principal of a law practice practising certificate (PC) to practice in this manner. Please access your LawID account to check the category and conditions of your current PC before submitting this form. To be eligible to hold a principal of a law practice PC, you must have satisfied the statutory condition of <a href="https://www.lawsociety.com.au/practising-law-in-NSW/working-as-a-solicitor-in-NSW/supervised-legal-practice" target="_blank" rel="noopener noreferrer" style={{color:'#F26522',whiteSpace:'nowrap'}}>supervised legal practice (condition 2)</a> and completed an <a href="https://www.lawsociety.com.au/practising-law-nsw/working-solicitor-nsw/managing-your-practice/practice-management-course" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>accredited practice management course (condition 3)</a>, among other requirements.
                  </div>
                  {(formData as any).addlPracticeCategorySpecify !== 'supervising' && (
                    <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220'}}>
                      You must contribute to the <a href="https://www.lawsociety.com.au/practising-law-in-NSW/trust-money-and-fidelity-funds/legal-practitioners-fidelity-fund" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>Legal Practitioners Fidelity Fund</a> before practising in this manner. If you have not made a contribution to the fidelity fund for the current certificate year, you will be required to make payment as part of this application. You are not authorised to engage in legal practice as a principal of a law practice until payment has been received for the current certificate year.
                    </div>
                  )}
                </div>
              )}

            {(formData as any).addlPracticeCategory === 'employee' && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220',marginTop:16}}>
                You must contribute to the <a href="https://www.lawsociety.com.au/practising-law-in-NSW/trust-money-and-fidelity-funds/legal-practitioners-fidelity-fund" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>Legal Practitioners Fidelity Fund</a> before practising in this manner. If you have not made a contribution to the fidelity fund for the current certificate year, you will be required to make payment as part of this application. You are not authorised to engage in legal practice as an employee of a law practice until payment has been received for the current certificate year.
              </div>
            )}

            {(formData as any).addlPracticeCategory === 'corporate' && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220',marginTop:16}}>
                <p style={{margin:'0 0 12px 0'}}>Please refer to the definition of a corporate legal practitioner, pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.6" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 6</a> of the Uniform Law. Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 47(1)</a> of the Uniform Law the holder is authorised to engage in legal practice as a corporate legal practitioner or government legal practitioner and also as a volunteer at a community legal service, or otherwise on a pro bono basis<sup>**</sup>.</p>
              </div>
            )}

            {(formData as any).addlPracticeCategory === 'government' && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220',marginTop:16}}>
                <p style={{margin:'0 0 12px 0'}}>Please refer to the definition of a government legal practitioner, pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#sec.6" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 6</a> of the Uniform Law. Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 47(1)</a> of the Uniform Law the holder is authorised to engage in legal practice as a government legal practitioner or corporate legal practitioner and also as a volunteer at a community legal service, or otherwise on a pro bono basis<sup>**</sup>.</p>
              </div>
            )}

            {(formData as any).addlPracticeCategory === 'volunteer' && (
              <div style={{backgroundColor:'#e8f0f6',borderLeft:'4px solid #394F5A',padding:'16px 20px',borderRadius:4,fontSize:15,lineHeight:'24px',color:'#0b1220',marginTop:16}}>
                <p style={{margin:'0 0 12px 0'}}>Pursuant to <a href="https://legislation.nsw.gov.au/view/html/inforce/current/act-2014-16a#ch.3-pt.3.3-div.3" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>section 47(1)</a> of the Uniform Law, the holder is authorised to engage in legal practice both as a volunteer at a community legal service and otherwise on a pro bono basis, only<sup>**</sup>.</p>
              </div>
            )}

            {(formData as any).addlPracticeCategory === 'principal' && (formData as any).addlPracticeCategorySpecify === 'ilp' && (
              <div style={{marginTop:16}}>
                <p style={{fontSize:15,color:'#0b1220',lineHeight:'22px',marginBottom:8}}>
                  If you are being appointed as a principal of an existing Incorporated Legal Practice on our records, please upload a copy of a current ASIC extract evidencing your current appointment as a Director of the company. <span style={{color:'#F26522'}}>*</span>
                </p>
                <FileUploadField
                  files={ilpAsicAttachment}
                  onFilesChange={(f) => { setIlpAsicAttachment(f); if (f) setErrors((prev: any) => ({...prev, ilpAsicAttachment: ''})); }}
                  error={(errors as any).ilpAsicAttachment}
                />
              </div>
            )}
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

          <div className="section-divider" />

          {/* Section 5 - Declaration */}
          <h2 className="section-title">5. Declaration</h2>

          <div style={{marginTop:12}}>
            <p style={{fontSize:16,fontWeight:600,color:'#0b1220',marginBottom:12}}>I declare that:</p>

            <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',marginBottom:10}}>
              <input
                type="checkbox"
                name="declarationConfirm"
                value="yes"
                checked={formData.declarationConfirm === 'yes'}
                onChange={e => setFormData(prev => ({...prev, declarationConfirm: e.target.checked ? 'yes' : ''}))}
                style={{marginTop:3,flexShrink:0}}
              />
              <span style={{fontSize:16,color:'#0b1220'}}>I am the above-named Australian legal practitioner; <span style={{color:'#F26522'}}>*</span></span>
            </label>

            <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',marginBottom:10}}>
              <input
                type="checkbox"
                name="declarationContentsTrue"
                checked={(formData as any).declarationContentsTrue === true}
                onChange={e => setFormData(prev => ({...prev, declarationContentsTrue: e.target.checked}))}
                style={{marginTop:3,flexShrink:0}}
              />
              <span style={{fontSize:16,color:'#0b1220'}}>The contents of this form are true and correct to the best of my knowledge; and <span style={{color:'#F26522'}}>*</span></span>
            </label>

            <label style={{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',marginBottom:12}}>
              <input
                type="checkbox"
                name="declarationPrivacy"
                checked={(formData as any).declarationPrivacy === true}
                onChange={e => setFormData(prev => ({...prev, declarationPrivacy: e.target.checked}))}
                style={{marginTop:3,flexShrink:0}}
              />
              <span style={{fontSize:16,color:'#0b1220'}}>
                I have read the <a href="https://www.lawsociety.com.au/privacy-policy/personal-information-collection-notice" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>Personal Information Collection Notice</a> before providing my personal information and agree to the below terms: <span style={{color:'#F26522'}}>*</span>
                <br /><br />
                The Law Society of New South Wales respects your privacy and the confidentiality and security of personal information provided by you to us. The information provided by you to the Law Society on this form will be used by the Law Society for the purposes of communicating with you in relation to our regulatory functions with our <a href="https://www.lawsociety.com.au/privacy-policy/personal-information-collection-notice" target="_blank" rel="noopener noreferrer" style={{color:'#F26522'}}>Personal Information Collection Notice</a>.
              </span>
            </label>

            {errors.declarationConfirm && (
              <span className="error-message">{errors.declarationConfirm}</span>
            )}
          </div>

          {/* Fee Section — shown after declaration, only when engaging in practice */}
          {formData.engagingInPractice === 'yes' && (
            <>
          <div className="section-divider" />
          <h2 className="section-title">6. Schedule of Fees and Payment</h2>
          <div style={{ marginTop: 12, marginBottom: 24 }}>
          {(() => {
            const newCatDisplay = (formData as any).practiceCategory as string;
            const newCatDisplayEntity2 = (formData as any).addlPracticeCategory as string;
            const isMultiEntity = (formData as any).multipleEntities === 'yes';
            const prevCatDisplay = (formData as any).previousPracticeCategory as string;
            const catGroupLabel = (cat: string) => {
              if (cat === 'principal' || cat === 'employee') return 'Principal/Employee';
              if (cat === 'government' || cat === 'corporate') return 'Government/Corporate';
              if (cat === 'volunteer') return 'Volunteer';
              return cat;
            };
            const prevLabel = prevCatDisplay ? catGroupLabel(prevCatDisplay) : null;
            const newLabel  = newCatDisplay  ? catGroupLabel(newCatDisplay)  : null;
            const newLabelEntity2 = newCatDisplayEntity2 ? catGroupLabel(newCatDisplayEntity2) : null;
            const canShow = isMultiEntity
              ? !!newCatDisplay && !!newCatDisplayEntity2 && !!prevCatDisplay && !!formData.dateOfCommencement && !!(formData as any).addlDateCommencement
              : !!newCatDisplay && !!prevCatDisplay && !!formData.dateOfCommencement;
            const calcFeePc = feeData?.feePc ?? 0;
            const calcFeeFidelity = feeData?.feeFidelity ?? 0;
            const calcTotal = feeData?.feeAmount ?? 0;
            return (
              <div style={{ marginTop: 24 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: 'calc(100% - 30px)', borderCollapse: 'collapse', fontSize: 14, minWidth: 520, border: '1px solid #b0a898', marginLeft: 15, marginRight: 15 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#cfc3b0' }}>
                        {[
                          { label: 'Previous Category', align: 'left' as const },
                          ...(isMultiEntity
                            ? [
                                { label: 'New Category (Entity 1)', align: 'left' as const },
                                { label: 'New Category (Entity 2)', align: 'left' as const },
                              ]
                            : [
                                { label: 'New Category', align: 'left' as const },
                              ]),
                          { label: 'PC Fee', align: 'right' as const },
                          { label: 'Fidelity Fund Contribution', align: 'right' as const },
                          { label: 'Total Fee', align: 'right' as const },
                        ].map(col => (
                          <th key={col.label} style={{ textAlign: col.align, padding: '10px 14px', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #b0a898', whiteSpace: 'nowrap' }}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ backgroundColor: '#F4F3EF' }}>
                        {feeLoading ? (
                          <td colSpan={isMultiEntity ? 6 : 5} style={{ padding: '10px 14px', color: '#6b7280', fontStyle: 'italic' }}>Calculating fees…</td>
                        ) : canShow ? (
                          <>
                            <td style={{ padding: '10px 14px', textAlign: 'left', color: '#0b1220' }}>{prevLabel}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'left', color: '#0b1220' }}>{newLabel}</td>
                            {isMultiEntity && (
                              <td style={{ padding: '10px 14px', textAlign: 'left', color: '#0b1220' }}>{newLabelEntity2}</td>
                            )}
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>{calcFeePc > 0 ? `$${calcFeePc}` : '—'}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}>{calcFeeFidelity > 0 ? `$${calcFeeFidelity}` : '—'}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0b1220' }}><strong>{`$${calcTotal}`}</strong></td>
                          </>
                        ) : (
                          <td colSpan={isMultiEntity ? 6 : 5} style={{ padding: '10px 14px', color: '#6b7280', fontStyle: 'italic' }}>
                            Complete previous/new practice category and effective date above to see your fees.
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 16, backgroundColor: '#e8f0f6', borderLeft: '4px solid #394F5A', padding: '16px 20px', borderRadius: 4 }}>
                  <p style={{ fontSize: 15, lineHeight: '24px', color: '#0b1220', margin: 0 }}>
                    <strong>NOTE:</strong> The PC Fee and Fidelity Fund Contribution do not attract GST. Half fees apply when the effective date of your practising certificate falls between 1 January and 30 June.
                  </p>
                </div>
              </div>
            );
          })()}
          </div>
            </>
          )}

          <div className="section-divider" />

          {(attachmentLimitError || submitError) && (
            <div className="submit-error-banner">
              <strong>Error:</strong> {attachmentLimitError || submitError}
            </div>
          )}

          {isSubmitting && (
            <div className="submit-processing-banner">
              <strong>Processing:</strong> Submitting your form...
            </div>
          )}

          <Footer 
            variant="registry"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isSubmitDisabled={Boolean(attachmentLimitError)}
            hideSubmit={false}
          />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default ChangeEmploymentDetailsForm;
