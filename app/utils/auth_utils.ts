import { Alert } from 'react-native';
import type { SignInResource, SignUpResource, SetActive } from '@clerk/types';
import { offlineUserService } from '../../services/offlineUserService';

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

interface ResendCodeParams {
  signUp: SignUpResource | undefined;
  isLoaded: boolean;
  setError: (error: string) => void;
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
      
      // Store user ID immediately for offline access
      const userId = completeSignUp.createdUserId;
      if (userId) {
        await offlineUserService.storeUserId(userId);
        console.log('✅ Stored user ID after sign up:', userId);
      }
      
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
      
      // Store user ID immediately for offline access
      // Try to get user ID from the session (Clerk's structure varies)
      const userId = (signInAttempt as any).userData?.id || (signInAttempt as any).userId;
      if (userId) {
        await offlineUserService.storeUserId(userId);
        console.log('✅ Stored user ID after sign in:', userId);
      } else {
        console.warn('⚠️ Could not extract user ID from sign-in, will rely on hooks to store it');
      }
      
      // Also store email if available
      if (emailAddress) {
        await offlineUserService.storeEmail(emailAddress);
        console.log('✅ Stored email after sign in:', emailAddress);
      }
      
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

//this is a utility function to handle resending the verification code
export const handleResendCode = async ({
  signUp,
  isLoaded,
  setError,
}: ResendCodeParams): Promise<void> => {
  if (!isLoaded || !signUp) return;

  try {
    setError('');
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    Alert.alert('Success', 'Verification code has been resent to your email');
  } catch (err: any) {
    console.error('Resend code error:', JSON.stringify(err, null, 2));
    const errorMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Failed to resend code';
    setError(errorMessage);
    Alert.alert('Error', errorMessage);
  }
};

