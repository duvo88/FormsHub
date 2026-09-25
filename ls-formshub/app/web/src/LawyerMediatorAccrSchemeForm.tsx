import React, { useState, useEffect } from 'react';
import './App.css';
import './components/components.css';
import DateField from './components/DateField';
import Footer from './components/Footer';
import FormErrorSummary, { FormErrorSummaryItem } from './components/FormErrorSummary';
import ProgramInfo from './components/ProgramInfo';
import apiService from './services/apiService';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useAuthPrefill } from './hooks/useAuthPrefill';
import FileUploadField from './components/FileUploadField';
import { getTotalAttachmentLimitError } from './utils/validation';
import { getCheckoutUrlOrThrow } from './utils/submission';
import { getValidationSummary, focusFieldByName } from './utils/formErrorSummary';
import { FORM_TYPES, FORM_TYPES_SHORT } from './constants/formTypes';
import { FORM_NAMES } from './constants/formNames';

type TrainingOption = 'section_2_2' | 'nmas_amdras';
type InsuranceOption = 'private' | 'employee' | 'statutory';

function LawyerMediatorAccrSchemeForm() {
    
    const [formData, setFormData] = useState({
        // Part 1: Personal Details
        lawID: '',
        title: '',
        firstName: '',
        surname: '',
        firmPracticeName: '',
        addressForCorrespondence: '',
        
        // Part 2: Mediator Accreditation Requirements
        trainingOption: '' as TrainingOption | '',
        mediationTrainingProgram: '',
        rapName: '',
        startDateAccreditation: '',
        endDateAccreditation: '',
        
        // Part 3: Approval Requirements
        approvalConfirm1: false,
        approvalConfirm2: false,
        approvalConfirm3: false,
        approvalConfirm4: false,
        approvalConfirm5: false,
        approvalConfirm6: false,
        approvalConfirm7: false,
        approvalConfirm8: false,
        approvalConfirm9: false,
        
        // Part 4: Insurance
        insuranceOption: '' as InsuranceOption | '',
        insuranceCompanyName: '',
        policyNumber: '',
        expiryDatePolicy: '',
        employerAgencyName: '',
        statutoryIndemnityDetails: '',
        
        // Part 5: Declaration
        declarationTruth: false,
        declarationPrivacy: false,
    });

    const [attachments, setAttachments] = useState<{
        trainingCertificate: File[] | null;
        mediatorSkillsAssessment: File[] | null;
        nmasAccreditation: File[] | null;
    }>({
        trainingCertificate: null,
        mediatorSkillsAssessment: null,
        nmasAccreditation: null,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [validationSummary, setValidationSummary] = useState<FormErrorSummaryItem[]>([]);
    const [attachmentLimitError, setAttachmentLimitError] = useState<string | null>(null);
    const [simpleFee, setSimpleFee] = useState<number | null>(null);
    const { lawSocietyId: authenticatedLawSocietyId, email: userEmail, name: userName, firstName: authFirstName, surname: authSurname, title: authTitle } = useAuthenticatedUser();

    useEffect(() => {
        apiService.getSimpleFee('lawyer-mediator').then(amt => setSimpleFee(amt)).catch(() => {});
    }, []);

    useAuthPrefill(setFormData, {
        lawID: userEmail,
        title: authTitle,
        firstName: authFirstName,
        surname: authSurname,
    });

    useEffect(() => {
        const nextAttachmentLimitError = getTotalAttachmentLimitError(attachments);
        setAttachmentLimitError(nextAttachmentLimitError);
        if (!nextAttachmentLimitError && submitError?.startsWith('Exceeded attachment size')) {
            setSubmitError(null);
        }
    }, [attachments, submitError]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Map for checkbox and radio label text
        const labelTextMap: Record<string, string> = {
            // Part 3 approval checkboxes
            'approvalConfirm1': 'I hold a current Australian Practising Certificate authorising me to engage in legal practice.',
            'approvalConfirm2': 'I am a member of The Law Society of New South Wales and will maintain membership for my accreditation period.',
            'approvalConfirm3': 'I have no impairment that would compromise my capacity to discharge my obligations as a mediator in a competent, honest and appropriate manner.',
            'approvalConfirm4': 'I have read the LMA Scheme Mediation Practice Standards and Mediator Accreditation Requirements.',
            'approvalConfirm5': 'I undertake to comply with any relevant legislation and the LMA Scheme Mediation Practice Standards and Mediator Accreditation Requirements.',
            'approvalConfirm6': 'I agree to The Law Society of New South Wales making enquiries about me concerning my fitness and propriety to be an accredited mediator, which include the matters set out in Rule 13(1) of the Legal Profession Uniform General Rules 2015.',
            'approvalConfirm7': 'I authorise the Legal Regulation Department of The Law Society of New South Wales and the NSW Legal Services Commissioner to advise and release to The Law Society of New South Wales Lawyer Mediator Accreditation Scheme any adverse disciplinary matters or findings that may be made against me at any time.',
            'approvalConfirm8': 'I hereby undertake that if I am accredited by The Law Society of New South Wales, I will notify The Law Society of New South Wales, in writing, within 7 days or any shorter period required by law, if and when I become aware of any adverse circumstances as set out immediately above.',
            'approvalConfirm9': 'I consent to my name and my period of accreditation being published on the LMA Scheme Register.',
            // Part 5 declaration checkboxes
            'declarationTruth': 'I declare that the information and particulars set out in this application form are true and correct to the best of my knowledge.',
            'declarationPrivacy': "I have read the Law Society's Personal Information Collection Notice.",
        };
        
        // Map for insurance radio options
        const insuranceTextMap: Record<string, string> = {
            'private': '(i) I confirm that I have private professional indemnity insurance.',
            'employee': '(ii) I confirm that I have employee status (which provides me with insurance cover where relevant) or statutory indemnity through my employer or the agency that I work with.',
            'statutory': '(iii) I have statutory indemnity that covers me including work undertaken as a mediator.'
        };
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ 
                ...prev, 
                [name]: checked,
                // Add text field for checkboxes
                ...(labelTextMap[name] ? { [`${name}Text`]: labelTextMap[name] } : {})
            }));
        } else if (type === 'radio' && name === 'insuranceOption') {
            // Radio button with text lookup
            setFormData(prev => ({ 
                ...prev, 
                [name]: value as InsuranceOption,
                [`${name}Text`]: insuranceTextMap[value] || value
            } as any));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear dynamic fields when Part 2 training option changes
        if (name === 'trainingOption') {
            const trainingVal = value as TrainingOption;
            if (trainingVal !== 'section_2_2') {
                setFormData(prev => ({ ...prev, trainingOption: trainingVal, mediationTrainingProgram: '' }));
                setAttachments(prev => ({ ...prev, trainingCertificate: null, mediatorSkillsAssessment: null }));
            }
            if (trainingVal !== 'nmas_amdras') {
                setFormData(prev => ({ ...prev, trainingOption: trainingVal, rapName: '', startDateAccreditation: '', endDateAccreditation: '' }));
                setAttachments(prev => ({ ...prev, nmasAccreditation: null }));
            }
        }

        // Clear dynamic fields when Part 4 insurance option changes
        if (name === 'insuranceOption') {
            const insuranceVal = value as InsuranceOption;
            if (insuranceVal !== 'private') {
                setFormData(prev => ({ ...prev, insuranceOption: insuranceVal, insuranceCompanyName: '', policyNumber: '', expiryDatePolicy: '' }));
            }
            if (insuranceVal !== 'employee') {
                setFormData(prev => ({ ...prev, insuranceOption: insuranceVal, employerAgencyName: '' }));
            }
            if (insuranceVal !== 'statutory') {
                setFormData(prev => ({ ...prev, insuranceOption: insuranceVal, statutoryIndemnityDetails: '' }));
            }
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
            setValidationSummary(prev => prev.filter(item => item.field !== name));
        }
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
        const newErrors: Record<string, string> = {};

        // Validate Part 1
        if (!formData.lawID.trim()) newErrors.lawID = 'LawID is required';
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
        if (!formData.addressForCorrespondence.trim()) newErrors.addressForCorrespondence = 'Address is required';

        // Part 2 - No mandatory validation

        // Validate Part 3
        if (!formData.approvalConfirm1) newErrors.approvalConfirm1 = 'Required';
        if (!formData.approvalConfirm2) newErrors.approvalConfirm2 = 'Required';
        if (!formData.approvalConfirm3) newErrors.approvalConfirm3 = 'Required';
        if (!formData.approvalConfirm4) newErrors.approvalConfirm4 = 'Required';
        if (!formData.approvalConfirm5) newErrors.approvalConfirm5 = 'Required';
        if (!formData.approvalConfirm6) newErrors.approvalConfirm6 = 'Required';
        if (!formData.approvalConfirm7) newErrors.approvalConfirm7 = 'Required';
        if (!formData.approvalConfirm8) newErrors.approvalConfirm8 = 'Required';
        if (!formData.approvalConfirm9) newErrors.approvalConfirm9 = 'Required';

        // Validate Part 4
        if (!formData.insuranceOption) {
            newErrors.insuranceOption = 'Please select an option';
        }
        if (formData.insuranceOption === 'private') {
            if (!formData.insuranceCompanyName.trim()) newErrors.insuranceCompanyName = 'Name of insurance company is required';
            if (!formData.policyNumber.trim()) newErrors.policyNumber = 'Policy number is required';
            if (!formData.expiryDatePolicy.trim()) newErrors.expiryDatePolicy = 'Expiry date is required';
        }
        if (formData.insuranceOption === 'employee') {
            if (!formData.employerAgencyName.trim()) newErrors.employerAgencyName = 'Name of employer/agency is required';
        }
        if (formData.insuranceOption === 'statutory') {
            if (!formData.statutoryIndemnityDetails.trim()) newErrors.statutoryIndemnityDetails = 'Please provide details';
        }

        // Part 5 - Declaration
        if (!formData.declarationTruth) newErrors.declarationTruth = 'You must agree to this declaration';
        if (!formData.declarationPrivacy) newErrors.declarationPrivacy = 'You must agree to this declaration';

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            setValidationSummary(getValidationSummary(newErrors));
            const firstErrorField = Object.keys(newErrors)[0];
            if (firstErrorField) {
                focusFieldByName(firstErrorField);
            }
            return;
        }

        setValidationSummary([]);

        const formType = FORM_TYPES.LAWYER_MEDIATOR_ACCREDITATION_SCHEME;
        const formTypeShort = FORM_TYPES_SHORT.LAWYER_MEDIATOR_ACCREDITATION_SCHEME;
        const lawSocietyId = authenticatedLawSocietyId || formData.lawID || '';

        try {
            setIsSubmitting(true);

            // Upload attachments - backend will generate and return the submissionId
            const { submissionId, blobUrls } = await apiService.uploadAllAttachments(formType, lawSocietyId, formTypeShort, attachments);

            const submissionData = {
                formType,
                applicantDetails: {
                    title: formData.title,
                    firstName: formData.firstName,
                    surname: formData.surname,
                    firmPracticeName: formData.firmPracticeName,
                    addressForCorrespondence: formData.addressForCorrespondence,
                },
                mediatorAccreditationRequirements: {
                    trainingOption: formData.trainingOption,
                    mediationTrainingProgram: formData.mediationTrainingProgram,
                    rapName: formData.rapName,
                    startDateAccreditation: formData.startDateAccreditation,
                    endDateAccreditation: formData.endDateAccreditation
                },
                approvalRequirements: {
                    confirmations: {
                        practisingCertificate: formData.approvalConfirm1,
                        practisingCertificateText: (formData as any).approvalConfirm1Text,
                        lawSocietyMembership: formData.approvalConfirm2,
                        lawSocietyMembershipText: (formData as any).approvalConfirm2Text,
                        noImpairment: formData.approvalConfirm3,
                        noImpairmentText: (formData as any).approvalConfirm3Text,
                        readStandards: formData.approvalConfirm4,
                        readStandardsText: (formData as any).approvalConfirm4Text,
                        undertakeComply: formData.approvalConfirm5,
                        undertakeComplyText: (formData as any).approvalConfirm5Text,
                        agreeEnquiries: formData.approvalConfirm6,
                        agreeEnquiriesText: (formData as any).approvalConfirm6Text,
                        authoriseRelease: formData.approvalConfirm7,
                        authoriseReleaseText: (formData as any).approvalConfirm7Text,
                        notifyAdverse: formData.approvalConfirm8,
                        notifyAdverseText: (formData as any).approvalConfirm8Text,
                        consentPublish: formData.approvalConfirm9,
                        consentPublishText: (formData as any).approvalConfirm9Text
                    }
                },
                insurance: {
                    insuranceOption: formData.insuranceOption,
                    insuranceOptionText: (formData as any).insuranceOptionText,
                    insuranceCompanyName: formData.insuranceCompanyName,
                    policyNumber: formData.policyNumber,
                    expiryDatePolicy: formData.expiryDatePolicy,
                    employerAgencyName: formData.employerAgencyName,
                    statutoryIndemnityDetails: formData.statutoryIndemnityDetails
                },
                declaration: {
                    truthDeclaration: formData.declarationTruth,
                    truthDeclarationText: (formData as any).declarationTruthText,
                    privacyDeclaration: formData.declarationPrivacy,
                    privacyDeclarationText: (formData as any).declarationPrivacyText,
                },
                submittedAt: new Date().toISOString().replace('Z', '+00:00')
            };

            const formName = FORM_NAMES.LAWYER_MEDIATOR_ACCREDITATION_SCHEME;
            const price = simpleFee ?? 100;

            const fieldLabels: Record<string, string> = {
                title: 'Title', firstName: 'First Name', surname: 'Surname',
                firmPracticeName: 'Firm/Practice Name', addressForCorrespondence: 'Address for Correspondence',
                trainingOption: 'Training Option',
                mediationTrainingProgram: 'I confirm I have completed one of the following mediation training programs',
                rapName: 'Name of Recognised Accreditation Provider (RAP)',
                startDateAccreditation: 'Start Date of Accreditation', endDateAccreditation: 'End Date of Accreditation',
                practisingCertificate: 'Current Australian Practising Certificate',
                lawSocietyMembership: 'Law Society Membership', noImpairment: 'No Impairment',
                readStandards: 'Read LMA Scheme Standards', undertakeComply: 'Undertake to Comply',
                agreeEnquiries: 'Agree to Enquiries', authoriseRelease: 'Authorise Release',
                notifyAdverse: 'Notify Adverse Circumstances', consentPublish: 'Consent to Publish',
                insuranceOption: 'Insurance Option', insuranceCompanyName: 'Name of Insurance Company',
                policyNumber: 'Policy Number', expiryDatePolicy: 'Expiry Date of Policy',
                employerAgencyName: 'Name of employer/agency', statutoryIndemnityDetails: 'Statutory Indemnity Details',
                truthDeclaration: 'Declaration of Truth', privacyDeclaration: 'Privacy Declaration'
            };

            const sectionLabels: Record<string, string> = {
                applicantDetails: 'Personal Details',
                mediatorAccreditationRequirements: 'Mediator Accreditation Requirements',
                approvalRequirements: 'Approval Requirements',
                insurance: 'Insurance',
                declaration: 'Declaration',
            };

            const lineItems = [
                {
                    name: 'Lawyer Mediator Accreditation Scheme',
                    amountCents: Math.round(price * 100),
                    hasGst: true
                }
            ];

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
                    businessUnit: '1640',
                    sku: '80131',
                    receiptCategory: 'a2j'
                },
                fieldLabels,
                sectionLabels,
                undefined,
                undefined,
                lineItems
            );

            window.location.href = getCheckoutUrlOrThrow(result, apiService.getSafeCheckoutUrl);
        } catch (error) {
            console.error('Error submitting form');
            setSubmitError(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="App page-root">
            <main className="form-container">
                <section className="form-card" style={{
                    margin: 62,
                    padding: '22px 32px 80px 32px',
                }}>
                    <ProgramInfo
                        dividerColor="#F26522"
                        dividerWidth="3px"
                        dividerMarginTop={10}
                        title={"Application for Accreditation as a Mediator Under the Law Society of New South Wales Lawyer Mediator Accreditation Scheme (LMA Scheme)"}
                        description={
                            <div style={{ marginTop: 10 }}>
                                <p>This scheme has been independently developed by The Law Society of New South Wales, and is not otherwise produced, approved, sponsored or endorsed by, or otherwise affiliated with any other mediation or dispute resolution standards organisation.</p>
                                
                                <div style={{ border: '1px solid #000', padding: '16px 16px', marginTop: 35, marginBottom: 16 }}>
                                    <p>Only use this form if you are a current member of The Law Society of New South Wales and hold a current Practising Certificate.</p>
                                    <p>Before completing this form, you must familiarise yourself with the LMA Scheme Mediation Practice Standards and Mediator Accreditation Requirements.</p>
                                    <p>If you have any questions about the LMA Scheme and/or your eligibility, please contact the Director, Access to Justice on <span style={{ whiteSpace: 'nowrap' }}>(02) 9926 0333</span> or via <a href="mailto:a2j@lawsociety.com.au">a2j@lawsociety.com.au</a>.</p>
                                    <p style={{ marginBottom: 0 }}>The information requested on this form will be used to process your application for accreditation as a mediator under the LMA Scheme for a two-year period.</p>
                                </div>
                                
                                <div style={{ border: '1px solid #000', padding: '16px 16px', marginTop: 16, marginBottom: 16 }}>
                                    <h4 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>Personal Information Collection Notice</h4>
                                    <p><strong>By completing this form, you are providing personal information. Please read the Law Society's <a href="https://www.lawsociety.com.au/privacy-policy/personal-information-collection-notice" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522', textDecoration: 'underline' }}>Personal Information Collection Notice</a>.</strong></p>
                                    <p style={{ marginTop: 20, marginBottom: 20 }}>The Law Society of New South Wales respects your privacy and the confidentiality and security of personal information provided by you to us. The information provided by you to the Law Society on this form will be used by the Law Society for the purposes of processing your application. The Law Society's Privacy Policy is accessible at <a href="https://www.lawsociety.com.au/privacy-policy" target="_blank" rel="noopener noreferrer">https://www.lawsociety.com.au/privacy-policy</a>.</p>
                                </div>
                                
                                <div className="section-divider" />
                                
                                <h4 style={{ marginTop: 10, marginBottom: 10 }}>Registration Fee</h4>
                                <p>The accreditation fee for the LMA Scheme is $100.00.</p>
                                                          </div>
                        }
                        showRefundPolicy={false}
                    />

                    <form onSubmit={handleSubmit}>
                        <style>{`
                            .lawyer-mediator-form .required {
                                color: #C0392B;
                            }
                            .error-message {
                                color: #C0392B;
                                font-size: 14px;
                                margin-top: 4px;
                                display: block;
                            }
                            input[type="date"]:not(:focus):not(:valid) {
                                color: transparent;
                            }
                            input[type="date"]::-webkit-calendar-picker-indicator {
                                opacity: 1;
                            }

                        `}</style>
                        <div className="lawyer-mediator-form">
                        <FormErrorSummary
                            items={validationSummary}
                            onSelect={focusFieldByName}
                        />
                        {/* PART 1: PERSONAL DETAILS */}
                        <section className="section-container">
                            <h2 className="section-heading" style={{ borderBottom: 'none', marginTop: 10, marginBottom: 16 }}>PART 1: PERSONAL DETAILS</h2>
                            
                            {/* Hidden fields */}
                            <div style={{ display: 'none' }}>
                                <input type="text" id="lawID" name="lawID" value={formData.lawID} onChange={handleChange} readOnly={!!authenticatedLawSocietyId} />
                                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} readOnly={!!authTitle} />
                            </div>

                            {/* Row 1: First Name + Surname */}
                            <div className="grid" style={{ marginTop: 12 }}>
                                <div className="form-field">
                                    <span className="form-label">First Name: <span className="required">*</span></span>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="form-input"
                                        readOnly={!!authFirstName}
                                        style={!!authFirstName ? { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' } : undefined}
                                    />
                                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                                </div>
                                <div className="form-field">
                                    <span className="form-label">Surname: <span className="required">*</span></span>
                                    <input
                                        type="text"
                                        id="surname"
                                        name="surname"
                                        value={formData.surname}
                                        onChange={handleChange}
                                        className="form-input"
                                        readOnly={!!authSurname}
                                        style={!!authSurname ? { backgroundColor: '#f3f4f6', color: '#374151', cursor: 'default' } : undefined}
                                    />
                                    {errors.surname && <span className="error-message">{errors.surname}</span>}
                                </div>
                            </div>

                            {/* Row 2: Firm/Practice Name full width */}
                            <div className="form-field" style={{ marginTop: 12 }}>
                                <span className="form-label">Firm/Practice Name:</span>
                                <input
                                    type="text"
                                    id="firmPracticeName"
                                    name="firmPracticeName"
                                    value={formData.firmPracticeName}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>

                            {/* Row 3: Address full width */}
                            <div className="form-field" style={{ marginTop: 12 }}>
                                <span className="form-label">Address for Correspondence: <span className="required">*</span></span>
                                <textarea
                                    id="addressForCorrespondence"
                                    name="addressForCorrespondence"
                                    value={formData.addressForCorrespondence}
                                    onChange={handleChange}
                                    className="form-textarea"
                                    rows={2}
                                />
                                {errors.addressForCorrespondence && <span className="error-message">{errors.addressForCorrespondence}</span>}
                            </div>

                            <div className="section-divider" style={{margin:'9px 0'}} />
                        </section>

                        {/* PART 2: MEDIATOR ACCREDITATION REQUIREMENTS */}
                        <section className="section-container">
                            <h2 className="section-heading" style={{ borderBottom: 'none', marginTop: 10, marginBottom: 16 }}>PART 2: MEDIATOR ACCREDITATION REQUIREMENTS</h2>
                            <p style={{ marginBottom: 16 }}>Please complete <strong>ONE</strong>:</p>

                            <div className="form-field" style={{ marginBottom: 24 }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12, cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="trainingOption"
                                        value="section_2_2"
                                        checked={formData.trainingOption === 'section_2_2'}
                                        onChange={handleChange}
                                        style={{ marginRight: 8, marginTop: 4 }}
                                    />
                                    <span>(A) I have completed training and assessment in accordance with Section 2.2 of the Mediator Accreditation Requirements.</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="trainingOption"
                                        value="nmas_amdras"
                                        checked={formData.trainingOption === 'nmas_amdras'}
                                        onChange={handleChange}
                                        style={{ marginRight: 8, marginTop: 4 }}
                                    />
                                    <span>(B) I have current accreditation under NMAS/AMDRAS.</span>
                                </label>
                            </div>

                            {formData.trainingOption === 'section_2_2' && (
                            <>
                            <p style={{ marginBottom: 12 }}>I confirm I have completed one of the following mediation training programs:</p>

                            {[
                                { value: 'college_of_law', label: 'The College of Law - Nationally Accredited Mediator Training Program' },
                                { value: 'resolution_institute', label: 'Resolution Institute - Mediation Training and Assessment Course' },
                                { value: 'mediation_institute', label: 'Mediation Institute - Mediator Training and Assessment Course' },
                                { value: 'adc', label: 'Australian Dispute Centre (ADC) - Mediation Training Course' },
                                { value: 'aiflam', label: 'Australian Institute of Family Law Arbitrators and Mediators (AIFLAM) - Mediation Training and Assessment Course' }
                            ].map((option) => (
                                <div key={option.value} className="form-field" style={{ marginBottom: 8 }}>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="mediationTrainingProgram"
                                            value={option.value}
                                            checked={formData.mediationTrainingProgram === option.value}
                                            onChange={handleChange}
                                            style={{ marginTop: 2 }}
                                        />
                                        <span style={{ flex: 1 }}>{option.label}</span>
                                    </label>
                                </div>
                            ))}

                            <p style={{ fontSize: 14, marginTop: 16, marginBottom: 16 }}>
                                NB. You must apply for accreditation within six months of receiving formal notification from the mediation training course provider that you have met the assessment requirements of that training program.
                            </p>

                            <p style={{ marginBottom: 12 }}>I attach:</p>

                            <div className="form-field" style={{ marginBottom: 16, marginTop: 16 }}>
                                <span className="form-label">A copy of a certificate of completion of this training; and</span>
                                <FileUploadField
                                    files={attachments.trainingCertificate}
                                    onFilesChange={(f) => setAttachments(prev => ({ ...prev, trainingCertificate: f }))}
                                    error={errors.trainingCertificate}
                                />
                            </div>
                            <div className="form-field">
                                <span className="form-label">A copy of the mediator skills assessment.</span>
                                <FileUploadField
                                    files={attachments.mediatorSkillsAssessment}
                                    onFilesChange={(f) => setAttachments(prev => ({ ...prev, mediatorSkillsAssessment: f }))}
                                />
                            </div>
                            </>
                            )}

                            {formData.trainingOption === 'nmas_amdras' && (
                            <>
                            <div className="form-field" style={{ marginBottom: 16 }}>
                                <span className="form-label">Name of Recognised Accreditation Provider (RAP):</span>
                                <input
                                    type="text"
                                    id="rapName"
                                    name="rapName"
                                    value={formData.rapName}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                                {errors.rapName && <span className="error-message">{errors.rapName}</span>}
                            </div>

                            <div className="grid" style={{ marginBottom: 16 }}>
                                <DateField
                                    label="Start Date of Accreditation:"
                                    name="startDateAccreditation"
                                    value={formData.startDateAccreditation}
                                    onChange={handleChange}
                                    error={errors.startDateAccreditation}
                                />
                                <DateField
                                    label="End Date of Accreditation:"
                                    name="endDateAccreditation"
                                    value={formData.endDateAccreditation}
                                    onChange={handleChange}
                                    error={errors.endDateAccreditation}
                                />
                            </div>

                            <p style={{ marginBottom: 12 }}>I attach:</p>

                            <div className="form-field">
                                <span className="form-label">A copy of NMAS/AMDRAS accreditation.</span>
                                <FileUploadField
                                    files={attachments.nmasAccreditation}
                                    onFilesChange={(f) => setAttachments(prev => ({ ...prev, nmasAccreditation: f }))}
                                    error={errors.nmasAccreditation}
                                />
                            </div>
                            </>                            )}
                        </section>

                        <div className="section-divider" style={{margin:'9px 0'}} />

                        {/* PART 3: APPROVAL REQUIREMENTS */}
                        <section className="section-container">
                            <h2 className="section-heading" style={{ borderBottom: 'none', marginTop: 10, marginBottom: 16 }}>PART 3: APPROVAL REQUIREMENTS</h2>
                            <p style={{ marginBottom: 16 }}>I confirm the following:</p>

                            {[
                                { name: 'approvalConfirm1', text: 'I hold a current Australian Practising Certificate authorising me to engage in legal practice.' },
                                { name: 'approvalConfirm2', text: 'I am a member of The Law Society of New South Wales and will maintain membership for my accreditation period.' },
                                { name: 'approvalConfirm3', text: 'I have no impairment that would compromise my capacity to discharge my obligations as a mediator in a competent, honest and appropriate manner.' },
                                { name: 'approvalConfirm4', text: 'I have read the LMA Scheme Mediation Practice Standards and Mediator Accreditation Requirements.' },
                                { name: 'approvalConfirm5', text: 'I undertake to comply with any relevant legislation and the LMA Scheme Mediation Practice Standards and Mediator Accreditation Requirements.' },
                                { name: 'approvalConfirm6', text: 'I agree to The Law Society of New South Wales making enquiries about me concerning my fitness and propriety to be an accredited mediator, which include the matters set out in Rule 13(1) of the Legal Profession Uniform General Rules 2015.' },
                                { name: 'approvalConfirm7', text: 'I authorise the Legal Regulation Department of The Law Society of New South Wales and the NSW Legal Services Commissioner to advise and release to The Law Society of New South Wales Lawyer Mediator Accreditation Scheme any adverse disciplinary matters or findings that may be made against me at any time.' },
                                { name: 'approvalConfirm8', text: 'I hereby undertake that if I am accredited by The Law Society of New South Wales, I will notify The Law Society of New South Wales, in writing, within 7 days or any shorter period required by law, if and when I become aware of any adverse circumstances as set out immediately above.' },
                                { name: 'approvalConfirm9', text: 'I consent to my name and my period of accreditation being published on the LMA Scheme Register.' }
                            ].map((item, index) => (
                                <div key={item.name} className="form-field" style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            name={item.name}
                                            checked={formData[item.name as keyof typeof formData] as boolean}
                                            onChange={handleChange}
                                            style={{ marginRight: 8, marginTop: 4, flexShrink: 0 }}
                                        />
                                        <span>{item.text} <span className="required">*</span></span>
                                    </label>
                                    {errors[item.name] && <span className="error-message">{errors[item.name]}</span>}
                                </div>
                            ))}
                        </section>

                        <div className="section-divider" style={{margin:'9px 0'}} />

                        {/* PART 4: INSURANCE */}
                        <section className="section-container">
                            <h2 className="section-heading" style={{ borderBottom: 'none', marginTop: 10, marginBottom: 16 }}>PART 4: INSURANCE</h2>
                            <p style={{ marginBottom: 16 }}>Tick and complete either (i), (ii) or (iii):</p>

                            <div className="form-field" style={{ marginBottom: 16 }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="insuranceOption"
                                        value="private"
                                        checked={formData.insuranceOption === 'private'}
                                        onChange={handleChange}
                                        style={{ marginRight: 8, marginTop: 4 }}
                                    />
                                    <span>(i) I confirm that I have private professional indemnity insurance.</span>
                                </label>
                            </div>

                            {formData.insuranceOption === 'private' && (
                            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div className="form-field">
                                    <span className="form-label">Name of Insurance Company:</span>
                                    <input
                                        type="text"
                                        id="insuranceCompanyName"
                                        name="insuranceCompanyName"
                                        value={formData.insuranceCompanyName}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                    {errors.insuranceCompanyName && <span className="error-message">{errors.insuranceCompanyName}</span>}
                                </div>
                                <div className="form-field">
                                    <span className="form-label">Policy Number:</span>
                                    <input
                                        type="text"
                                        id="policyNumber"
                                        name="policyNumber"
                                        value={formData.policyNumber}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                    {errors.policyNumber && <span className="error-message">{errors.policyNumber}</span>}
                                </div>
                                <DateField
                                    label="Expiry Date of Policy:"
                                    name="expiryDatePolicy"
                                    value={formData.expiryDatePolicy}
                                    onChange={handleChange}
                                    error={errors.expiryDatePolicy}
                                />
                            </div>
                            )}

                            <div className="form-field" style={{ marginBottom: 16 }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="insuranceOption"
                                        value="employee"
                                        checked={formData.insuranceOption === 'employee'}
                                        onChange={handleChange}
                                        style={{ marginRight: 8, marginTop: 4 }}
                                    />
                                    <span>(ii) I confirm that I have employee status (which provides me with insurance cover where relevant) or statutory indemnity through my employer or the agency that I work with.</span>
                                </label>
                            </div>

                            {formData.insuranceOption === 'employee' && (
                            <div style={{ marginTop: 12, marginBottom: 16 }}>
                                <div className="form-field">
                                    <span className="form-label">Name of employer/agency:</span>
                                    <textarea
                                        id="employerAgencyName"
                                        name="employerAgencyName"
                                        value={formData.employerAgencyName}
                                        onChange={handleChange}
                                        className="form-textarea"
                                        rows={2}
                                        style={{ minHeight: '60px', height: '60px' }}
                                    />
                                    {errors.employerAgencyName && <span className="error-message">{errors.employerAgencyName}</span>}
                                </div>
                            </div>
                            )}

                            <div className="form-field" style={{ marginBottom: 16 }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="insuranceOption"
                                        value="statutory"
                                        checked={formData.insuranceOption === 'statutory'}
                                        onChange={handleChange}
                                        style={{ marginRight: 8, marginTop: 4 }}
                                    />
                                    <span>(iii) I have statutory indemnity that covers me including work undertaken as a mediator.</span>
                                </label>
                            </div>

                            {errors.insuranceOption && <span className="error-message option-group">{errors.insuranceOption}</span>}

                            {formData.insuranceOption === 'statutory' && (
                            <div style={{ marginTop: 12 }}>
                                <div className="form-field">
                                    <span className="form-label">Provide details:</span>
                                    <textarea
                                        id="statutoryIndemnityDetails"
                                        name="statutoryIndemnityDetails"
                                        value={formData.statutoryIndemnityDetails}
                                        onChange={handleChange}
                                        className="form-textarea"
                                        rows={2}
                                        style={{ minHeight: '60px', height: '60px' }}
                                    />
                                    {errors.statutoryIndemnityDetails && <span className="error-message">{errors.statutoryIndemnityDetails}</span>}
                                </div>
                            </div>
                            )}
                        </section>

                        <div className="section-divider" style={{margin:'9px 0'}} />

                        {/* PART 5: DECLARATION */}
                        <section className="section-container">
                            <h2 className="section-heading" style={{ borderBottom: 'none', marginTop: 10, marginBottom: 16 }}>PART 5: DECLARATION</h2>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="declarationTruth"
                                        checked={formData.declarationTruth}
                                        onChange={handleChange}
                                        style={{ marginTop: 4, accentColor: '#F26522' }}
                                    />
                                    <span>I declare that the information and particulars set out in this application form are true and correct to the best of my knowledge. <span style={{ color: '#F26522' }}>*</span></span>
                                </label>
                                {errors.declarationTruth && <span className="error-message">{errors.declarationTruth}</span>}
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="declarationPrivacy"
                                        checked={formData.declarationPrivacy}
                                        onChange={handleChange}
                                        style={{ marginTop: 4, accentColor: '#F26522' }}
                                    />
                                    <span>I have read the Law Society's <a href="https://www.lawsociety.com.au/privacy-policy/personal-information-collection-notice" target="_blank" rel="noopener noreferrer" style={{ color: '#F26522', textDecoration: 'underline' }}>Personal Information Collection Notice</a>. <span style={{ color: '#F26522' }}>*</span></span>
                                </label>
                                {errors.declarationPrivacy && <span className="error-message">{errors.declarationPrivacy}</span>}
                            </div>
                        </section>

                        {(attachmentLimitError || submitError) && (
                            <div className="submit-error-banner">
                                <strong>Error:</strong> {attachmentLimitError || submitError}
                            </div>
                        )}

                        <div className="section-divider" style={{margin:'9px 0'}} />

                        <p style={{ marginBottom: 16, fontSize: 16, color: '#0b1220', textAlign: 'center' }}>
                            Thank you for your application.
                        </p>
                        <p style={{ marginBottom: 24, fontSize: 16, color: '#0b1220', textAlign: 'center' }}>
                            A member of the Access to Justice Department will be in contact with you shortly.
                        </p>

                        <Footer 
                            variant="a2j"
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            isSubmitDisabled={Boolean(attachmentLimitError)}
                        />
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}

export default LawyerMediatorAccrSchemeForm;
