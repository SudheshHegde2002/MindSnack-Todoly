import { Link, Redirect, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { useAuth, useOAuth, useUser } from '@clerk/clerk-expo';
import React from 'react';
import { styles } from './_styles/welcomeStyles';
import { makeRedirectUri } from 'expo-auth-session';
import NetInfo from '@react-native-community/netinfo';
import { offlineUserService } from '../../services/offlineUserService';
import LottieAnimation from './_styles/lotteAnimation';
WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const onGoogleSignIn = React.useCallback(async () => {
    if (!isOnline) return;
    try {
      setIsAuthenticating(true);
      const redirectUrl = makeRedirectUri({ scheme: 'todoly' });
      const { createdSessionId, setActive, signUp, signIn } = await startOAuthFlow({ redirectUrl });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        
        // Store user ID immediately for offline access
        // User ID can come from either signUp or signIn depending on if it's a new user or existing user
        let userId: string | undefined;
        if (signUp?.createdUserId) {
          userId = signUp.createdUserId;
        } else if (signIn) {
          // Try different possible locations for user ID in Clerk's structure
          userId = (signIn as any).userData?.id || (signIn as any).userId;
        }
        
        if (userId) {
          await offlineUserService.storeUserId(userId);
          console.log('Stored user ID after Google OAuth:', userId);
        } else {
          console.warn('Could not extract user ID from OAuth flow, will rely on hooks to store it');
        }
        
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
  }, [router, startOAuthFlow, isOnline]);

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

  const disabledStyle = { opacity: 0.5 };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Todo-ly</Text>
          <Text style={styles.subtitle}>Group your tasks with ease</Text>
        </View>

        {/* Lottie animation below the app name */}
        <View style={{ width: '100%', maxWidth: 400, height: 220, marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}>
          <LottieAnimation />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, !isOnline && disabledStyle]}
            onPress={onGoogleSignIn}
            disabled={!isOnline}
          >
            <Text style={styles.primaryButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {isOnline ? (
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Sign in with Email</Text>
              </TouchableOpacity>
            </Link>
          ) : (
            <TouchableOpacity style={[styles.secondaryButton, disabledStyle]} disabled>
              <Text style={styles.secondaryButtonText}>Sign in with Email</Text>
            </TouchableOpacity>
          )}

          {!isOnline && (
            <View style={{ marginTop: 12, paddingHorizontal: 8 }}>
              <Text style={{ color: '#EF4444', textAlign: 'center' }}>
                Please connect to the internet to log in or sign up
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            {isOnline ? (
              <Link href="/(auth)/sign-up">
                <Text style={styles.footerLink}>Sign up</Text>
              </Link>
            ) : (
              <Text style={[styles.footerLink, disabledStyle]}>Sign up</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
