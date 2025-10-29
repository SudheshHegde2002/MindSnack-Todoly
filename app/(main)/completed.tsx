import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, SectionList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useLayoutEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles/todoStyles';
import AddTodoModal from './components/AddTodoModal';
import SettingsModal from './components/SettingsModal';
import TodoItem from './components/TodoItem';
import { useTodos } from '../../hooks/useTodos';
import { useGroups } from '../../hooks/useGroups';

export default function CompletedScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { todos, isLoading, isOnline, addTodo, toggleComplete, deleteTodo } = useTodos();
  const { groups } = useGroups();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
          {!isOnline && (
            <MaterialIcons name="cloud-off" size={20} color="#EF4444" style={{ marginRight: 12 }} />
          )}
          <TouchableOpacity onPress={() => setSettingsVisible(true)}>
            <MaterialIcons name="settings" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isOnline]);

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

  const completedTodos = todos.filter((todo) => todo.is_completed === 1);

  // Group todos by group_id
  const groupedTodos = useMemo(() => {
    const sections: { title: string; data: typeof todos }[] = [];
    
    groups.forEach((group) => {
      const groupTodos = completedTodos.filter((todo) => todo.group_id === group.id);
      if (groupTodos.length > 0) {
        sections.push({
          title: group.name,
          data: groupTodos,
        });
      }
    });
    
    // Handle todos without a group (orphaned todos)
    const orphanedTodos = completedTodos.filter((todo) => 
      !todo.group_id || !groups.some(g => g.id === todo.group_id)
    );
    if (orphanedTodos.length > 0) {
      sections.push({
        title: 'Uncategorized',
        data: orphanedTodos,
      });
    }
    
    return sections;
  }, [completedTodos, groups]);

  return (
    <View style={styles.container}>
      {completedTodos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Completed Tasks</Text>
          <Text style={styles.emptySubtitle}>Complete tasks to see them here</Text>
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
