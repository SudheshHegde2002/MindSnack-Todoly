import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { styles } from '../_styles/settingsModalStyles';
import { authService } from '../../../services/authService';

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authService.performSignOut();
      
      // Try to sign out from Clerk (works only when online)
      try {
        await signOut();
      } catch (error) {
        console.log('Clerk sign out failed (likely offline):', error);
      }
      
      onClose();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              
              <View style={styles.infoCard}>
                <MaterialIcons name="email" size={20} color="#6B7280" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>
                    {user?.primaryEmailAddress?.emailAddress || 'Not available'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <MaterialIcons name="person" size={20} color="#6B7280" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>User ID</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {user?.id || 'Not available'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <MaterialIcons name="logout" size={20} color="#EF4444" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Todoly v1.0.0</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

