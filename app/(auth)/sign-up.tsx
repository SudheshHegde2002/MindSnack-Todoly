import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { handleSignUpPress, handleVerifyPress, handleResendCode } from '../utils/auth_utils';
import SignUpManager from './coreComponents/signUpManager';
import VerificationManager from './coreComponents/verificationManager';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  
  // Store verification state to persist when app comes back from background
  const verificationStateRef = useRef({ emailAddress: '', password: '', isPending: false });

  // Update ref when state changes
  useEffect(() => {
    verificationStateRef.current = {
      emailAddress,
      password,
      isPending: pendingVerification,
    };
  }, [emailAddress, password, pendingVerification]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && verificationStateRef.current.isPending) {
        // Restore verification state when coming back to app
        setPendingVerification(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const onSignUpPress = () => {
    handleSignUpPress({
        signUp,
        isLoaded,
        emailAddress,
        password,
        setError,
        setPendingVerification,
    });
  };

  const onVerifyPress = () => {
    handleVerifyPress({
        signUp,
        setActive,
        isLoaded,
        code,
        setError,
        onSuccess: () => router.replace('/(main)'),
    });
  };

  const onResendCode = async () => {
    await handleResendCode({
        signUp,
        isLoaded,
        setError,
    });
  };

//Conditional rendering to check if the user is pending verification(otp screen)
  if (pendingVerification) {
    return (
      <VerificationManager
        emailAddress={emailAddress}
        code={code}
        setCode={setCode}
        error={error}
        onBack={() => {
          setPendingVerification(false);
          verificationStateRef.current.isPending = false;
        }}
        onVerifyPress={onVerifyPress}
        onResendCode={onResendCode}
      />
    );
  }
//The sign up screen
    return (
      <SignUpManager
        emailAddress={emailAddress}
        setEmailAddress={setEmailAddress}
        password={password}
        setPassword={setPassword}
        error={error}
        onSignUpPress={onSignUpPress}
      />
    );
}
