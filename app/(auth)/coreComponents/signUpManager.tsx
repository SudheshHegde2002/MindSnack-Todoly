import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { styles } from '../styles/signUpStyles';

type Props = {
    emailAddress: string;
    setEmailAddress: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    error: string;
    onSignUpPress: () => void;
};

export default function SignUpManager({
    emailAddress,
    setEmailAddress,
    password,
    setPassword,
    error,
    onSignUpPress,
}: Props) {
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


