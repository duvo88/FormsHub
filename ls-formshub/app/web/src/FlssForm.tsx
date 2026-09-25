import React, { useState, useEffect } from 'react';
import './App.css';
import './components/components.css';
import Footer from './components/Footer';
import FormErrorSummary, { FormErrorSummaryItem } from './components/FormErrorSummary';
import ProgramInfo from './components/ProgramInfo';
import ApplicantDetails from './components/ApplicantDetails';
import apiService from './services/apiService';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useAuthPrefill } from './hooks/useAuthPrefill';
import { generateSubmissionId, getEmailValidationError } from './utils/validation';
import { getCheckoutUrlOrThrow } from './utils/submission';
import { getValidationSummary, focusFieldByName } from './utils/formErrorSummary';
import { FORM_TYPES, FORM_TYPES_SHORT } from './constants/formTypes';
import { FORM_NAMES } from './constants/formNames';
function FlssForm() {

    const [formData, setFormData] = useState({
        partyName: '',
        referenceNumber: '',
        firstName: '',
        surname: '',
        emailAddress: '',
        legalRep: '',
        lawID: '',
    });

    //mandatory fields errors state
    const [errors, setErrors] = useState({
        partyName: '',
        referenceNumber: '',
        firstName: '',
        surname: '',
        emailAddress: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [validationSummary, setValidationSummary] = useState<FormErrorSummaryItem[]>([]);
    const [simpleFee, setSimpleFee] = useState<number | null>(null);
    const { lawSocietyId: authenticatedLawSocietyId, email: userEmail, name: userName, firstName: authFirstName, surname: authSurname } = useAuthenticatedUser();

    useEffect(() => {
        apiService.getSimpleFee('flss').then(amt => setSimpleFee(amt)).catch(() => {});
    }, []);

    useAuthPrefill(setFormData, {
        firstName: authFirstName,
        surname: authSurname,
        emailAddress: userEmail,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Optionally clear error for the field
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
            setValidationSummary(prev => prev.filter(item => item.field !== name));
        }
    };

    const handleBlur = (fieldName: string, value: string) => {
        let errorMessage = '';

        if (fieldName === 'firstName' && !value.trim()) {
            errorMessage = 'First name is required';
        } else if (fieldName === 'surname' && !value.trim()) {
            errorMessage = 'Surname is required';
        } else if (fieldName === 'partyName' && !value.trim()) {
            errorMessage = 'Name of party payment is required';
        } else if (fieldName === 'emailAddress') {
            errorMessage = getEmailValidationError(value, { required: true });
        } else if (fieldName === 'referenceNumber' && !value.trim()) {
            errorMessage = 'Reference number and name is required';
        }

        setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        // Clear previous error
        setSubmitError(null);
        setValidationSummary([]);
        const newErrors = {
            firstName: '',
            surname: '',
            partyName: '',
            emailAddress: '',
            referenceNumber: '',            
        };

        // Section 1 - Validate required fields
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.surname.trim()) {
            newErrors.surname = 'Surname is required';
        }
        if (!formData.referenceNumber.trim()) {
            newErrors.referenceNumber = 'Reference number is required';
        }
        newErrors.emailAddress = getEmailValidationError(formData.emailAddress, { required: true });
        if (!formData.partyName.trim()) {
            newErrors.partyName = 'Name of party Payment is required';
        }

        setErrors(newErrors);

        // If there are any errors, don't submit
        if (Object.values(newErrors).some(error => error !== '')) {
            setValidationSummary(getValidationSummary(newErrors));
            const firstErrorField = Object.keys(newErrors).find(key => newErrors[key as keyof typeof newErrors] !== '');
            if (firstErrorField) {
                focusFieldByName(firstErrorField);
            }
            return;
        }

        setValidationSummary([]);
        const formType = FORM_TYPES.FAMILY_LAW_SETTLEMENT_SERVICE;
        const formTypeShort = FORM_TYPES_SHORT.FAMILY_LAW_SETTLEMENT_SERVICE;
        const submissionId = generateSubmissionId(formType, authenticatedLawSocietyId);
       

        // Prepare form data for submission
        const submissionData = {
            formType,
            applicantDetails: {
                surname: formData.surname,
                firstName: formData.firstName,
                referenceNumber: formData.referenceNumber,
                partyName: formData.partyName,
                legalRep: formData.legalRep
            },
            submittedAt: new Date().toISOString().replace('Z', '+00:00')
        };
        try {
            setIsSubmitting(true);

            // Use authenticated LawID from state
            const lawSocietyId = authenticatedLawSocietyId || formData.lawID || '';
            console.log('Using LawID for submission:', lawSocietyId);

            const formName = FORM_NAMES.FAMILY_LAW_SETTLEMENT_SERVICE;
            const price = simpleFee ?? 1200;            

            const fieldLabels: Record<string, string> = {
                surname: 'Surname', firstName: 'First Name', referenceNumber: 'Reference Number',
                partyName: 'Name of party payment is being made for',
                legalRep: 'Name of Legal Representation'
            };

            const sectionLabels: Record<string, string> = {
                applicantDetails: 'Applicant Details',
            };

            const lineItems = [
                {
                    name: 'The Family Law Settlement Service (FLSS)',
                    amountCents: Math.round(price * 100),
                    hasGst: true
                }
            ];

            const result = await apiService.submitForm(
                formType,
                submissionData,               
                formName,
                formTypeShort,
                price,
                submissionId,
                lawSocietyId,
                userEmail || '',
                userName || '',
                {
                    businessUnit: '1640',
                    sku: '85406',
                    receiptCategory: 'a2j'
                },
                fieldLabels,
                sectionLabels,
                undefined,
                undefined,
                lineItems
            );                            

            console.log('Form submitted successfully:', result);
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
                    {/* FLSS Info Section */}                   
                    <ProgramInfo
                        title="The Family Law Settlement Service (FLSS)"
                        description={null}
                        fees={[
                            { label: "Mediator's Fee", amount: "$1,000.00" },
                            { label: "The Law Society of New South Wales administration fee", amount: "$200.00" }
                        ]}
                        totalFee={{
                            label: "Total fee payable per party (including GST)",
                            amount: "$1,200.00"
                        }}
                    />

                    <FormErrorSummary
                        items={validationSummary}
                        onSelect={focusFieldByName}
                    />
                    
                    <ApplicantDetails
                        variant="flss"
                        formData={formData}
                        errors={errors}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        readOnlyFields={{ firstName: !!authFirstName, surname: !!authSurname, emailAddress: !!userEmail }}
                    />

                    <div className="section-divider" />
                    
                    {submitError && (
                        <div className="submit-error-banner">
                            <strong>Error:</strong> {submitError}
                        </div>
                    )}

                    <Footer 
                        variant="a2j"
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                </section>
            </main>
        </div>
    );
}

export default FlssForm;
