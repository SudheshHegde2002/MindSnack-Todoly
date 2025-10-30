import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../_styles/addTodoModalStyles';

type RenameGroupModalProps = {
  visible: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
};

export default function RenameGroupModal({ visible, onClose, onRename, currentName }: RenameGroupModalProps) {
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (visible) {
      setGroupName(currentName);
    }
  }, [visible, currentName]);

  const handleCancel = () => {
    setGroupName('');
    Keyboard.dismiss();
    onClose();
  };

  const handleRename = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }

    if (groupName.trim() === currentName) {
      onClose();
      return;
    }

    Keyboard.dismiss();
    
    try {
      await onRename(groupName.trim());
      setGroupName('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to rename group. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { maxHeight: '50%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rename Group</Text>
            <TouchableOpacity onPress={handleCancel}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={[styles.modalBody, { paddingBottom: 40 }]}>
            <Text style={styles.label}>Group Name (max 25 characters)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
              onSubmitEditing={handleRename}
              returnKeyType="done"
              maxLength={25}
              autoFocus
            />
            {groupName.length > 0 && (
              <Text style={{ fontSize: 11, color: groupName.length >= 30 ? '#EF4444' : '#9CA3AF', marginTop: 4, marginBottom: 8 }}>
                {groupName.length}/25
              </Text>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 32 }}>
              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#FEE2E2',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name="close" size={28} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRename}
                disabled={!groupName.trim()}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: groupName.trim() ? '#D1FAE5' : '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons 
                  name="check" 
                  size={28} 
                  color={groupName.trim() ? '#10B981' : '#9CA3AF'} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

