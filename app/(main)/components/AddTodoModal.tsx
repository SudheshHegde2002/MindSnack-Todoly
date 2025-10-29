import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles/addTodoModalStyles';
import { useGroups } from '../../../hooks/useGroups';

type AddTodoModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string, groupId: string) => void;
  initialGroupId?: string;
};

export default function AddTodoModal({ visible, onClose, onAdd, initialGroupId }: AddTodoModalProps) {
  const { groups, addGroup } = useGroups();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [pendingGroupSelection, setPendingGroupSelection] = useState<string | null>(null);

  // Filter to get unique groups by name, keeping the first occurrence
  const uniqueGroups = React.useMemo(() => {
    const seen = new Map<string, typeof groups[0]>();
    groups.forEach(group => {
      if (!seen.has(group.name)) {
        seen.set(group.name, group);
      }
    });
    return Array.from(seen.values());
  }, [groups]);

  // Set default selected group when modal opens
  React.useEffect(() => {
    if (visible && uniqueGroups.length > 0) {
      // Use initialGroupId if provided, otherwise use the first group
      if (initialGroupId && uniqueGroups.find(g => g.id === initialGroupId)) {
        setSelectedGroupId(initialGroupId);
      } else if (!selectedGroupId) {
        setSelectedGroupId(uniqueGroups[0].id);
      }
    }
  }, [visible, uniqueGroups, initialGroupId]);

  // Auto-select newly created group when it appears in the list
  React.useEffect(() => {
    if (pendingGroupSelection) {
      const newGroup = uniqueGroups.find(g => g.name === pendingGroupSelection);
      if (newGroup) {
        console.log('Auto-selecting new group:', newGroup.id, newGroup.name);
        setSelectedGroupId(newGroup.id);
        setPendingGroupSelection(null);
      }
    }
  }, [uniqueGroups, pendingGroupSelection]);

  const handleAdd = () => {
    if (title.trim() && selectedGroupId) {
      onAdd(title.trim(), description.trim(), selectedGroupId);
      setTitle('');
      setDescription('');
      setSelectedGroupId(uniqueGroups[0]?.id || '');
      onClose();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setSelectedGroupId(uniqueGroups[0]?.id || '');
    setIsCreatingGroup(false);
    setNewGroupName('');
    onClose();
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    // Check if group with this name already exists
    const existingGroup = uniqueGroups.find(g => g.name.toLowerCase() === newGroupName.trim().toLowerCase());
    if (existingGroup) {
      Alert.alert('Group Exists', `A group named "${newGroupName.trim()}" already exists.`);
      return;
    }
    
    const groupName = newGroupName.trim();
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Set pending selection - this will be picked up by the useEffect when the group appears
    setPendingGroupSelection(groupName);
    
    // Add the group
    await addGroup(groupName);
    
    setNewGroupName('');
    setIsCreatingGroup(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Task</Text>
            <TouchableOpacity onPress={handleCancel}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

               <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter task description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {!initialGroupId && (
                <>
                  <Text style={styles.label}>Group</Text>
                  <View style={styles.groupContainer}>
              {uniqueGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupChip,
                    selectedGroupId === group.id && styles.groupChipSelected,
                  ]}
                  onPress={() => setSelectedGroupId(group.id)}
                >
                  <Text
                    style={[
                      styles.groupChipText,
                      selectedGroupId === group.id && styles.groupChipTextSelected,
                    ]}
                  >
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {!isCreatingGroup && (
                <TouchableOpacity
                  style={styles.groupChip}
                  onPress={() => setIsCreatingGroup(true)}
                >
                  <MaterialIcons name="add" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            {isCreatingGroup && (
              <View style={{ marginTop: 12, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChangeText={setNewGroupName}
                    onSubmitEditing={handleCreateGroup}
                    returnKeyType="done"
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setIsCreatingGroup(false);
                      setNewGroupName('');
                      Keyboard.dismiss();
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#FEE2E2',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <MaterialIcons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: newGroupName.trim() ? '#D1FAE5' : '#F3F4F6',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <MaterialIcons 
                      name="check" 
                      size={20} 
                      color={newGroupName.trim() ? '#10B981' : '#9CA3AF'} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
                </>
              )}
          </ScrollView>

          {!isCreatingGroup && (
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, (!title.trim() || !selectedGroupId) && styles.addButtonDisabled]}
                onPress={handleAdd}
                disabled={!title.trim() || !selectedGroupId}
              >
                <Text style={styles.addButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

