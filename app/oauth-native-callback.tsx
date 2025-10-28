import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function OAuthNativeCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(main)/home');
  }, [router]);

  return <View />;
}
