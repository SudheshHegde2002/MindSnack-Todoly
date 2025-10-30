import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 12,
          paddingTop: 12,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FAFAFA',
        },
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: '700',
          color: '#1A1A1A',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Todo-ly',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="all-tasks"
        options={{
          title: 'All Tasks',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="completed"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="group/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="components/AddTodoModal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="components/TodoItem"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="components/SettingsModal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="components/GroupItem"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="components/AddGroupModal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="components/RenameGroupModal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="components/OfflineIndicator"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
       name="_styles/addTodoModalStyles"
       options={{
        href: null,
       }}
      />
      <Tabs.Screen
       name="_styles/todoStyles"
       options={{
        href: null,
       }}
      />
      <Tabs.Screen
       name="_styles/settingsModalStyles"
       options={{
        href: null,
       }}
      />
      <Tabs.Screen
       name="_styles/todoItemStyles"
       options={{
        href: null,
       }}
       />
      <Tabs.Screen
       name="_styles/homeStyles"
       options={{
        href: null,
       }}
      />
    </Tabs>
  );
}

