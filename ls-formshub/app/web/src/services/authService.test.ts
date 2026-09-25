import authService from './authService';

// Mock fetch globally
global.fetch = jest.fn();

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserInfo', () => {
    test('returns user info when authenticated', async () => {
      const mockUserData = {
        clientPrincipal: {
          userId: '123',
          userDetails: 'test@example.com',
          identityProvider: 'aadb2c',
          claims: [
            { typ: 'emails', val: 'test@example.com' },
            { typ: 'given_name', val: 'John' },
            { typ: 'family_name', val: 'Doe' }
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData
      });

      const userInfo = await authService.getUserInfo();

      expect(fetch).toHaveBeenCalledWith('/.auth/me');
      expect(userInfo).not.toBeNull();
      expect(userInfo?.userId).toBe('123');
      expect(userInfo?.userDetails).toBe('test@example.com');
      expect(userInfo?.identityProvider).toBe('aadb2c');
    });

    test('returns null when not authenticated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clientPrincipal: null })
      });

      const userInfo = await authService.getUserInfo();

      expect(userInfo).toBeNull();
    });

    test('returns null when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const userInfo = await authService.getUserInfo();

      expect(userInfo).toBeNull();
    });

    test('returns null when fetch throws error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const userInfo = await authService.getUserInfo();

      expect(userInfo).toBeNull();
    });

    test('returns null when response is missing clientPrincipal', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const userInfo = await authService.getUserInfo();

      expect(userInfo).toBeNull();
    });
  });
});
