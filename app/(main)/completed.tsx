import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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

      <TouchableOpacity style={styles.fab} onPress={() => console.log('Add task')}>
        <MaterialIcons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

