import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles/todoItemStyles';
import { LocalTodo } from '../../../services/database';

type TodoItemProps = {
  todo: LocalTodo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function TodoItem({ todo, onToggleComplete, onDelete }: TodoItemProps) {
  const isCompleted = todo.is_completed === 1;

  const handleLongPress = () => {
    if (isCompleted) {
      Alert.alert(
        'Todo Actions',
        'What would you like to do?',
        [
          { text: 'Mark as Active', onPress: () => onToggleComplete(todo.id) },
          { text: 'Delete', onPress: () => onDelete(todo.id), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(
        'Delete Todo',
        'Are you sure you want to delete this todo?',
        [
          { text: 'Delete', onPress: () => onDelete(todo.id), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onToggleComplete(todo.id)}
      >
        {isCompleted ? (
          <MaterialIcons name="check-circle" size={24} color="#6366F1" />
        ) : (
          <MaterialIcons name="radio-button-unchecked" size={24} color="#D1D5DB" />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
          {todo.title}
        </Text>
        {todo.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {todo.description}
          </Text>
        ) : null}
        {!todo.synced && (
          <View style={styles.syncBadge}>
            <MaterialIcons name="sync" size={12} color="#EF4444" />
            <Text style={styles.syncText}>Pending sync</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
