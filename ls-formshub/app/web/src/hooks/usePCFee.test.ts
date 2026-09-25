import { practiceTypeToRegistryType, practiceTypeLabel } from './usePCFee';

describe('usePCFee Utility Functions', () => {
  describe('practiceTypeToRegistryType', () => {
    test('maps principal to Principal/Employee', () => {
      expect(practiceTypeToRegistryType('principal')).toBe('Principal/Employee');
    });

    test('maps principal supervising subtype to Principal-Supervisor', () => {
      expect(practiceTypeToRegistryType('principal', 'supervising')).toBe('Principal-Supervisor');
    });

    test('maps employee to Principal/Employee', () => {
      expect(practiceTypeToRegistryType('employee')).toBe('Principal/Employee');
    });

    test('maps corporate to Gov/Corporate', () => {
      expect(practiceTypeToRegistryType('corporate')).toBe('Gov/Corporate');
    });

    test('maps government to Gov/Corporate', () => {
      expect(practiceTypeToRegistryType('government')).toBe('Gov/Corporate');
    });

    test('maps volunteer to Volunteer', () => {
      expect(practiceTypeToRegistryType('volunteer')).toBe('Volunteer');
    });

    test('maps empty string to null', () => {
      expect(practiceTypeToRegistryType('')).toBeNull();
    });

    test('maps unknown values to null', () => {
      expect(practiceTypeToRegistryType('unknown')).toBeNull();
    });
  });

  describe('practiceTypeLabel', () => {
    test('returns correct label for principal', () => {
      expect(practiceTypeLabel('principal')).toBe('Principal');
    });

    test('returns correct label for employee', () => {
      expect(practiceTypeLabel('employee')).toBe('Employee');
    });

    test('returns correct label for corporate', () => {
      expect(practiceTypeLabel('corporate')).toBe('Corporate');
    });

    test('returns correct label for government', () => {
      expect(practiceTypeLabel('government')).toBe('Government');
    });

    test('returns correct label for volunteer', () => {
      expect(practiceTypeLabel('volunteer')).toBe('Volunteer');
    });

    test('returns default label for empty string', () => {
      expect(practiceTypeLabel('')).toBe('Not currently practising');
    });

    test('returns default label for unknown values', () => {
      expect(practiceTypeLabel('unknown')).toBe('Not currently practising');
    });
  });
});
