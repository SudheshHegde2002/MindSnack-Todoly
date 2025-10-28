import { useSignUp } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import React from 'react';
import { handleSignUpPress, handleVerifyPress } from '../utils/auth_utils';
import { styles } from './styles/signUpStyles';

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

  if (pendingVerification) {
    return (
      <View style={styles.verifyContainer}>
        <TouchableOpacity 
          onPress={() => setPendingVerification(false)} 
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.verifyTitle}>Verify Email</Text>
        <Text style={styles.verifySubtitle}>
          We sent a verification code to {emailAddress}
        </Text>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Enter verification code"
          keyboardType="number-pad"
          style={styles.verifyInput}
        />

        <TouchableOpacity 
          onPress={onVerifyPress} 
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Verify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Link href="/(auth)/welcome" asChild>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </Link>

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Start organizing your life today</Text>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <TextInput
        value={emailAddress}
        onChangeText={setEmailAddress}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.inputPassword}
      />

      <TouchableOpacity 
        onPress={onSignUpPress} 
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Create Account</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/sign-in">
          <Text style={styles.footerLink}>Sign in</Text>
        </Link>
      </View>
    </View>
  );
}
