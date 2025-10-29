import { useAuth } from '@clerk/clerk-expo';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, Animated, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../_styles/todoStyles';
import AddTodoModal from '../components/AddTodoModal';
import RenameGroupModal from '../components/RenameGroupModal';
import TodoItem from '../components/TodoItem';
import OfflineIndicator from '../components/OfflineIndicator';
import { useTodos } from '../../../hooks/useTodos';
import { useGroups } from '../../../hooks/useGroups';

export default function GroupDetailScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set());
  const { todos, isLoading, addTodo, toggleComplete, deleteTodo, deleteTodos } = useTodos();
  const { groups, renameGroup } = useGroups();
  
  const headerButtonScale = useRef(new Animated.Value(1)).current;

  // Find the current group
  const currentGroup = groups.find(g => g.id === id);

  // Filter todos for this group and sort them
  const groupTodos = useMemo(() => {
    return todos
      .filter(todo => todo.group_id === id)
      .sort((a, b) => {
        // Sort: incomplete first
        if (a.is_completed !== b.is_completed) {
          return a.is_completed - b.is_completed;
        }
        // Then by created_at (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [todos, id]);

  // Group into sections: Active and Completed
  const sections = useMemo(() => {
    const activeTodos = groupTodos.filter(t => t.is_completed === 0);
    const completedTodos = groupTodos.filter(t => t.is_completed === 1);
    
    const result = [];
    if (activeTodos.length > 0) {
      result.push({ title: 'Active', data: activeTodos });
    }
    if (completedTodos.length > 0) {
      result.push({ title: 'Completed', data: completedTodos });
    }
    return result;
  }, [groupTodos]);

  useEffect(() => {
    Animated.spring(headerButtonScale, {
      toValue: selectionMode ? 1.1 : 1,
      useNativeDriver: true,
      tension: 150,
      friction: 7,
    }).start();
  }, [selectionMode]);

  const handleLongPress = (todoId: string) => {
    setSelectionMode(true);
    setSelectedTodoIds(new Set([todoId]));
  };

  const handleSelect = (todoId: string) => {
    setSelectedTodoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(todoId)) {
        newSet.delete(todoId);
      } else {
        newSet.add(todoId);
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

  const handleRename = async (newName: string) => {
    if (id) {
      await renameGroup(id as string, newName);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: currentGroup?.name || 'Group',
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ marginLeft: 16 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#6366F1" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
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
          ) : null}
        </View>
      ),
    });
  }, [navigation, currentGroup, selectionMode, selectedTodoIds, headerButtonScale]);

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

  if (!currentGroup) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyTitle}>Group not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#6366F1', marginTop: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groupTodos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Tasks Yet</Text>
          <Text style={styles.emptySubtitle}>Tap the + button to add a task to this group</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
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

      <TouchableOpacity 
        style={[
          styles.fab, 
          { 
            bottom: 100, // Push up when offline (69 + 36 + 30 spacing)
            backgroundColor: '#F3F4F6',
            width: 48,
            height: 48,
            right: 28, // Centered vertically with the + icon
          }
        ]} 
        onPress={() => setRenameModalVisible(true)}
      >
        <MaterialIcons name="settings" size={20} color="#6366F1" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <AddTodoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addTodo}
        initialGroupId={id as string}
      />

      <RenameGroupModal
        visible={renameModalVisible}
        onClose={() => setRenameModalVisible(false)}
        onRename={handleRename}
        currentName={currentGroup?.name || ''}
      />

      <OfflineIndicator />
    </View>
  );
}

