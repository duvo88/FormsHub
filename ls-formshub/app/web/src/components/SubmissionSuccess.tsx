import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiService, { PaymentVerificationResponse } from '../services/apiService';
import { FORM_TYPES } from '../constants/formTypes';
import './components.css';

const SubmissionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<PaymentVerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const formType = searchParams.get('formType') || paymentDetails?.formType;
  const a2jFormTypes = [
    FORM_TYPES.FAMILY_LAW_SETTLEMENT_SERVICE,
    FORM_TYPES.PRESIDENTIAL_APPT_OR_NOMINATION_SPLIT_FEE,
    FORM_TYPES.PRESIDENTIAL_APPT_OR_NOMINATION_FULL_FEE,
    FORM_TYPES.LAW_SOCIETY_MEDIATION_PROGRAM,
    FORM_TYPES.LAWYER_MEDIATOR_ACCREDITATION_SCHEME_PAYMENT,
  ];

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const isFree = searchParams.get('free') === 'true';
    
    if (!sessionId) {
      if (isFree) {
        // Free submission (price = 0) - go straight to success
        setVerificationState('success');
      } else {
        setErrorMessage('No payment session found. Please contact support if you completed a payment.');
        setVerificationState('error');
      }
      return;
    }

    let pollCount = 0;
    const maxPolls = 30; // Poll for up to 60 seconds (30 * 2 seconds)
    let webhookTriggered = false;
    
    const pollPaymentVerification = async () => {
      try {
        pollCount++;
        console.log(`Polling payment verification (attempt ${pollCount}/${maxPolls})...`);
        
        const result = await apiService.verifyPaymentSession(sessionId);
        
        if (result.success && result.webhookProcessed) {
          // Webhook has processed the payment successfully
          console.log('Payment verified and webhook processed!');
          setPaymentDetails(result);
          setVerificationState('success');
          return true; // Stop polling
        } else if (result.success && !result.webhookProcessed) {
          // Payment is paid but webhook hasn't processed yet
          console.log('Payment confirmed, waiting for webhook processing...');
          return false; // Continue polling
        } else {
          // Payment failed or incomplete
          setErrorMessage('Payment was not completed successfully. Please try again or contact support.');
          setVerificationState('error');
          return true; // Stop polling
        }
      } catch (error) {
        console.error('Payment verification failed');
        
        if (pollCount >= maxPolls) {
          // Max retries reached
          setErrorMessage('Payment verification is taking longer than expected. Please contact support with your payment confirmation.');
          setVerificationState('error');
          return true; // Stop polling
        }
        
        return false; // Continue polling on error
      }
    };

    // Start polling immediately, then every 2 seconds
    const startPolling = async () => {
      const shouldStop = await pollPaymentVerification();
      
      if (!shouldStop && pollCount < maxPolls) {
        const intervalId = setInterval(async () => {
          const stop = await pollPaymentVerification();
          if (stop || pollCount >= maxPolls) {
            clearInterval(intervalId);
          }
        }, 2000); // Poll every 2 seconds
        
        return () => clearInterval(intervalId);
      }
    };

    startPolling();
  }, [searchParams]);

  // Loading state
  if (verificationState === 'loading') {
    return (
      <div className="App">
        <div className="form-container">
          <div style={{
            maxWidth: '600px',
            margin: '40px auto',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Verifying Payment...
            </h2>
            <p style={{ color: '#6b7280' }}>
              Please wait while we confirm your payment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (verificationState === 'error') {
    return (
      <div className="App">
        <div className="form-container">
          <div style={{
            maxWidth: '600px',
            margin: '40px auto',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            {/* Error Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg
                style={{ width: '48px', height: '48px', color: 'white' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#991b1b',
              marginBottom: '16px'
            }}>
              Payment Verification Failed
            </h1>
            <p style={{
              color: '#991b1b',
              marginBottom: '24px',
              fontSize: '16px'
            }}>
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="App">
      <div className="form-container">
        <div style={{
          maxWidth: '600px',
          margin: '40px auto',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          {/* Success Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg
              style={{ width: '48px', height: '48px', color: 'white' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Form Submission Successful!
          </h1>
          
            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '6px',
              textAlign: 'left'
            }}>
              
              <p style={{ marginBottom: '8px', color: '#374151' }}>
                  <strong>Thank you, we have received your payment. A tax invoice/receipt will be sent to your email shortly.</strong>
              </p> <br />
              <p style={{ marginBottom: '16px', color: '#374151' }}>
                  <strong>Date: </strong> {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </p> 
              {formType && !a2jFormTypes.includes(formType as typeof a2jFormTypes[number]) && (
                <>
                  <br />
                  <p style={{ marginBottom: '16px', color: '#374151' }}>
                    <strong>What's Next?</strong> <br />
                    {formType === FORM_TYPES.CERTIFICATE_OF_FITNESS ? (
                      <>
                        Thank you for your application. Your application is now being processed and will be sent to your nominated addressee details. Please contact our Customer Service team by phone on 02 9926 0333 or by email at{' '}
                        <a href="mailto:customerservice@lawsociety.com.au" style={{ color: '#F26522' }}>
                          customerservice@lawsociety.com.au
                        </a>{' '}
                        should you require any further assistance.
                      </>
                    ) : (
                      <>
                        Thank you for your application, we confirm receipt. Your application will now be assessed. Should we require any further information for this assessment, we will reach out to you directly. Please contact the Law Society’s customer service team by email at {' '}
                        <a href="mailto:customerservice@lawsociety.com.au" style={{ color: '#F26522' }}>
                          customerservice@lawsociety.com.au
                        </a>{' '} or by phone (02) 9926 0333, 9 am – 5 pm AEST, should you wish to discuss your application.'
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
          
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SubmissionSuccess;
