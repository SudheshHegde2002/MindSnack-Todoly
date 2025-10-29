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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles/addTodoModalStyles';
import { useGroups } from '../../../hooks/useGroups';

type AddTodoModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string, groupId: string) => void;
};

export default function AddTodoModal({ visible, onClose, onAdd }: AddTodoModalProps) {
  const { groups, addGroup } = useGroups();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Set default selected group when modal opens
  React.useEffect(() => {
    if (visible && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [visible, groups, selectedGroupId]);

  const handleAdd = () => {
    if (title.trim() && selectedGroupId) {
      onAdd(title.trim(), description.trim(), selectedGroupId);
      setTitle('');
      setDescription('');
      setSelectedGroupId(groups[0]?.id || '');
      onClose();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setSelectedGroupId(groups[0]?.id || '');
    setIsCreatingGroup(false);
    setNewGroupName('');
    onClose();
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreatingGroup(false);
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

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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

            <Text style={styles.label}>Group</Text>
            <View style={styles.groupContainer}>
              {groups.map((group) => (
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
                  <MaterialIcons name="add" size={16} color="#6B7280" />
                  <Text style={styles.groupChipText}> New Group</Text>
                </TouchableOpacity>
              )}
            </View>

            {isCreatingGroup && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter group name"
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { flex: 1 }]}
                    onPress={() => {
                      setIsCreatingGroup(false);
                      setNewGroupName('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { flex: 1 },
                      !newGroupName.trim() && styles.addButtonDisabled,
                    ]}
                    onPress={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                  >
                    <Text style={styles.addButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

