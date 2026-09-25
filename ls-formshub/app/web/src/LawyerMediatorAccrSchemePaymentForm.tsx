import React, { useState, useEffect } from 'react';
import './App.css';
import './components/components.css';
import Footer from './components/Footer';
import FormErrorSummary, { FormErrorSummaryItem } from './components/FormErrorSummary';
import ProgramInfo from './components/ProgramInfo';
import apiService from './services/apiService';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useAuthPrefill } from './hooks/useAuthPrefill';
import { getCheckoutUrlOrThrow } from './utils/submission';
import { getValidationSummary, focusFieldByName } from './utils/formErrorSummary';
import { FORM_TYPES, FORM_TYPES_SHORT } from './constants/formTypes';
import { FORM_NAMES } from './constants/formNames';

function LawyerMediatorAccrSchemePaymentForm() {
  const { lawSocietyId: authenticatedLawSocietyId, email: userEmail, name: userName, firstName: authFirstName, surname: authSurname, title: authTitle } = useAuthenticatedUser();

  const [formData, setFormData] = useState({
    lawID: '',
    title: '',
    firstName: '',
    surname: '',
    referenceNumber: '',
    firmName: '',
    contactNumber: '',
  });

  const [errors, setErrors] = useState({
    contactNumber: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<FormErrorSummaryItem[]>([]);
  const [simpleFee, setSimpleFee] = useState<number | null>(null);

  useEffect(() => {
    apiService.getSimpleFee('lawyer-mediator').then(amt => setSimpleFee(amt)).catch(() => {});
  }, []);

  useAuthPrefill(setFormData, {
    lawID: userEmail,
    title: authTitle,
    firstName: authFirstName,
    surname: authSurname,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'contactNumber' && errors.contactNumber) {
      setErrors(prev => ({ ...prev, contactNumber: '' }));
      setValidationSummary(prev => prev.filter(item => item.field !== 'contactNumber'));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitError(null);
    setValidationSummary([]);

    const newErrors = { contactNumber: '' };
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';

    setErrors(newErrors);

    if (Object.values(newErrors).some(err => err !== '')) {
      setValidationSummary(getValidationSummary(newErrors));
      focusFieldByName('contactNumber');
      return;
    }

    setValidationSummary([]);

    const formType = FORM_TYPES.LAWYER_MEDIATOR_ACCREDITATION_SCHEME_PAYMENT;
    const formTypeShort = FORM_TYPES_SHORT.LAWYER_MEDIATOR_ACCREDITATION_SCHEME_PAYMENT;
    const lawSocietyId = authenticatedLawSocietyId || formData.lawID || '';

    try {
      setIsSubmitting(true);

      const { submissionId, blobUrls } = await apiService.uploadAllAttachments(
        formType,
        lawSocietyId,
        formTypeShort,
        {}
      );

      const submissionData = {
        formType,
        applicantDetails: {
          title: formData.title,
          firstName: formData.firstName,
          surname: formData.surname,
          referenceNumber: formData.referenceNumber,
          firmName: formData.firmName,
          contactNumber: formData.contactNumber,
        },
        submittedAt: new Date().toISOString().replace('Z', '+00:00'),
      };

      const formName = FORM_NAMES.LAWYER_MEDIATOR_ACCREDITATION_SCHEME_PAYMENT;
      const price = simpleFee ?? 100;

      const fieldLabels: Record<string, string> = {
        title: 'Title',
        firstName: 'First Name',
        surname: 'Surname',
        referenceNumber: 'Reference Number',
        firmName: 'Firm/Practice Name',
        contactNumber: 'Contact Number',
      };

      const sectionLabels: Record<string, string> = {
        applicantDetails: 'Personal Details',
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const readOnlyStyle: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    cursor: 'default',
  };

  return (
    <div className="App page-root">
      <main className="form-container">
        <section className="form-card" style={{ margin: 62, padding: '22px 32px 80px 32px' }}>
          <ProgramInfo
            dividerColor="#F26522"
            dividerWidth="3px"
            dividerMarginTop={10}
            title="The Lawyer Mediator Accreditation Scheme (LMA Scheme)"
            description={
              <div style={{ marginTop: 10 }}>            

                <h4 style={{ marginTop: 10, marginBottom: 10 }}>Accreditation Fee</h4>
                <p>The accreditation fee for the LMA Scheme is $100.00.</p>
              </div>
            }
            showRefundPolicy={false}
          />

          <style>{`
            .lma-payment-form .required { color: #C0392B; }
            .lma-payment-form .error-message { color: #C0392B; font-size: 14px; margin-top: 4px; display: block; }
          `}</style>

          <div className="lma-payment-form">
            <section className="section-container">
              <h2 className="section-heading" style={{ borderBottom: 'none', marginTop: 10, marginBottom: 16 }}>PERSONAL DETAILS</h2>

              <FormErrorSummary
                items={validationSummary}
                onSelect={focusFieldByName}
              />

              {/* LawID hidden - prepopulated with email, still in eForm data */}
              <div style={{ display: 'none' }}>
                <input type="text" id="lawID" name="lawID" value={formData.lawID} readOnly />
              </div>

              {/* Title hidden - prepopulated for eForm data */}
              <div style={{ display: 'none' }}>
                <input type="text" id="title" name="title" value={formData.title} readOnly />
              </div>

              {/* Row 1: First Name | Surname */}
              <div className="grid" style={{ marginTop: 12 }}>
                <div className="form-field">
                  <span className="form-label">First Name</span>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    readOnly
                    className="form-input"
                    style={readOnlyStyle}
                  />
                </div>
                <div className="form-field">
                  <span className="form-label">Surname</span>
                  <input
                    type="text"
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    readOnly
                    className="form-input"
                    style={readOnlyStyle}
                  />
                </div>
              </div>

              {/* Row 2: Reference Number | Contact Number */}
              <div className="grid" style={{ marginTop: 12 }}>
                <div className="form-field">
                  <span className="form-label">Reference Number</span>
                  <input
                    type="text"
                    id="referenceNumber"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    className="form-input"
                    placeholder=""
                  />
                </div>
                <div className="form-field">
                  <span className="form-label">Contact Number <span className="required">*</span></span>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="form-input"
                    placeholder=""
                  />
                  {errors.contactNumber && <span className="error-message">{errors.contactNumber}</span>}
                </div>
              </div>

              {/* Row 3: Firm/Practice Name (full width) */}
              <div className="form-field" style={{ marginTop: 12 }}>
                <span className="form-label">Firm/Practice Name</span>
                <input
                  type="text"
                  id="firmName"
                  name="firmName"
                  value={formData.firmName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder=""
                />
              </div>
            </section>
          </div>

          <div className="section-divider" />

          {submitError && (            <div className="submit-error-banner">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          {isSubmitting && (
            <div className="submit-processing-banner">
              <strong>Processing:</strong> Submitting your form...
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

export default LawyerMediatorAccrSchemePaymentForm;
