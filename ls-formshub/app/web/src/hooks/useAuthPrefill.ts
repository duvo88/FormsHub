import { useEffect, useRef } from 'react';

type PrefillValue = string | number | boolean | null | undefined;
type PrefillMap<T> = Partial<Record<keyof T, PrefillValue>>;

export function useAuthPrefill<T extends Record<string, unknown>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>,
  fieldValues: PrefillMap<T>
) {
  const lastAppliedSignatureRef = useRef('');

  useEffect(() => {
    const entries = Object.entries(fieldValues).filter(([, value]) => (
      value !== undefined && value !== null && value !== ''
    )) as Array<[keyof T, PrefillValue]>;

    const signature = entries
      .map(([key, value]) => `${String(key)}:${String(value)}`)
      .join('|');

    if (!signature || signature === lastAppliedSignatureRef.current) {
      return;
    }

    lastAppliedSignatureRef.current = signature;

    setFormData(prev => {
      const next = { ...prev };
      for (const [key, value] of entries) {
        (next as Record<keyof T, unknown>)[key] = value;
      }
      return next;
    });
  });
}
