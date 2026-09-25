import { FormErrorSummaryItem } from '../components/FormErrorSummary';

export const toErrorLabel = (field: string): string =>
  field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());

export const getValidationSummary = (nextErrors: Record<string, string>): FormErrorSummaryItem[] =>
  Object.entries(nextErrors)
    .filter(([, message]) => message !== '')
    .map(([field, message]) => ({
      field,
      label: toErrorLabel(field),
      message,
    }));

export const focusFieldByName = (
  fieldName: string,
  fallbackSelector?: (fieldName: string) => Element | null,
): void => {
  const el =
    document.querySelector(`[name="${fieldName}"]`) ||
    document.getElementById(fieldName) ||
    fallbackSelector?.(fieldName);

  if (el instanceof HTMLElement) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof el.focus === 'function') {
      el.focus({ preventScroll: true });
    }
  }
};
