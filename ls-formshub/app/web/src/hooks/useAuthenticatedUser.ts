import { useState, useEffect } from 'react';
import authService from '../services/authService';

export interface AuthenticatedUser {
  lawSocietyId: string | null;
  email: string | null;
  name: string | null;
  firstName: string | null;
  surname: string | null;
  otherName: string | null; // Middle/Other names
  title: string | null;
  isMember: boolean | null;
}

/**
 * Custom hook that fetches authenticated user info from Azure Static Web Apps on mount.
 * Replaces the duplicated auth state + useEffect pattern in every form.
 */
export function useAuthenticatedUser(): AuthenticatedUser {
  const [lawSocietyId, setLawSocietyId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [surname, setSurname] = useState<string | null>(null);
  const [otherName, setOtherName] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userInfo = await authService.getUserInfo();
      if (userInfo) {
        setLawSocietyId(userInfo.lawSocietyNumber || null);
        setEmail(userInfo.email || null);
        setName(userInfo.name || null);
        setFirstName(userInfo.firstName || null);
        setSurname(userInfo.surname || null);
        setOtherName(userInfo.otherName || null);
        setTitle(userInfo.title || null);
        setIsMember(userInfo.isMember ?? null);
      }
    };
    fetchUserInfo();
  }, []);

  return {
    lawSocietyId,
    email,
    name,
    firstName,
    surname,
    otherName,
    title,
    isMember,
  };
}
