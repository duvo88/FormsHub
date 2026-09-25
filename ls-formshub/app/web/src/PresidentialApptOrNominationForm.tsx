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
import { generateSubmissionId } from './utils/validation';
import { getCheckoutUrlOrThrow } from './utils/submission';
import { getValidationSummary, focusFieldByName } from './utils/formErrorSummary';
import { FORM_TYPES, FORM_TYPES_SHORT } from './constants/formTypes';
import { FORM_NAMES } from './constants/formNames';

function PresidentialApptOrNominationForm() {
    const [formData, setFormData] = useState({
        appointmentType: '',
        partyName: '',
        referenceNumber: '',
        firstName: '',
        surname: '',
        emailAddress: '',
        legalRep: '',
        lawID: '',
    });

    const [errors, setErrors] = useState({
        appointmentType: '',
        partyName: '',
        referenceNumber: '',
        firstName: '',
        surname: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [validationSummary, setValidationSummary] = useState<FormErrorSummaryItem[]>([]);
    const [simpleFee, setSimpleFee] = useState<number | null>(null);
    const { lawSocietyId: authenticatedLawSocietyId, email: userEmail, name: userName, firstName: authFirstName, surname: authSurname } = useAuthenticatedUser();

    useEffect(() => {
        apiService.getSimpleFee('presidential-full-fee').then(amt => setSimpleFee(amt)).catch(() => {});
    }, []);

    useAuthPrefill(setFormData, {
        firstName: authFirstName,
        surname: authSurname,
        emailAddress: userEmail,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // For radio buttons, store the label text in a separate field for PDF display
            ...(type === 'radio' ? { [`${name}Text`]: value } : {})
        }));

        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
            setValidationSummary(prev => prev.filter(item => item.field !== name));
        }
    };

    const handleBlur = (fieldName: string, value: string) => {
        let errorMessage = '';

        if (fieldName === 'appointmentType' && !value.trim()) {
            errorMessage = 'Appointment type is required';
        } else if (fieldName === 'firstName' && !value.trim()) {
            errorMessage = 'First name is required';
        } else if (fieldName === 'surname' && !value.trim()) {
            errorMessage = 'Surname is required';
        } else if (fieldName === 'partyName' && !value.trim()) {
            errorMessage = 'Name of party payment is required';
        } else if (fieldName === 'referenceNumber' && !value.trim()) {
            errorMessage = 'Reference number and name is required';
        }

        setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        setSubmitError(null);
        setValidationSummary([]);
        const newErrors = {
            appointmentType: '',
            firstName: '',
            surname: '',
            partyName: '',
            referenceNumber: '',            
        };

        if (!formData.appointmentType.trim()) newErrors.appointmentType = 'Appointment type is required';
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
        if (!formData.referenceNumber.trim()) newErrors.referenceNumber = 'Reference number is required';
        if (!formData.partyName.trim()) newErrors.partyName = 'Name of party Payment is required';

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

        const formType = FORM_TYPES.PRESIDENTIAL_APPT_OR_NOMINATION_FULL_FEE;
        const formTypeShort = FORM_TYPES_SHORT.PRESIDENTIAL_APPT_OR_NOMINATION_FULL_FEE;
        const submissionId = generateSubmissionId(formType, authenticatedLawSocietyId);

        const submissionData = {
            formType,
            presidentialAppointmentOrNomination: {
                appointmentType: formData.appointmentType,
                appointmentTypeText: (formData as any).appointmentTypeText
            },
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

            const lawSocietyId = authenticatedLawSocietyId || formData.lawID || '';
            const formName = FORM_NAMES.PRESIDENTIAL_APPT_OR_NOMINATION_FULL_FEE;
            const price = simpleFee ?? 660;

            const fieldLabels: Record<string, string> = {
                appointmentType: 'Presidential Appointment or Nomination',
                surname: 'Surname', firstName: 'First Name', referenceNumber: 'Reference Number',
                partyName: 'Name of party payment is being made for',
                legalRep: 'Name of Legal Representation'
            };

            const sectionLabels: Record<string, string> = {
                presidentialAppointmentOrNomination: 'Presidential Appointment or Nomination',
                applicantDetails: 'Applicant Details',
            };

            const lineItems = [
                {
                    name: 'Presidential Appointment or Nomination',
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
                userName || undefined,
                {
                    businessUnit: '1640',
                    sku: '85404',
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
                        title="Presidential Appointment or Nomination"
                        description={(
                            <>
                                <div style={{ marginBottom: 24 }}>
                                    <h2 className="section-title">Presidential Appointment or Nomination <span style={{color:'#F26522'}}>*</span></h2>
                                    <div style={{ marginTop: 12 }}>
                                        {['Expert', 'Valuer', 'Arbitrator', 'Independent Solicitor', 'Mediator'].map((type) => (
                                            <div key={type} style={{ marginBottom: 8 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        name="appointmentType"
                                                        value={type}
                                                        checked={formData.appointmentType === type}
                                                        onChange={handleChange}
                                                        onBlur={(e) => handleBlur('appointmentType', e.target.value)}
                                                        style={{ marginRight: 8 }}
                                                    />
                                                    <span>{type}</span>
                                                </label>
                                            </div>
                                        ))}
                                        {errors.appointmentType && (
                                            <div style={{ color: '#C0392B', fontSize: 14, marginTop: 4 }}>
                                                {errors.appointmentType}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p>The Law Society of New South Wales charges a non-refundable administration fee of $660.00 (including GST).</p>
                                <p>The appointed or nominee then sets his or her own fees and invoices the parties directly.</p>
                            </>
                        )}
                        showRefundPolicy={false}
                    />

                    <FormErrorSummary
                        items={validationSummary}
                        onSelect={focusFieldByName}
                    />

                    <ApplicantDetails
                        variant="presidential-full-fee"
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

export default PresidentialApptOrNominationForm;
