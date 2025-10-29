import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, Animated, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { styles } from './_styles/todoStyles';
import TodoItem from './components/TodoItem';
import OfflineIndicator from './components/OfflineIndicator';
import { useTodos } from '../../hooks/useTodos';
import { useGroups } from '../../hooks/useGroups';
import AddTodoModal from './components/AddTodoModal';

export default function AllTasksScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigation = useNavigation();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set());
  const { todos, isLoading, toggleComplete, deleteTodo, deleteTodos, addTodo } = useTodos();
  const [modalVisible, setModalVisible] = useState(false);
  const { groups } = useGroups();
  
  
  const headerButtonScale = useRef(new Animated.Value(1)).current;

  // Filters & sort
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const statusOptions: Array<'all' | 'active' | 'completed'> = ['all', 'active', 'completed'];

  // Create a map for quick group lookup
  const groupMap = useMemo(() => {
    const map = new Map();
    groups.forEach(group => {
      map.set(group.id, group.name);
    });
    return map;
  }, [groups]);

  // Apply filters
  const filteredTodos = useMemo(() => {
    let list = todos;
    if (selectedGroupId !== 'all') {
      list = list.filter(t => t.group_id === selectedGroupId);
    }
    if (statusFilter === 'active') {
      list = list.filter(t => t.is_completed === 0);
    } else if (statusFilter === 'completed') {
      list = list.filter(t => t.is_completed === 1);
    }
    list = list.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });
    return list;
  }, [todos, selectedGroupId, statusFilter, sortOrder]);

  // Sections: if statusFilter is 'all', split into Active/Completed; else single section
  const sections = useMemo(() => {
    if (statusFilter === 'all') {
      const active = filteredTodos.filter(t => t.is_completed === 0);
      const completed = filteredTodos.filter(t => t.is_completed === 1);
      const result: { title: string; data: typeof filteredTodos }[] = [];
      if (active.length > 0) result.push({ title: 'Active', data: active });
      if (completed.length > 0) result.push({ title: 'Completed', data: completed });
      return result;
    }
    return [{ title: statusFilter === 'active' ? 'Active' : 'Completed', data: filteredTodos }];
  }, [filteredTodos, statusFilter]);

  useEffect(() => {
    Animated.spring(headerButtonScale, {
      toValue: selectionMode ? 1.1 : 1,
      useNativeDriver: true,
      tension: 150,
      friction: 4,
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

  useLayoutEffect(() => {
    navigation.setOptions({
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
  }, [navigation, selectionMode, selectedTodoIds, headerButtonScale]);

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
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* Filters section */}
      <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
        {/* Row 1: Group chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 2, gap: 6 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedGroupId('all')}
            style={{
              paddingHorizontal: 10,
              height: 30,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: selectedGroupId === 'all' ? '#6366F1' : '#F3F4F6',
              borderWidth: 1,
              borderColor: selectedGroupId === 'all' ? '#6366F1' : '#E5E7EB',
            }}
          >
            <Text
              style={{
                color: selectedGroupId === 'all' ? '#FFFFFF' : '#6B7280',
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              All Groups
            </Text>
          </TouchableOpacity>
  
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              onPress={() => setSelectedGroupId(g.id)}
              style={{
                paddingHorizontal: 10,
                height: 30,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: selectedGroupId === g.id ? '#6366F1' : '#F3F4F6',
                borderWidth: 1,
                borderColor: selectedGroupId === g.id ? '#6366F1' : '#E5E7EB',
              }}
            >
              <Text
                style={{
                  color: selectedGroupId === g.id ? '#FFFFFF' : '#6B7280',
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
  
        {/* Row 2: Status + sort chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 4, gap: 6 }}
        >
           {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
               onPress={() => setStatusFilter(status)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                height: 30,
                borderRadius: 16,
                backgroundColor:
                  statusFilter === status ? '#D1FAE5' : '#F3F4F6',
                borderWidth: 1,
                borderColor:
                  statusFilter === status ? '#34D399' : '#E5E7EB',
              }}
            >
              <Text
                style={{
                  color: statusFilter === status ? '#065F46' : '#6B7280',
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
  
          <TouchableOpacity
            onPress={() =>
              setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
            }
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              height: 30,
              borderRadius: 16,
              backgroundColor: '#F3F4F6',
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Text
              style={{ color: '#6B7280', fontWeight: '600', fontSize: 12 }}
            >
              {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
  
      {/* Todo list */}
      {filteredTodos.length === 0 ? (
        <View style={styles.emptyContainer}>
          {statusFilter === 'completed'?(<Text style={styles.emptyTitle}>No Completed Tasks Yet</Text>):(<Text style={styles.emptyTitle}>No Tasks Yet in this group</Text>)}
          {statusFilter === 'completed'?(<Text style={styles.emptySubtitle}>Complete tasks to see them here</Text>):(<Text style={styles.emptySubtitle}>Add a task to get started</Text>)}
        </View>
      ) : (
        <SectionList
          style={{ flex: 1 }}
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
              groupName={groupMap.get(item.group_id || '')}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 12 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Always show Add Todo FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* New Task modal - always show full modal without pre-selection */}
      <AddTodoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addTodo}
      />

      <OfflineIndicator />
    </View>
  );
  
}

