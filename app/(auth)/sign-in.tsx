import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { handleSignInPress } from '../utils/auth_utils';
import { styles } from './styles/signInStyles';

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
        <View style={styles.container}>
            <Link href="/(auth)/welcome" asChild>
                <TouchableOpacity style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
            </Link>

            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Welcome back to Todoly</Text>

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
                onPress={onSignInPress}
                style={styles.primaryButton}
            >
                <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/(auth)/sign-up">
                    <Text style={styles.footerLink}>Sign up</Text>
                </Link>
            </View>
        </View>
    );
}
