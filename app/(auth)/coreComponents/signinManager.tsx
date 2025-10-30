import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../_styles/signInStyles';

type Props = {
    emailAddress: string;
    setEmailAddress: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    error: string;
    onSignInPress: () => void;
};

export default function SigninManager({
    emailAddress,
    setEmailAddress,
    password,
    setPassword,
    error,
    onSignInPress,
}: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View style={[styles.container, { justifyContent: 'flex-start', paddingTop: 85 }]}> 
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
            <View style={styles.passwordContainer}>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                    <MaterialIcons 
                        name={showPassword ? "visibility" : "visibility-off"} 
                        size={24} 
                        color="#6B7280" 
                    />
                </TouchableOpacity>
            </View>

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


