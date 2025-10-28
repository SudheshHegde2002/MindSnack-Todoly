import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import React from 'react';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const onSignInPress = async () => {
    if (!isLoaded) return;

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
        router.replace('/(main)/home');
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

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Sign In</Text>

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

      <TouchableOpacity onPress={onSignInPress} style={{ backgroundColor: '#000', padding: 10 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Continue</Text>
      </TouchableOpacity>

      <Link href="/(auth)/sign-up">
        <Text style={{ marginTop: 16, color: 'blue', textAlign: 'center' }}>Don't have an account? Sign up</Text>
      </Link>
    </View>
  );
}
