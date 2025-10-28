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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles/addTodoModalStyles';

type AddTodoModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string, group: string) => void;
};

const TASK_GROUPS = ['Personal', 'Work', 'Shopping', 'Health', 'Other'];

export default function AddTodoModal({ visible, onClose, onAdd }: AddTodoModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Personal');

  const handleAdd = () => {
    if (title.trim()) {
      onAdd(title.trim(), description.trim(), selectedGroup);
      setTitle('');
      setDescription('');
      setSelectedGroup('Personal');
      onClose();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setSelectedGroup('Personal');
    onClose();
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

            <Text style={styles.label}>Task Group</Text>
            <View style={styles.groupContainer}>
              {TASK_GROUPS.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.groupChip,
                    selectedGroup === group && styles.groupChipSelected,
                  ]}
                  onPress={() => setSelectedGroup(group)}
                >
                  <Text
                    style={[
                      styles.groupChipText,
                      selectedGroup === group && styles.groupChipTextSelected,
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, !title.trim() && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={!title.trim()}
            >
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

