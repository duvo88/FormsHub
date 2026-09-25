// Authentication service to fetch user info from Azure Static Web Apps
export interface UserInfo {
  userId: string;
  userDetails: string;
  identityProvider: string;
  claims?: Array<{ typ: string; val: string }>;
  lawSocietyNumber?: string;
  email?: string;
  name?: string;
  firstName?: string;
  surname?: string;
  otherName?: string;
  title?: string;
  isMember?: boolean;
}

class AuthService {
  /**
   * Fetches the authenticated user's information from Azure Static Web Apps
   * Returns null if not authenticated
   */
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const response = await fetch('/.auth/me');
      
      if (!response.ok) {
        console.warn('Failed to fetch user info:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data || !data.clientPrincipal) {
        console.warn('No authenticated user found');
        return null;
      }

      const user = data.clientPrincipal;
      console.log('Authenticated user:', user);

      if (process.env.NODE_ENV === 'development' && user.claims?.length === 0) {
        user.claims = [
          { "typ": "signInNames.emailAddress", "val": "tester.local@lawsociety.com.au" },
          { "typ": "name", "val": "Mr Tester Local" },
          { "typ": "given_name", "val": "Tester" },
          { "typ": "family_name", "val": "Local" },
          { "typ": "extension_MiddleName", "val": "Dev" },
          { "typ": "userTitle", "val": "Mr" },
          { "typ": "lawID", "val": "L0123456" },
          { "typ": "extension_IsMember", "val": "true" }
        ]
      }

      return {
        userId: user.userId,
        userDetails: user.userDetails,
        identityProvider: user.identityProvider,
        claims: user.claims,
        lawSocietyNumber: this.extractLawSocietyNumber(user.claims),
        email: this.extractEmail(user.claims),
        name: this.extractName(user.claims),
        firstName: this.extractFirstName(user.claims),
        surname: this.extractSurname(user.claims),
        otherName: this.extractOtherName(user.claims),
        title: this.extractTitle(user.claims),
        isMember: this.extractIsMember(user.claims),
      };
    } catch (error) {
      console.error('Error fetching user info');
      return null;
    }
  }

  /**
   * Extracts the LawID from AAD B2C claims
   * The LawID is stored in the 'lawID' custom claim
   */
  private extractLawSocietyNumber(claims?: Array<{ typ: string; val: string }>): string | undefined {
    if (!claims || claims.length === 0) {
      return undefined;
    }

    const lawIdClaim = claims.find(c => c.typ === 'lawID');
    if (lawIdClaim && lawIdClaim.val) {
      console.log(`✓ Found LawID: ${lawIdClaim.val}`);
      return lawIdClaim.val.trim();
    }

    console.warn('⚠️ lawID claim not found.');
    return undefined;
  }

  /**
   * Extracts the email address from AAD B2C claims
   */
  private extractEmail(claims?: Array<{ typ: string; val: string }>): string | undefined {
    if (!claims || claims.length === 0) {
      return undefined;
    }

    const emailClaim = claims.find(c => c.typ === 'signInNames.emailAddress');
    return emailClaim?.val?.trim();
  }

  /**
   * Extracts the user's name from AAD B2C claims
   */
  private extractName(claims?: Array<{ typ: string; val: string }>): string | undefined {
    if (!claims || claims.length === 0) {
      return undefined;
    }

    const nameClaim = claims.find(c => c.typ === 'name');
    return nameClaim?.val?.trim();
  }

  private extractFirstName(claims?: Array<{ typ: string; val: string }>): string | undefined {
    if (!claims || claims.length === 0) return undefined;
    const claim = claims.find(c => c.typ === 'given_name' || c.typ === 'givenname' || c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname');
    return claim?.val?.trim();
  }

  private extractSurname(claims?: Array<{ typ: string; val: string }>): string | undefined {
    if (!claims || claims.length === 0) return undefined;
    const claim = claims.find(c => c.typ === 'family_name' || c.typ === 'surname' || c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname');
    return claim?.val?.trim();
  }

  private extractOtherName(claims?: Array<{ typ: string; val: string }>): string | undefined {
    if (!claims || claims.length === 0) return undefined;
    const claim = claims.find(c =>
      c.typ === 'extension_MiddleName' ||
      c.typ === 'middle_name' ||
      c.typ === 'middleName' ||
      c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/middlename'
    );
    return claim?.val?.trim();
  }

  private extractTitle(claims?: Array<{ typ: string; val: string }>): string | undefined {
    if (!claims || claims.length === 0) return undefined;
    const claim = claims.find(c => c.typ === 'userTitle' || c.typ === 'title' || c.typ === 'extension_Title' || c.typ === 'jobTitle');
    return claim?.val?.trim();
  }

  private extractIsMember(claims?: Array<{ typ: string; val: string }>): boolean | undefined {
    if (!claims || claims.length === 0) return undefined;
    const claim = claims.find(c => c.typ === 'isMember' || c.typ === 'extension_IsMember');
    if (!claim) return undefined;
    return claim.val?.toLowerCase() === 'true';
  }

  /**
   * Gets just the LawID from the authenticated user
   * Returns undefined if not found
   */
  async getLawSocietyNumber(): Promise<string | undefined> {
    const userInfo = await this.getUserInfo();
    return userInfo?.lawSocietyNumber;
  }
}

export default new AuthService();
