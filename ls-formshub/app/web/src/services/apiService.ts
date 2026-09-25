// defines what wer expect back from the azure function after submitting the form
export interface FormSubmissionResponse {
  success: boolean;
  stripeUrl: string;
  sessionId: string;
  message?: string;
  checkoutUrl: string;
}

// Response from payment verification
export interface PaymentVerificationResponse {
  success: boolean;
  paymentStatus: string;
  webhookProcessed?: boolean;
  submissionId?: string;
  formType?: string;
  amountTotal?: number;
  currency?: string;
  customerEmail?: string;
  message?: string;
}

// Unified fee request — superset of all form types. Pass only the fields needed for your formType.
export interface GetFeeRequest {
  formType: string;           // 'practising-certificate-new' | 'australian-registration-certificate-new' | 'australian-registration-certificate-renew' | 'change-in-employment-details'
  effectiveDate: string;      // ISO 8601
  practiceCountry: string;    // 'Australia' | 'Outside Australia'
  // PC New
  dateOfAdmission?: string;   // ISO 8601
  registryType?: string;      // 'Principal/Employee' | 'Gov/Corporate' | ...
  SM?: string;                // 'yes' | 'No'
  // ARC New / ARC Renew
  formOfPractice?: string;    // 'partnership' | 'sole' | 'volunteer_probono' | ...
  AM?: string;                // 'yes' | 'No'
  // PC Variation
  prevCategory?: string;      // 'volunteer' | 'principal' | 'employee' | 'government' | 'corporate'
  newCategory?: string;       // 'volunteer' | 'principal' | 'employee' | 'government' | 'corporate'
}

export interface GetFeeResponse {
  feeAmount: number;
  feePc: number;
  feeFidelity: number;
  feeSm: number;
  logic: string;
}

export interface StripeLineItem {
  name: string;
  amountCents: number;
  hasGst: boolean;
}

// Response from InitiateFormAttachmentsUpload
export interface FileUploadResponse {
  success: boolean;
  submissionId: string;
  uploadUrls: FileUploadInfo[];
  expiresAt: string;
  message?: string;
}

export interface FileUploadInfo {
  fieldName: string;
  uploadUrl: string;      // SAS URL for uploading
  blobUrl: string;        // Permanent URL
  blobName: string;
  expiresAt: string;
}

// File info to send for upload initiation
export interface FileMetadata {
  fieldName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

// defines the structure of an error response from the API
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
// class to handle all the API communications
class ApiService {
  private baseUrl: string;

  constructor() {
      // Use same-origin API paths so SWA CLI can inject auth headers before proxying to Functions.
      this.baseUrl = '';
  }

  private validateSubmissionIdentity(lawSocietyId: string, userEmail: string): { lawSocietyId: string; userEmail: string } {
    const cleanLawSocietyId = lawSocietyId?.trim();
    const cleanUserEmail = userEmail?.trim();

    if (!cleanLawSocietyId) {
      throw new Error('LawID is required before submitting the form');
    }

    if (!cleanUserEmail) {
      throw new Error('Email is required before submitting the form');
    }

    return {
      lawSocietyId: cleanLawSocietyId,
      userEmail: cleanUserEmail,
    };
  }

  private isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private ensureIdentityInPrimarySection(
    formData: any,
    lawSocietyId: string,
    userEmail: string
  ): any {
    if (!this.isPlainObject(formData)) {
      return formData;
    }

    const targetSection = formData.applicantDetails;

    if (!this.isPlainObject(targetSection)) {
      return {
        ...formData,
        applicantDetails: {
          lawID: lawSocietyId,
          emailAddress: userEmail
        }
      };
    }

    return {
      ...formData,
      applicantDetails: {
        lawID: lawSocietyId,
        emailAddress: userEmail,
        ...targetSection
      }
    };
  }

  private ensureIdentityFieldLabels(fieldLabels?: Record<string, string>): Record<string, string> {
    return {
      lawID: 'LawID',
      emailAddress: 'Email',
      ...(fieldLabels || {})
    };
  }

  // Accept only same-origin, local development, or Stripe-hosted checkout URLs.
  getSafeCheckoutUrl(checkoutUrl: string): string {
    if (!checkoutUrl || typeof checkoutUrl !== 'string') {
      throw new Error('Invalid checkout URL received from server');
    }

    let parsed: URL;
    try {
      parsed = new URL(checkoutUrl, window.location.origin);
    } catch {
      throw new Error('Malformed checkout URL received from server');
    }

    const isSameOrigin = parsed.origin === window.location.origin;
    const isLocalDev =
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
    const isStripeCheckout = parsed.protocol === 'https:' && (parsed.hostname.endsWith('.stripe.com') || parsed.hostname.endsWith('.lawsociety.com.au'));

    if (!isSameOrigin && !isLocalDev && !isStripeCheckout) {
      throw new Error('Untrusted checkout URL blocked');
    }

    return parsed.toString();
  }

  // Get authenticated user's LawID from AAD B2C claims
  async getAuthenticatedUserInfo(): Promise<{ lawSocietyId: string | null }> {
    try {
      const response = await fetch('/.auth/me');
      if (!response.ok) {
        console.warn('Failed to get user info from /.auth/me');
        return { lawSocietyId: null };
      }
      
      const data = await response.json();
      const clientPrincipal = data.clientPrincipal;
      
      if (!clientPrincipal || !clientPrincipal.claims) {
        console.warn('No user claims found');
        return { lawSocietyId: null };
      }

      // Look for LawID in claims
      // Common claim names: 'extension_LawSocietyId', 'lawSocietyId', 'memberNumber', etc.
      const lawSocietyClaim = clientPrincipal.claims.find((claim: any) => 
        claim.typ?.toLowerCase().includes('lawsociety') || 
        claim.typ?.toLowerCase().includes('memberid') ||
        claim.typ?.toLowerCase().includes('membernumber')
      );

      const lawSocietyId = lawSocietyClaim?.val || '';
      console.log('Authenticated LawID:', lawSocietyId);
      
      return { lawSocietyId };
    } catch (error) {
      console.error('Error fetching user info');
      return { lawSocietyId: null };
    }
  }
//   this is the main function that sends form data to Azure Function 
    async submitForm(formType: string,
        formData: any,
        formName: string,
        formTypeShort: string,
        price: number,
      submissionId: string | undefined,
        lawSocietyId: string,
        userEmail: string,
        userName?: string,
        metadata?: { businessUnit?: string; sku?: string; receiptCategory?: string },
        fieldLabels?: Record<string, string>,
        sectionLabels?: Record<string, string>,
        feeSm?: number,
        smLogic?: string,
        lineItems?: StripeLineItem[]): Promise<FormSubmissionResponse> {
        try {
            console.log('Submitting form data to create Stripe checkout session');
          const identity = this.validateSubmissionIdentity(lawSocietyId, userEmail);
          const normalizedFormData = this.ensureIdentityInPrimarySection(
            formData,
            identity.lawSocietyId,
            identity.userEmail
          );
          const normalizedFieldLabels = this.ensureIdentityFieldLabels(fieldLabels);
            const response = await fetch(`${this.baseUrl}/api/CreateStripeCheckoutSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
              formType, 
              formData: normalizedFormData,
              formName,
              formTypeShort,
              price,
              submissionId,
              lawSocietyId: identity.lawSocietyId,
              userEmail: identity.userEmail,
              userName,
              metadata,
              fieldLabels: normalizedFieldLabels,
              sectionLabels,
              feeSm: feeSm ?? 0,
              smLogic: smLogic ?? '',
              lineItems: lineItems ?? []
          }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Request failed with status ${response.status}`
        }));
          throw new Error(errorData.message || 'Failed to submit form');
      }

            const result = await response.json();
            console.log('Form submitted successfully:', result);
      return result;
    } catch (error) {
            console.error('Form submission error');
      throw error;
    }
  }

  // New method: Initiate file upload and get SAS URLs
  async initiateFileUpload(formType: string, referenceNumber: string, files: FileMetadata[]): Promise<FileUploadResponse> {
    try {
      console.log(`Initiating upload for ${files.length} file(s)`);
      
      const response = await fetch(`${this.baseUrl}/api/InitiateFormAttachmentsUpload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType,
          referenceNumber,
          files
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Failed to initiate upload: ${response.status}`
        }));
        throw new Error(errorData.message || 'Failed to get upload URLs');
      }

      const result = await response.json();
      console.log(`Received ${result.uploadUrls.length} upload URL(s)`);
      return result;
    } catch (error) {
      console.error('File upload initiation error');
      throw error;
    }
  }

  // New method: Upload file to blob storage using SAS URL
  async uploadFileToBlob(uploadUrl: string, file: File): Promise<void> {
    try {
      console.log(`Uploading ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      console.log(`✓ ${file.name} uploaded successfully`);
    } catch (error) {
      console.error(`Upload error for ${file.name}`);
      throw error;
    }
  }

  // Unified fee endpoint — dispatches server-side by formType
  async getFee(request: GetFeeRequest): Promise<GetFeeResponse> {
    const response = await fetch(`${this.baseUrl}/api/GetFee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Failed to get fee: ${response.status}` }));
      throw new Error(errorData.error || 'Failed to retrieve fee information');
    }

    return response.json();
  }

  /**
   * Fetches a flat fee amount for simple forms from FeeRuleSimpleForms table.
   * GET /api/GetSimpleFee?formKey=<key>
   * Returns the amount in AUD, or throws if the key is not found.
   */
  async getSimpleFee(formKey: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/GetSimpleFee?formKey=${encodeURIComponent(formKey)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Failed to get fee: ${response.status}` }));
      throw new Error(errorData.error || `Failed to retrieve fee for ${formKey}`);
    }
    const data = await response.json();
    return data.amount as number;
  }

  /**
   * Fetches a Certificate of Fitness fee from the FeeRuleCof table.
   * GET /api/GetCofFee?formKey=cof-member|cof-au-non-member|cof-overseas-non-member
   * Returns the amount in AUD, or throws if the key is not found.
   */
  async getCofFee(formKey: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/GetCofFee?formKey=${encodeURIComponent(formKey)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Failed to get CoF fee: ${response.status}` }));
      throw new Error(errorData.error || `Failed to retrieve CoF fee for ${formKey}`);
    }
    const data = await response.json();
    return data.amount as number;
  }

  // New method: Submit complete form with data and attachments to create Stripe session
  async submitFormWithAttachments(
    formType: string,
      submissionId: string,      
      formData: any,
      formName: string,
      formTypeShort: string,
      price: number,
    attachmentUrls: Record<string, string>,
    lawSocietyId: string,
    userEmail: string,
    userName?: string,
    metadata?: { businessUnit?: string; sku?: string; receiptCategory?: string },
    fieldLabels?: Record<string, string>,
    sectionLabels?: Record<string, string>,
    feeSm?: number,
    smLogic?: string,
    lineItems?: StripeLineItem[]
  ): Promise<any> {
    try {
        console.log('Submitting form data to create Stripe checkout session');
        console.log(`price is ${price}`);
      const identity = this.validateSubmissionIdentity(lawSocietyId, userEmail);
      const normalizedFormData = this.ensureIdentityInPrimarySection(
        formData,
        identity.lawSocietyId,
        identity.userEmail
      );
      const normalizedFieldLabels = this.ensureIdentityFieldLabels(fieldLabels);
      
      const response = await fetch(`${this.baseUrl}/api/CreateStripeCheckoutSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType,
          submissionId,
            formData: normalizedFormData,
            formName,
            formTypeShort,
            price,
          attachmentUrls,
          lawSocietyId: identity.lawSocietyId,
          userEmail: identity.userEmail,
          userName,
          metadata,
          fieldLabels: normalizedFieldLabels,
          sectionLabels,
          feeSm: feeSm ?? 0,
          smLogic: smLogic ?? '',
          lineItems: lineItems ?? []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Failed to create checkout session: ${response.status}`
        }));
        throw new Error(errorData.message || 'Failed to submit form');
      }

      const result = await response.json();
      console.log('Form submitted successfully:', result);
      return result;
    } catch (error) {
      console.error('Form submission error');
      throw error;
    }
  }

  // Helper method: Upload all attachments at once
  async uploadAllAttachments(
    formType: string,
    referenceNumber: string,
    formTypeShort: string,
    attachments: Record<string, File | File[] | null>
  ): Promise<{ submissionId: string; blobUrls: Record<string, string> }> {
    const toFilesArray = (value: File | File[] | null | unknown): File[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value.filter((item): item is File => item instanceof File);
      if (value instanceof File) return [value];
      return [];
    };

    // Flatten attachments: expand File[] entries into individual files
    const filesToUpload: { fieldName: string; file: File; metadata: { fieldName: string; fileName: string; fileType: string; fileSize: number } }[] = [];
    for (const [fieldName, value] of Object.entries(attachments)) {
      const files = toFilesArray(value);
      if (files.length === 0) continue;

      files.forEach((file, i) => {
        const name = files.length > 1 ? `${fieldName}_${i + 1}` : fieldName;
        filesToUpload.push({
          fieldName: name,
          file,
          metadata: { fieldName: name, fileName: file.name, fileType: file.type, fileSize: file.size }
        });
      });
    }

    // If no files to upload, generate submission ID and return empty object
    if (filesToUpload.length === 0) {
      console.log('No files to upload');
      // Generate a submission ID even when no files (backend would do this)
      const normalizedFormType = (formType || 'form').trim() || 'form';
      const lawId = referenceNumber && referenceNumber.trim().length > 0
        ? referenceNumber.trim()
        : '0000000';
      const now = new Date();
      const timestamp = `${now.getUTCFullYear()}${String(now.getUTCMonth()+1).padStart(2,'0')}${String(now.getUTCDate()).padStart(2,'0')}-${String(now.getUTCHours()).padStart(2,'0')}${String(now.getUTCMinutes()).padStart(2,'0')}${String(now.getUTCSeconds()).padStart(2,'0')}`;
      const submissionId = `${normalizedFormType}_${lawId}_${timestamp}`;
      return { submissionId, blobUrls: {} };
    }

    console.log(`Starting batch upload of ${filesToUpload.length} file(s)`);

    // Step 1: Get upload URLs from Azure Function (this returns submissionId!)
    const uploadResponse = await this.initiateFileUpload(
      formType,
      referenceNumber,
      filesToUpload.map(f => f.metadata)
    );

    // Step 2: Upload all files in parallel
    const uploadPromises = uploadResponse.uploadUrls.map(async (urlInfo, index) => {
      const fileInfo = filesToUpload[index];
      await this.uploadFileToBlob(urlInfo.uploadUrl, fileInfo.file);
      return {
        fieldName: urlInfo.fieldName,
        blobUrl: urlInfo.blobUrl
      };
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Step 3: Convert array to object: { fieldName: blobUrl }
    const blobUrls = uploadResults.reduce((acc, result) => {
      acc[result.fieldName] = result.blobUrl;
      return acc;
    }, {} as Record<string, string>);

    console.log('All files uploaded successfully');
    // Return both submissionId from backend AND the blob URLs
    return { 
      submissionId: uploadResponse.submissionId,
      blobUrls 
    };
  }

  // New method: Verify payment session
  async verifyPaymentSession(sessionId: string): Promise<PaymentVerificationResponse> {
    try {
      console.log('Verifying payment session:', sessionId);
      
      const response = await fetch(`${this.baseUrl}/api/ProcessStripePaymentWebhook?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Verification failed with status ${response.status}`
        }));
        throw new Error(errorData.message || 'Failed to verify payment');
      }

      const result = await response.json();
      console.log('Payment verification result:', result);
      return result;
    } catch (error) {
      console.error('Payment verification error');
      throw error;
    }
  }
}
// Create one instance of ApiService and export it. This is called "Singleton pattern" - only one instance exists. When you import this file, you get the same instance everywhere.
export default new ApiService();
