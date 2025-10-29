import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { handleSignInPress } from '../utils/auth_utils';
import SigninManager from './coreComponents/signinManager';

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
                onSuccess: () => router.replace('/(main)/'),
        });
    };
//The sign in screen
        return (
            <SigninManager
                emailAddress={emailAddress}
                setEmailAddress={setEmailAddress}
                password={password}
                setPassword={setPassword}
                error={error}
                onSignInPress={onSignInPress}
            />
        );
}
