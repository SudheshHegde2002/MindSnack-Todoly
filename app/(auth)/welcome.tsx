import { Link, Redirect, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth, useOAuth } from '@clerk/clerk-expo';
import React from 'react';
import { styles } from './_styles/welcomeStyles';
import { makeRedirectUri } from 'expo-auth-session';
WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  const onGoogleSignIn = React.useCallback(async () => {
    try {
      setIsAuthenticating(true);
      const redirectUrl = makeRedirectUri({ scheme: 'todoly' });
      const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // Explicitly navigate to home after successful auth
        router.replace('/(main)');
      } else {
        // If OAuth didn't complete, reset the state
        setIsAuthenticating(false);
      }
    } catch (err) {
      console.error('OAuth error:', err);
      setIsAuthenticating(false);
    }
  }, [router, startOAuthFlow]);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(main)" />;
  }

  if (isAuthenticating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Todoly</Text>
          <Text style={styles.subtitle}>Organize your life with elegance</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onGoogleSignIn}
          >
            <Text style={styles.primaryButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Sign in with Email</Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={styles.footerLink}>Sign up</Text>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
