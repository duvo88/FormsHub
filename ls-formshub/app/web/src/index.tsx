import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import CertificateOfFitnessForm from './CertificateOfFitnessForm';
import PCNewForm from './PCNewForm';
import SubmissionSuccess from './components/SubmissionSuccess';
import FlssForm from './FlssForm';
import PresidentialApptOrNominationForm from './PresidentialApptOrNominationForm';
import PresidentialApptOrNominationSplitFeeForm from './PresidentialApptOrNominationSplitFeeForm';
import LawSocietyMediationProgramForm from './LawSocietyMediationProgramForm';
import LawyerMediatorAccrSchemePaymentForm from './LawyerMediatorAccrSchemePaymentForm';
import ARCRenewForm from './ARCRenewForm';
import ARCNewForm from './ARCNewForm';
import ChangeEmploymentDetailsForm from './ChangeEmploymentDetailsForm';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FORM_TYPES } from './constants/formTypes';

const pageTitles: Record<string, string> = {
  [`/${FORM_TYPES.CERTIFICATE_OF_FITNESS}`]: 'Certificate of Fitness',
  [`/${FORM_TYPES.PRACTISING_CERTIFICATE_NEW}`]: 'PC New Application',
  [`/${FORM_TYPES.AUSTRALIAN_REGISTRATION_CERTIFICATE_RENEW}`]: 'ARC Renewal',
  [`/${FORM_TYPES.AUSTRALIAN_REGISTRATION_CERTIFICATE_NEW}`]: 'ARC New',
  [`/${FORM_TYPES.CHANGE_IN_EMPLOYMENT_DETAILS}`]: 'Change in Employment Details',
  [`/${FORM_TYPES.FAMILY_LAW_SETTLEMENT_SERVICE}`]: 'Family Law Settlement Service',
  [`/${FORM_TYPES.PRESIDENTIAL_APPT_OR_NOMINATION_FULL_FEE}`]: 'Presidential Appointment or Nomination',
  [`/${FORM_TYPES.PRESIDENTIAL_APPT_OR_NOMINATION_SPLIT_FEE}`]: 'Presidential Appointment or Nomination (Split Fee)',
  [`/${FORM_TYPES.LAW_SOCIETY_MEDIATION_PROGRAM}`]: 'Law Society Mediation Program',
  [`/${FORM_TYPES.LAWYER_MEDIATOR_ACCREDITATION_SCHEME_PAYMENT}`]: 'LMA Payment',
  '/submission-success': 'Submission Successful',
};

function TitleManager() {
  const location = useLocation();
  useEffect(() => {
    document.title = pageTitles[location.pathname] ?? 'Law Society Forms';
  }, [location.pathname]);
  return null;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <TitleManager />
      <Routes>
        <Route path={`/${FORM_TYPES.PRACTISING_CERTIFICATE_NEW}`} element={<PCNewForm />} />
        <Route path={`/${FORM_TYPES.AUSTRALIAN_REGISTRATION_CERTIFICATE_NEW}`} element={<ARCNewForm />} />
        <Route path={`/${FORM_TYPES.AUSTRALIAN_REGISTRATION_CERTIFICATE_RENEW}`} element={<ARCRenewForm />} />
        <Route path={`/${FORM_TYPES.CERTIFICATE_OF_FITNESS}`} element={<CertificateOfFitnessForm />} />
        <Route path={`/${FORM_TYPES.FAMILY_LAW_SETTLEMENT_SERVICE}`} element={<FlssForm />} />
        <Route path={`/${FORM_TYPES.PRESIDENTIAL_APPT_OR_NOMINATION_FULL_FEE}`} element={<PresidentialApptOrNominationForm />} />
        <Route path={`/${FORM_TYPES.PRESIDENTIAL_APPT_OR_NOMINATION_SPLIT_FEE}`} element={<PresidentialApptOrNominationSplitFeeForm />} />
        <Route path={`/${FORM_TYPES.LAW_SOCIETY_MEDIATION_PROGRAM}`} element={<LawSocietyMediationProgramForm />} />
        <Route path={`/${FORM_TYPES.LAWYER_MEDIATOR_ACCREDITATION_SCHEME_PAYMENT}`} element={<LawyerMediatorAccrSchemePaymentForm />} />
        <Route path={`/${FORM_TYPES.CHANGE_IN_EMPLOYMENT_DETAILS}`} element={<ChangeEmploymentDetailsForm />} />

        <Route path="/submission-success" element={<SubmissionSuccess />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
