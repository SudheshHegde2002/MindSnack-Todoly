import { Alert } from 'react-native';
import type { SignInResource, SignUpResource, SetActive } from '@clerk/types';

interface SignUpPressParams {
  signUp: SignUpResource | undefined;
  isLoaded: boolean;
  emailAddress: string;
  password: string;
  setError: (error: string) => void;
  setPendingVerification: (pending: boolean) => void;
}

interface VerifyPressParams {
  signUp: SignUpResource | undefined;
  setActive: SetActive | undefined;
  isLoaded: boolean;
  code: string;
  setError: (error: string) => void;
  onSuccess: () => void;
}

interface SignInPressParams {
  signIn: SignInResource | undefined;
  setActive: SetActive | undefined;
  isLoaded: boolean;
  emailAddress: string;
  password: string;
  setError: (error: string) => void;
  onSuccess: () => void;
}

//this is a utility function to handle the sign up process
export const handleSignUpPress = async ({
  signUp,
  isLoaded,
  emailAddress,
  password,
  setError,
  setPendingVerification,
}: SignUpPressParams): Promise<void> => {
  if (!isLoaded || !signUp) return;

  if (!emailAddress || !password) {
    setError('Please enter both email and password');
    Alert.alert('Error', 'Please enter both email and password');
    return;
  }

  try {
    setError('');
    await signUp.create({ 
      emailAddress, 
      password 
    });
    
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    setPendingVerification(true);
  } catch (err: any) {
    console.error('Sign up error:', JSON.stringify(err, null, 2));
    const errorMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Sign up failed. Please try again.';
    setError(errorMessage);
    Alert.alert('Sign Up Error', errorMessage);
  }
};

//this is a utility function to handle the verify process
export const handleVerifyPress = async ({
  signUp,
  setActive,
  isLoaded,
  code,
  setError,
  onSuccess,
}: VerifyPressParams): Promise<void> => {
  if (!isLoaded || !signUp || !setActive) return;

  try {
    setError('');
    const completeSignUp = await signUp.attemptEmailAddressVerification({
      code,
    });

    if (completeSignUp.status === 'complete') {
      await setActive({ session: completeSignUp.createdSessionId });
      onSuccess();
    } else {
      console.error(JSON.stringify(completeSignUp, null, 2));
      setError('Verification incomplete. Please try again.');
    }
  } catch (err: any) {
    console.error(JSON.stringify(err, null, 2));
    const errorMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Verification failed';
    setError(errorMessage);
    Alert.alert('Error', errorMessage);
  }
};

//this is a utility function to handle the sign in process
export const handleSignInPress = async ({
  signIn,
  setActive,
  isLoaded,
  emailAddress,
  password,
  setError,
  onSuccess,
}: SignInPressParams): Promise<void> => {
  if (!isLoaded || !signIn || !setActive) return;

  if (!emailAddress || !password) {
    setError('Please enter both email and password');
    Alert.alert('Error', 'Please enter both email and password');
    return;
  }

  try {
    setError('');
    const signInAttempt = await signIn.create({
      identifier: emailAddress,
      password,
    });

    if (signInAttempt.status === 'complete') {
      await setActive({ session: signInAttempt.createdSessionId });
      onSuccess();
    } else {
      console.error('Sign in incomplete:', JSON.stringify(signInAttempt, null, 2));
      setError('Sign in incomplete. Please try again.');
    }
  } catch (err: any) {
    console.error('Sign in error:', JSON.stringify(err, null, 2));
    const errorMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Sign in failed. Please try again.';
    setError(errorMessage);
    Alert.alert('Sign In Error', errorMessage);
  }
};

