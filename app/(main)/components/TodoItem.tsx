import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../_styles/todoItemStyles';
import { LocalTodo } from '../../../services/database';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type TodoItemProps = {
  todo: LocalTodo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
  groupName?: string;
};

export default function TodoItem({ 
  todo, 
  onToggleComplete, 
  onDelete, 
  selectionMode = false,
  isSelected = false,
  onSelect,
  onLongPress: onLongPressCallback,
  groupName
}: TodoItemProps) {
  const isCompleted = todo.is_completed === 1;
  const [isExpanded, setIsExpanded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkboxScaleAnim = useRef(new Animated.Value(1)).current;
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  // No opacity animation to avoid flicker/disappear

  // Animation when entering/exiting selection mode
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: selectionMode ? 0.97 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(borderColorAnim, {
        toValue: selectionMode ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [selectionMode]);

  // Animation when selecting/deselecting
  useEffect(() => {
    if (selectionMode && isSelected) {
      Animated.sequence([
        Animated.spring(checkboxScaleAnim, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
        Animated.spring(checkboxScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 7,
        }),
      ]).start();
    } else {
      checkboxScaleAnim.setValue(1);
    }
  }, [isSelected]);

  // No mount fade-in to avoid blinking when items move across lists

  const handleLongPress = () => {
    if (selectionMode) return;
    
    if (onLongPressCallback) {
      onLongPressCallback(todo.id);
    } else {
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
    }
  };

  const handleTogglePress = () => {
    // Non-flickering pulse animation: scale down slightly, toggle, then scale back up
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 250,
        friction: 12,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onToggleComplete(todo.id);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 14,
      }).start();
    });
  };

  const handlePress = () => {
    if (selectionMode && onSelect) {
      onSelect(todo.id);
    } else {
      // Toggle expansion when tapping the todo (not in selection mode)
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <AnimatedTouchable 
      style={[
        styles.container,
        selectionMode && styles.containerSelectionMode,
        isSelected && styles.containerSelected,
        { transform: [{ scale: scaleAnim }] }
      ]}
      onLongPress={handleLongPress}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {selectionMode ? (
        <Animated.View 
          style={[
            styles.checkboxContainer,
            { transform: [{ scale: checkboxScaleAnim }] }
          ]}
        >
          <MaterialIcons 
            name={isSelected ? "check-box" : "check-box-outline-blank"} 
            size={24} 
            color={isSelected ? "#6366F1" : "#D1D5DB"} 
          />
        </Animated.View>
      ) : (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleTogglePress}
        >
          {isCompleted ? (
            <MaterialIcons name="check-circle" size={24} color="#10B981" />
          ) : (
            <MaterialIcons name="radio-button-unchecked" size={24} color="#D1D5DB" />
          )}
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
          {todo.title}
        </Text>
        {todo.description ? (
          <Text 
            style={[styles.description, isCompleted && styles.descriptionCompleted]} 
            numberOfLines={isExpanded ? undefined : 2}
          >
            {todo.description}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {groupName && (
            <View style={styles.groupBadge}>
              <MaterialIcons name="folder" size={12} color="#6366F1" />
              <Text style={styles.groupBadgeText}>{groupName}</Text>
            </View>
          )}
          {!todo.synced && (
            <View style={styles.syncBadge}>
              <MaterialIcons name="sync" size={12} color="#EF4444" />
              <Text style={styles.syncText}>Pending sync</Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedTouchable>
  );
}
