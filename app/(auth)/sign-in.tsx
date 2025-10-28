import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { handleSignInPress } from '../utils/auth_utils';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const onSignInPress = () => {
    handleSignInPress({
      signIn,
      setActive,
      isLoaded,
      emailAddress,
      password,
      setError,
      onSuccess: () => router.replace('/(main)/home'),
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FAFAFA' }}>
      <Link href="/(auth)/welcome" asChild>
        <TouchableOpacity style={{ marginBottom: 24 }}>
          <Text style={{ color: '#6366F1', fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>
      </Link>

      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 8, color: '#1A1A1A' }}>Sign In</Text>
      <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>Welcome back to Todoly</Text>

      {error ? (
        <Text style={{ color: '#EF4444', marginBottom: 12, fontSize: 14 }}>{error}</Text>
      ) : null}

      <TextInput
        value={emailAddress}
        onChangeText={setEmailAddress}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ 
          borderWidth: 1, 
          borderColor: '#E5E7EB', 
          padding: 14, 
          marginBottom: 16, 
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          fontSize: 16
        }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={{ 
          borderWidth: 1, 
          borderColor: '#E5E7EB', 
          padding: 14, 
          marginBottom: 24, 
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          fontSize: 16
        }}
      />

      <TouchableOpacity 
        onPress={onSignInPress} 
        style={{ 
          backgroundColor: '#6366F1', 
          padding: 16, 
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
        <Text style={{ color: '#6B7280', fontSize: 14 }}>Don't have an account? </Text>
        <Link href="/(auth)/sign-up">
          <Text style={{ color: '#6366F1', fontSize: 14, fontWeight: '600' }}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
}
