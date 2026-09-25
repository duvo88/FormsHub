# Forms Hub - Law Society Forms Application

A React TypeScript application for Law Society form submissions with integrated Stripe payment processing.

## Available Forms

### Registry Forms (Dynamic Fee Calculation)

1. **Practising Certificate - New Application (PC New)**
   - Route: `/practising-certificate-new`
   - SKU: 80910
   - Business Unit: 1000
   - Dynamic fee based on:
     * Practice type (Section 4: principal place of practice)
     * Other practice type (Section 6: when practicing with multiple entities)
     * Practice country
     * Date of admission
     * Effective date
     * Law Society membership
   - Implements multi-entity fee hierarchy with 3 scenarios when user practices with more than one entity

2. **Practising Certificate - Renewal (PC Renew)**
   - Route: `/practising-certificate-renew`
   - SKU: 80910
   - Business Unit: 1000
   - Dynamic fee based on practice type and renewal period

3. **Practising Certificate - Original Application (PC Original)**
   - Route: `/practising-certificate-original`
   - SKU: 80910
   - Business Unit: 1000
   - Dynamic fee for foreign lawyer applications

4. **Change in Practice/Employment Details (PC Variation)**
   - Route: `/change-in-employment-details`
   - SKU: 80910
   - Business Unit: 1000
   - Dynamic fee based on:
     * Previous practice category
     * New practice category (Part 1)
     * Additional practice category (Part 2, if practicing with multiple entities)
     * Effective date
   - Implements complex fee hierarchy with 3 scenarios based on previous employment

5. **Certificate of Fitness**
   - Route: `/certificate-of-fitness`
   - SKU: 80910
   - Business Unit: 1000
   - Dynamic fee based on membership status

### Access to Justice (A2J) Forms

6. **Family Law Settlement Service (FLSS)** - $2,750
   - Route: `/family-law-settlement-service`
   - SKU: 85408
   - Business Unit: 1640

2. **Law Society Mediation Program** - $1,200
   - Route: `/law-society-mediation-program`
   - SKU: 85407
   - Business Unit: 1640
   - For civil and commercial disputes

3. **Presidential Appointment or Nomination (Full Fee)** - $660
   - Route: `/presidential-appt-nomination`
   - SKU: 85404
   - Business Unit: 1640
   - For Expert, Valuer, Arbitrator, Independent Solicitor, or Mediator appointments

4. **Presidential Appointment or Nomination (Split Fee)** - $330 per party
   - Route: `/presidential-appt-nomination-split-fee`
   - SKU: 85404
   - Business Unit: 1640
   - Cost-sharing option for same appointment types

5. **Lawyer Mediator Accreditation Scheme** - $100
   - Route: `/lawyer-mediator-accreditation-scheme`
   - SKU: 80131
   - Business Unit: 1640
   - Expression of interest for accreditation

6. **Lawyer Mediator Accreditation Scheme (Payment)** - $100
   - Route: `/lawyer-mediator-accreditation-scheme-payment`
   - SKU: 80131
   - Business Unit: 1640
   - Payment for accreditation application

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Key Features

- **Stripe Payment Integration:** Secure payment processing for form submissions
- **Azure Blob Storage:** File upload handling for form attachments
- **Authentication:** Azure Static Web Apps authentication
- **Form Validation:** Client-side validation with date format enforcement (DD/MM/YYYY)
- **Reusable Components:** ProgramInfo, ApplicantDetails, SignatureSection
- **Responsive Design:** Mobile-friendly form layouts

## Project Structure

```
src/
├── components/
│   ├── ProgramInfo.tsx          # Reusable form header component
│   ├── ApplicantDetails.tsx     # Multi-variant applicant details
│   ├── SignatureSection.tsx     # Digital signature capture
│   ├── DeclarationSection.tsx   # Declaration and consent
│   └── AdmissionDetailsSection.tsx
├── FlssForm.tsx
├── LawSocietyMediationProgramForm.tsx
├── PresidentialApptOrNominationForm.tsx
├── PresidentialApptOrNominationSplitFeeForm.tsx
├── LawyerMediatorAccrSchemeForm.tsx
├── PractisingCertificateForm.tsx
└── CertificateOfFitnessForm.tsx
public/
└── staticwebapp.config.json     # Authentication routes
```

## Configuration

See [CONFIGURATION.md](../az-ae-fa-formshub-functionapp/CONFIGURATION.md) for:
- Azure Blob Storage setup
- Stripe configuration
- Environment variables
- Production deployment

## Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/)
