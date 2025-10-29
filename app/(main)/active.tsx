import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, SectionList, Alert, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { styles } from './_styles/todoStyles';
import AddTodoModal from './components/AddTodoModal';
import SettingsModal from './components/SettingsModal';
import TodoItem from './components/TodoItem';
import { useTodos } from '../../hooks/useTodos';
import { useGroups } from '../../hooks/useGroups';

export default function ActiveScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set());
  const { todos, isLoading, isOnline, addTodo, toggleComplete, deleteTodo, deleteTodos } = useTodos();
  const { groups } = useGroups();
  
  const headerButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(headerButtonScale, {
      toValue: selectionMode ? 1.1 : 1,
      useNativeDriver: true,
      tension: 150,
      friction: 7,
    }).start();
  }, [selectionMode]);

  const handleLongPress = (id: string) => {
    setSelectionMode(true);
    setSelectedTodoIds(new Set([id]));
  };

  const handleSelect = (id: string) => {
    setSelectedTodoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      if (newSet.size === 0) {
        setSelectionMode(false);
      }
      return newSet;
    });
  };

  const handleBulkDelete = () => {
    if (selectedTodoIds.size === 0) return;

    Alert.alert(
      'Delete Todos',
      `Are you sure you want to delete ${selectedTodoIds.size} todo${selectedTodoIds.size > 1 ? 's' : ''}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTodos(Array.from(selectedTodoIds));
            setSelectedTodoIds(new Set());
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedTodoIds(new Set());
  };

  const activeTodos = todos.filter((todo) => todo.is_completed === 0);

  // Group todos by group_id - MUST be before early returns to follow Rules of Hooks
  const groupedTodos = useMemo(() => {
    const sections: { title: string; data: typeof todos }[] = [];
    
    groups.forEach((group) => {
      const groupTodos = activeTodos.filter((todo) => todo.group_id === group.id);
      if (groupTodos.length > 0) {
        sections.push({
          title: group.name,
          data: groupTodos,
        });
      }
    });
    
    // Handle todos without a group (orphaned todos)
    const orphanedTodos = activeTodos.filter((todo) => 
      !todo.group_id || !groups.some(g => g.id === todo.group_id)
    );
    if (orphanedTodos.length > 0) {
      sections.push({
        title: 'Uncategorized',
        data: orphanedTodos,
      });
    }
    
    return sections;
  }, [activeTodos, groups]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
          {!isOnline && (
            <MaterialIcons name="cloud-off" size={20} color="#EF4444" style={{ marginRight: 12 }} />
          )}
          {selectionMode ? (
            <>
              <View style={{ 
                backgroundColor: '#EEF2FF', 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 12, 
                marginRight: 12 
              }}>
                <Text style={{ color: '#6366F1', fontWeight: '600', fontSize: 14 }}>
                  {selectedTodoIds.size} selected
                </Text>
              </View>
              <Animated.View style={{ transform: [{ scale: headerButtonScale }], marginRight: 16 }}>
                <TouchableOpacity onPress={handleCancelSelection}>
                  <MaterialIcons name="close" size={24} color="#6366F1" />
                </TouchableOpacity>
              </Animated.View>
              <Animated.View style={{ transform: [{ scale: headerButtonScale }] }}>
                <TouchableOpacity onPress={handleBulkDelete}>
                  <MaterialIcons name="delete" size={24} color="#EF4444" />
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
              <MaterialIcons name="settings" size={24} color="#6366F1" />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [navigation, isOnline, selectionMode, selectedTodoIds, headerButtonScale]);

  if (!isLoaded || isLoading) {
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
      {activeTodos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Active Tasks</Text>
          <Text style={styles.emptySubtitle}>Add your first task to get started</Text>
        </View>
      ) : (
        <SectionList
          sections={groupedTodos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onToggleComplete={toggleComplete}
              onDelete={deleteTodo}
              selectionMode={selectionMode}
              isSelected={selectedTodoIds.has(item.id)}
              onSelect={handleSelect}
              onLongPress={handleLongPress}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <AddTodoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addTodo}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}
