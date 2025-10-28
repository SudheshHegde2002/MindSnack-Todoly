import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles/todoStyles';
import AddTodoModal from './components/AddTodoModal';
import SettingsModal from './components/SettingsModal';
import TodoItem, { Todo } from './components/TodoItem';

export default function CompletedScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setSettingsVisible(true)}
          style={{ marginRight: 16 }}
        >
          <MaterialIcons name="settings" size={24} color="#6366F1" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const handleAddTodo = (title: string, description: string, group: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      description,
      group,
      completed: false,
      createdAt: new Date(),
    };
    setTodos((prev) => [newTodo, ...prev]);
  };

  const handleToggleComplete = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const completedTodos = todos.filter((todo) => todo.completed);

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
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTodo}
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
        onAdd={handleAddTodo}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}

