import { useSignUp } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import React from 'react';
import { handleSignUpPress, handleVerifyPress } from '../utils/auth_utils';

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
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FAFAFA' }}>
        <TouchableOpacity 
          onPress={() => setPendingVerification(false)} 
          style={{ marginBottom: 24 }}
        >
          <Text style={{ color: '#6366F1', fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 8, color: '#1A1A1A' }}>Verify Email</Text>
        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>
          We sent a verification code to {emailAddress}
        </Text>

        {error ? (
          <Text style={{ color: '#EF4444', marginBottom: 12, fontSize: 14 }}>{error}</Text>
        ) : null}

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Enter verification code"
          keyboardType="number-pad"
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
          onPress={onVerifyPress} 
          style={{ 
            backgroundColor: '#6366F1', 
            padding: 16, 
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Verify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FAFAFA' }}>
      <Link href="/(auth)/welcome" asChild>
        <TouchableOpacity style={{ marginBottom: 24 }}>
          <Text style={{ color: '#6366F1', fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>
      </Link>

      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 8, color: '#1A1A1A' }}>Create Account</Text>
      <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>Start organizing your life today</Text>

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
        onPress={onSignUpPress} 
        style={{ 
          backgroundColor: '#6366F1', 
          padding: 16, 
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Create Account</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
        <Text style={{ color: '#6B7280', fontSize: 14 }}>Already have an account? </Text>
        <Link href="/(auth)/sign-in">
          <Text style={{ color: '#6366F1', fontSize: 14, fontWeight: '600' }}>Sign in</Text>
        </Link>
      </View>
    </View>
  );
}
