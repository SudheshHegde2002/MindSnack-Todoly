import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './_styles/todoStyles';
import { styles as settingsStyles } from './_styles/settingsModalStyles';
import OfflineIndicator from './components/OfflineIndicator';

export default function ProfileScreen() {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.sectionTitle}>Account</Text>
          
          <View style={settingsStyles.infoCard}>
            <MaterialIcons name="email" size={20} color="#6B7280" />
            <View style={settingsStyles.infoTextContainer}>
              <Text style={settingsStyles.infoLabel}>Email</Text>
              <Text style={settingsStyles.infoValue}>
                {user?.primaryEmailAddress?.emailAddress || 'Not available'}
              </Text>
            </View>
          </View>

        </View>

        <View style={settingsStyles.section}>
          <Text style={settingsStyles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={settingsStyles.signOutButton} onPress={handleSignOut}>
            <MaterialIcons name="logout" size={20} color="#EF4444" />
            <Text style={settingsStyles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={settingsStyles.footer}>
          <Text style={settingsStyles.footerText}>Todoly v1.0.0</Text>
        </View>
      </ScrollView>

      <OfflineIndicator />
    </View>
  );
}

