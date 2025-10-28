import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from './styles/todoStyles';

export default function CompletedScreen() {
  const { isSignedIn, isLoaded } = useAuth();

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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Completed Tasks</Text>
        <Text style={styles.emptySubtitle}>Complete tasks to see them here</Text>
      </View>
    </View>
  );
}

