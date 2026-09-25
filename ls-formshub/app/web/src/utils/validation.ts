// ── File upload validation ──────────────────────────────────────────────────

/** Accepted file extensions for all upload fields */
export const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.tif,.tiff';

/** Maximum combined file size in MB per upload field */
export const MAX_FILE_SIZE_MB = 20;

/** Helper text to display below all file upload fields */
export const FILE_UPLOAD_HELPER_TEXT = `Maximum file size: ${MAX_FILE_SIZE_MB}MB per upload field. Total attachments per submission: 22MB. Supported formats: PDF, Word, Excel, CSV, TXT, JPG, JPEG, TIFF.`;

const ALLOWED_EXTENSIONS = ACCEPTED_FILE_TYPES.split(',');

export interface FileValidationResult {
  valid: boolean;
  files: File[];
  error: string;
}

/**
 * Validates a list of selected files for type and combined size.
 * Returns specific error messages:
 *  - "File type not allowed …" when an invalid extension is found
 *  - "Combined file size exceeds 20 MB …" when total size is too large
 *
 * @param files  The FileList (from input element) or File[]
 * @returns      { valid, files, error }
 */
export const validateFiles = (files: FileList | File[]): FileValidationResult => {
  const selected = Array.from(files);

  // 1. File-type check
  for (const file of selected) {
    const dotIndex = file.name.lastIndexOf('.');
    const ext = dotIndex >= 0 ? file.name.substring(dotIndex).toLowerCase() : '';
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        files: [],
        error: 'File type not allowed. Accepted types: PDF, Word, Excel, CSV, TXT, JPG, JPEG, TIFF.',
      };
    }
  }

  // 2. Combined size check
  const totalSize = selected.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      files: [],
      error: `Combined file size exceeds ${MAX_FILE_SIZE_MB} MB. Please select smaller files.`,
    };
  }

  return { valid: true, files: selected, error: '' };
};

/**
 * Returns a display string for selected files:
 *  - single file  → file name
 *  - multiple     → comma-separated file names
 *  - none/null    → ''
 */
export const fileDisplayName = (files: File[] | null): string => {
  if (!files || files.length === 0) return '';
  return files.map(f => f.name).join(', ');
};

export const TOTAL_ATTACHMENT_LIMIT_MB = 22;

export const getTotalAttachmentLimitError = (
  attachments: Record<string, File | File[] | null | undefined>,
  limitMb: number = TOTAL_ATTACHMENT_LIMIT_MB
): string | null => {
  const allFiles = Object.values(attachments).flatMap(value => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((item): item is File => item instanceof File);
    return value instanceof File ? [value] : [];
  });

  const totalBytes = allFiles.reduce((sum, file) => sum + file.size, 0);
  const limitBytes = limitMb * 1024 * 1024;

  if (totalBytes > limitBytes) {
    return 'Maximum attachment size exceeded. Please include only the mandatory attachments and remove others to submit the form. Any additional supporting documents should be emailed to registry@lawsociety.com.au.';
  }

  return null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailValidationOptions = {
  required?: boolean;
  requiredMessage?: string;
  invalidMessage?: string;
};

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test(value.trim());

export const getEmailValidationError = (
  value: string,
  options: EmailValidationOptions = {}
): string => {
  const trimmed = value.trim();
  const {
    required = false,
    requiredMessage = 'Email address is required',
    invalidMessage = 'Please enter a valid email address',
  } = options;

  if (!trimmed) {
    return required ? requiredMessage : '';
  }

  return isValidEmail(trimmed) ? '' : invalidMessage;
};

export const getEmailListValidationError = (
  values: string[],
  options: EmailValidationOptions = {}
): string => {
  const {
    required = false,
    requiredMessage = 'At least one email address is required',
    invalidMessage = 'Please enter a valid email address',
  } = options;
  const normalized = values.map(value => value.trim());
  const populated = normalized.filter(value => value !== '');

  if (required && populated.length === 0) {
    return requiredMessage;
  }

  return populated.every(isValidEmail) ? '' : invalidMessage;
};

export const getFirstInvalidEmailIndex = (values: string[]): number => {
  return values.findIndex(value => {
    const trimmed = value.trim();
    return trimmed !== '' && !isValidEmail(trimmed);
  });
};

// ── Date validation ─────────────────────────────────────────────────────────

// ── Submission ID generation ────────────────────────────────────────────────

/**
 * Generates a unique submission ID in the format: {formType}_{LawID}_{timestamp}
 * Used by ADR forms that don't get a submission ID from the backend.
 *
 * @param formType       Full form route identifier, e.g. 'family-law-settlement-service'
 * @param lawSocietyId   Authenticated user's LawID (full value used)
 */
export const generateSubmissionId = (formType: string, lawSocietyId: string | null): string => {
  // 1. Clean up fallbacks using optional chaining
  const normalizedFormType = formType?.trim() || 'form';
  const lawId = lawSocietyId?.trim() || '0000000';

  // 2. Leverage toISOString() for a much cleaner timestamp
  // toISOString() outputs "YYYY-MM-DDTHH:mm:ss.sssZ"
  const nowIso = new Date().toISOString();
  
  const formattedDate = nowIso.slice(0, 10).replace(/-/g, ''); // "YYYYMMDD"
  const formattedTime = nowIso.slice(11, 19).replace(/:/g, ''); // "HHmmss"
  
  return `${normalizedFormType}_${lawId}_${formattedDate}-${formattedTime}`;
};
