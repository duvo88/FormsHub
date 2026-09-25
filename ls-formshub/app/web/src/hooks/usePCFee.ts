import { useState, useEffect } from 'react';
import apiService, { GetFeeResponse } from '../services/apiService';
import { FORM_TYPES } from '../constants/formTypes';

export type PCFeeParams = {
  /** DD/MM/YYYY */
  dateOfAdmission: string;
  /** DD/MM/YYYY — ignored when notCurrentlyPractising is true (auto-computed) */
  pcEffectiveDate: string;
  /** Residential country from the form */
  residentialCountry: string;
  /** practiceType value from the form: 'principal' | 'employee' | 'corporate' | 'government' | 'volunteer' | '' */
  practiceType: string;
  /** principal subtype value from the form: 'sole' | 'incorporated' | 'partner' | 'supervising' | '' */
  practiceSpecify?: string;
  /** true when "Do you intend to engage in legal practice?" = No (effective date is current date) */
  notCurrentlyPractising: boolean;
  /** Law Society Member (yes/no) */
  lawSocietyMember: string;
  /** Set false to skip API fetch (e.g., when another fee flow is active) */
  enabled?: boolean;
};

export type PCFeeResult = {
  feeData: GetFeeResponse | null;
  feeLoading: boolean;
  feeError: string | null;
};

/** Parse DD/MM/YYYY → ISO YYYY-MM-DD, or null if invalid */
function parseDMYtoISO(dmy: string): string | null {
  if (!dmy) return null;
  const parts = dmy.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/** Map practiceType form value → API RegistryType */
export function practiceTypeToRegistryType(pt: string, principalSubtype?: string): 'Principal/Employee' | 'Principal-Supervisor' | 'Gov/Corporate' | 'Volunteer' | null {
  if (pt === 'principal' && principalSubtype === 'supervising') return 'Principal-Supervisor';
  if (pt === 'principal' || pt === 'employee') return 'Principal/Employee';
  if (pt === 'corporate' || pt === 'government') return 'Gov/Corporate';
  if (pt === 'volunteer') return 'Volunteer';
  return null;
}

/** Map practiceType form value → display label */
export function practiceTypeLabel(pt: string): string {
  if (pt === 'principal') return 'Principal';
  if (pt === 'employee') return 'Employee';
  if (pt === 'corporate') return 'Corporate';
  if (pt === 'government') return 'Government';
  if (pt === 'volunteer') return 'Volunteer';
  return 'Not currently practising';
}

/**
 * Fetches PC fees from the backend API whenever any of the four
 * fee-determining fields change.
 *
 * Field mapping to table columns:
 *   dateOfAdmission      → AdmissionStartMMDD / AdmissionEndMMDD
 *   pcEffectiveDate      → EffectivePeriodStartMMDD / EffectivePeriodEndMMDD
 *   residentialCountry   → PracticeCountry  ("Australia" | "Outside Australia")
 *   practiceType         → RegistryType (via practiceTypeToRegistryType)
 *
 * When notCurrentlyPractising=true the effective date is auto-computed as
 * max(dateOfAdmission, today) per business rule.
 */
export function usePCFee({
  dateOfAdmission,
  pcEffectiveDate,
  residentialCountry,
  practiceType,
  practiceSpecify,
  notCurrentlyPractising,
  lawSocietyMember,
  enabled = true,
}: PCFeeParams): PCFeeResult {
  const [feeData, setFeeData] = useState<GetFeeResponse | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);


  useEffect(() => {
    if (!enabled) {
      setFeeData(null);
      setFeeError(null);
      setFeeLoading(false);
      return;
    }

    const registryType = practiceTypeToRegistryType(practiceType, practiceSpecify);

    const dateOfAdmissionISO = parseDMYtoISO(dateOfAdmission);
    let effectiveDateToSend: string | null;
    if (notCurrentlyPractising) {
      const todayISO = new Date().toISOString().split('T')[0];
      effectiveDateToSend = dateOfAdmissionISO
        ? (dateOfAdmissionISO > todayISO ? dateOfAdmissionISO : todayISO)
        : todayISO;
    } else {
      effectiveDateToSend = parseDMYtoISO(pcEffectiveDate);
    }

    // Ensure practiceCountry is always 'Australia' or 'Outside Australia'
    let practiceCountry: 'Australia' | 'Outside Australia';
    if (residentialCountry && residentialCountry.trim().toLowerCase() === 'australia') {
      practiceCountry = 'Australia';
    } else {
      practiceCountry = 'Outside Australia';
    }

    // Don't call the API until all required fields are available.
    // For principal, subtype must be selected before requesting fees.
    const principalSubtypeMissing = practiceType === 'principal' && !practiceSpecify;
    if (!dateOfAdmissionISO || !effectiveDateToSend || !residentialCountry || !registryType || principalSubtypeMissing) {
      setFeeData(null);
      setFeeError(null);
      setFeeLoading(false);
      return;
    }

    setFeeLoading(true);
    setFeeError(null);

    apiService.getFee({
      formType: FORM_TYPES.PRACTISING_CERTIFICATE_NEW,
      dateOfAdmission: dateOfAdmissionISO ?? '',
      effectiveDate: effectiveDateToSend ?? '',
      practiceCountry,
      registryType,
      SM: lawSocietyMember === 'yes' ? 'yes' : 'No',
    })
      .then(data => {
        setFeeData(data);
        setFeeLoading(false);
      })
      .catch((err: any) => {
        setFeeData(null);
        setFeeError(err?.message || 'Unable to retrieve fee information.');
        setFeeLoading(false);
      });
  }, [enabled, notCurrentlyPractising, practiceType, practiceSpecify, dateOfAdmission, pcEffectiveDate, residentialCountry, lawSocietyMember]);

  return { feeData, feeLoading, feeError };
}
