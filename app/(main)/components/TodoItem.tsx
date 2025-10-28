import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles/todoItemStyles';

export type Todo = {
  id: string;
  title: string;
  description: string;
  group: string;
  completed: boolean;
  createdAt: Date;
};

type TodoItemProps = {
  todo: Todo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
};

const GROUP_COLORS: { [key: string]: string } = {
  Personal: '#EC4899',
  Work: '#3B82F6',
  Shopping: '#10B981',
  Health: '#F59E0B',
  Other: '#6B7280',
};

export default function TodoItem({ todo, onToggleComplete, onDelete }: TodoItemProps) {
  const groupColor = GROUP_COLORS[todo.group] || GROUP_COLORS.Other;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onToggleComplete(todo.id)}
      >
        {todo.completed ? (
          <MaterialIcons name="check-circle" size={24} color="#6366F1" />
        ) : (
          <MaterialIcons name="radio-button-unchecked" size={24} color="#D1D5DB" />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, todo.completed && styles.titleCompleted]}>
            {todo.title}
          </Text>
          <View style={[styles.groupBadge, { backgroundColor: `${groupColor}20` }]}>
            <Text style={[styles.groupText, { color: groupColor }]}>{todo.group}</Text>
          </View>
        </View>
        {todo.description ? (
          <Text style={[styles.description, todo.completed && styles.descriptionCompleted]}>
            {todo.description}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(todo.id)}>
        <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

