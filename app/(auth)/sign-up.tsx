import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { handleSignUpPress, handleVerifyPress } from '../utils/auth_utils';
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
      onSuccess: () => router.replace('/(main)/home'),
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
        onBack={() => setPendingVerification(false)}
        onVerifyPress={onVerifyPress}
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
