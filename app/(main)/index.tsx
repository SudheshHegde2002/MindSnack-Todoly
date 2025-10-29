import { useAuth } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Animated, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles/todoStyles';
import AddGroupModal from './components/AddGroupModal';
import OfflineIndicator from './components/OfflineIndicator';
import { useGroups } from '../../hooks/useGroups';
import { useTodos } from '../../hooks/useTodos';
import { LocalGroup } from '../../services/database';

export default function HomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [addGroupVisible, setAddGroupVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const { groups, isLoading, deleteGroup } = useGroups();
  const { todos } = useTodos();
  
  const headerButtonScale = useRef(new Animated.Value(1)).current;
  // Animation for group cards
  const groupCardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(groupCardScale, {
      toValue: selectionMode ? 0.95 : 1,
      useNativeDriver: true,
      tension: 150,
      friction: 4,
    }).start();
  }, [selectionMode]);

  const handleLongPress = (id: string) => {
    setSelectionMode(true);
    setSelectedGroupIds(new Set([id]));
  };

  const handleSelect = (id: string) => {
    setSelectedGroupIds(prev => {
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
    if (selectedGroupIds.size === 0) return;

    Alert.alert(
      'Delete Groups',
      `Are you sure you want to delete ${selectedGroupIds.size} group${selectedGroupIds.size > 1 ? 's' : ''}? All tasks in these groups will also be deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Promise.all(Array.from(selectedGroupIds).map(id => deleteGroup(id)));
            setSelectedGroupIds(new Set());
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedGroupIds(new Set());
  };

  const handleCreateGroup = () => {
    setAddGroupVisible(true);
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
                  {selectedGroupIds.size} selected
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
  }, [navigation, selectionMode, selectedGroupIds, headerButtonScale]);

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

  const renderGroupItem = ({ item }: { item: LocalGroup }) => {
    const isSelected = selectedGroupIds.has(item.id);
    // Calculate task counts for this group
    const groupTodos = todos.filter(t => t.group_id === item.id);
    const activeCount = groupTodos.filter(t => t.is_completed === 0).length;
    const completedCount = groupTodos.filter(t => t.is_completed === 1).length;
    const hasNoTasks = activeCount === 0 && completedCount === 0;

    return (
      <Animated.View style={{ transform: [{ scale: selectionMode ? groupCardScale : 1 }]}}>
        <TouchableOpacity
          style={[
            {
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              marginHorizontal: 0,
              marginBottom: 12,
              padding: 16,
              width: '100%'
            },
            selectionMode && { borderWidth: 2, borderColor: '#E5E7EB' },
            isSelected && { backgroundColor: '#EEF2FF', borderColor: '#6366F1', borderWidth: 2 },
          ]}
          onPress={() => {
            if (selectionMode) {
              handleSelect(item.id);
            } else {
              router.push(`/(main)/group/${item.id}`);
            }
          }}
          onLongPress={() => handleLongPress(item.id)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {selectionMode && (
              <MaterialIcons 
                name={isSelected ? "check-box" : "check-box-outline-blank"} 
                size={24} 
                color={isSelected ? "#6366F1" : "#D1D5DB"}
                style={{ marginRight: 12, marginTop: 2 }}
              />
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A', flex: 1 }}>
                  {item.name}
                </Text>
                {!selectionMode && (
                  <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
                )}
              </View>
              {hasNoTasks ? (
                <Text style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 6 }}>
                  No tasks, Add now!
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="radio-button-unchecked" size={14} color="#6366F1" />
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>
                      {activeCount} active
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="check-circle" size={14} color="#10B981" />
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>
                      {completedCount} completed
                    </Text>
                  </View>
                </View>
              )}
              {item.synced === 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <MaterialIcons name="sync" size={12} color="#EF4444" />
                  <Text style={{ fontSize: 11, color: '#EF4444', fontStyle: 'italic' }}>
                    Pending sync
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="folder-open" size={64} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Create Your First Group</Text>
          <Text style={styles.emptySubtitle}>Groups help you organize your tasks</Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#6366F1',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 24,
            }}
            onPress={handleCreateGroup}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              Create Group
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={handleCreateGroup}
      >
        <MaterialIcons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <AddGroupModal
        visible={addGroupVisible}
        onClose={() => setAddGroupVisible(false)}
      />

      <OfflineIndicator />
    </View>
  );
}

