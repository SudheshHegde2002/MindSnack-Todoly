import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles/todoStyles';
import AddTodoModal from './components/AddTodoModal';
import SettingsModal from './components/SettingsModal';
import TodoItem from './components/TodoItem';
import { useTodos } from '../../hooks/useTodos';

export default function CompletedScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { todos, isLoading, isOnline, addTodo, toggleComplete, deleteTodo } = useTodos();

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

  return (
    <View style={styles.container}>
      {completedTodos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Completed Tasks</Text>
          <Text style={styles.emptySubtitle}>Complete tasks to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={completedTodos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onToggleComplete={toggleComplete}
              onDelete={deleteTodo}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
