import { Link, Redirect, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
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
          <Text style={styles.title}>Todo-ly</Text>
          <Text style={styles.subtitle}>Group your tasks with ease</Text>
        </View>

        {/* Lottie animation below the app name */}
        <View style={{ width: '100%', maxWidth: 400, height: 220, marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}>
          <WebView
            originWhitelist={["*"]}
            style={{ backgroundColor: 'transparent' }}
            javaScriptEnabled
            domStorageEnabled
            source={{
              html: `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body { margin:0; padding:0; background: transparent; height:100%; }
      .wrap { display:flex; align-items:center; justify-content:center; height:100%; }
      dotlottie-player { width:100%; height:100%; }
    </style>
    <script src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs" type="module"></script>
  </head>
  <body>
    <div class="wrap">
      <dotlottie-player src="https://lottie.host/aa0a87b3-8645-4603-b29c-975c563e96a8/NB3qEaEjPn.lottie" autoplay loop></dotlottie-player>
    </div>
  </body>
  </html>`
            }}
          />
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
