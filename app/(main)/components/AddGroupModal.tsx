import React, { useState, useEffect, useRef } from 'react';
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
import { useGroups } from '../../../hooks/useGroups';

type AddGroupModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AddGroupModal({ visible, onClose }: AddGroupModalProps) {
  const { groups, addGroup } = useGroups();
  const [groupName, setGroupName] = useState('');
  const [modalKey, setModalKey] = useState(0);
  const inputRef = useRef<TextInput>(null);

  // Reset modal state and remount when it becomes visible
  useEffect(() => {
    if (visible) {
      setGroupName('');
      setModalKey(prev => prev + 1);
      // Delay focusing to allow modal animation and remount
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleCancel = () => {
    setGroupName('');
    Keyboard.dismiss();
    inputRef.current?.blur(); // Explicitly blur the input
    onClose();
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;

    // Check if group with this name already exists
    const existingGroup = groups.find(g => g.name.toLowerCase() === groupName.trim().toLowerCase());
    if (existingGroup) {
      Alert.alert('Group Exists', `A group named "${groupName.trim()}" already exists.`);
      return;
    }

    Keyboard.dismiss();
    inputRef.current?.blur(); // Explicitly blur the input
    
    try {
      await addGroup(groupName.trim());
      setGroupName('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
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
            <Text style={styles.modalTitle}>New Group</Text>
            <TouchableOpacity onPress={handleCancel}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={[styles.modalBody, { paddingBottom: 40 }]} key={modalKey}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="personal, work, etc"
              value={groupName}
              onChangeText={setGroupName}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
              autoFocus
              blurOnSubmit={false}
            />

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
                onPress={handleCreate}
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

