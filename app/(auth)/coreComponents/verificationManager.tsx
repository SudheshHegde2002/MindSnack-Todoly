import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from '../_styles/signUpStyles';

type Props = {
    emailAddress: string;
    code: string;
    setCode: (val: string) => void;
    error: string;
    onBack: () => void;
    onVerifyPress: () => void;
    onResendCode: () => void;
};

export default function VerificationManager({
    emailAddress,
    code,
    setCode,
    error,
    onBack,
    onVerifyPress,
    onResendCode,
}: Props) {
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        setIsResending(true);
        try {
            await onResendCode();
        } finally {
            setIsResending(false);
        }
    };

    return (
        <View style={[styles.verifyContainer, { justifyContent: 'flex-start', paddingTop: 85 }]}> 
            <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
            >
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.verifyTitle}>Verify Email</Text>
            <Text style={styles.verifySubtitle}>
                We sent a verification code to {emailAddress}
            </Text>

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Enter verification code"
                keyboardType="number-pad"
                style={styles.verifyInput}
                autoFocus
            />

            <TouchableOpacity
                onPress={onVerifyPress}
                style={styles.primaryButton}
            >
                <Text style={styles.primaryButtonText}>Verify</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleResend}
                disabled={isResending}
                style={styles.resendButton}
            >
                {isResending ? (
                    <ActivityIndicator size="small" color="#6366F1" />
                ) : (
                    <Text style={styles.resendButtonText}>Didn't receive code? Resend</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}


