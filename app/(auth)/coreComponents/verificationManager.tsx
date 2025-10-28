import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles/signUpStyles';

type Props = {
    emailAddress: string;
    code: string;
    setCode: (val: string) => void;
    error: string;
    onBack: () => void;
    onVerifyPress: () => void;
};

export default function VerificationManager({
    emailAddress,
    code,
    setCode,
    error,
    onBack,
    onVerifyPress,
}: Props) {
    return (
        <View style={styles.verifyContainer}>
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
            />

            <TouchableOpacity
                onPress={onVerifyPress}
                style={styles.primaryButton}
            >
                <Text style={styles.primaryButtonText}>Verify</Text>
            </TouchableOpacity>
        </View>
    );
}


