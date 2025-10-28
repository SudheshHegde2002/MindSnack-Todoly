import { useSignUp } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import React from 'react';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;

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

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      setError('');
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(main)/home');
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

  if (pendingVerification) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 24, marginBottom: 16 }}>Verify Email</Text>
        <Text style={{ marginBottom: 16, color: '#666' }}>
          We sent a verification code to {emailAddress}
        </Text>

        {error ? (
          <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
        ) : null}

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Enter verification code"
          keyboardType="number-pad"
          style={{ borderWidth: 1, padding: 10, marginBottom: 12 }}
        />

        <TouchableOpacity onPress={onVerifyPress} style={{ backgroundColor: '#000', padding: 10 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>Verify</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setPendingVerification(false)} 
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: 'blue', textAlign: 'center' }}>Back to Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Sign Up</Text>

      {error ? (
        <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
      ) : null}

      <TextInput
        value={emailAddress}
        onChangeText={setEmailAddress}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 10, marginBottom: 12 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 12 }}
      />

      <TouchableOpacity onPress={onSignUpPress} style={{ backgroundColor: '#000', padding: 10 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Continue</Text>
      </TouchableOpacity>

      <Link href="/(auth)/sign-in">
        <Text style={{ marginTop: 16, color: 'blue', textAlign: 'center' }}>Already have an account? Sign in</Text>
      </Link>
    </View>
  );
}
