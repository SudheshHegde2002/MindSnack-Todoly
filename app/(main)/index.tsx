import { useAuth } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Animated, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles/todoStyles';
import SettingsModal from './components/SettingsModal';
import { useGroups } from '../../hooks/useGroups';
import { LocalGroup } from '../../services/database';

export default function HomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const { groups, isLoading, addGroup, deleteGroup } = useGroups();
  
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
    Alert.prompt(
      'Create Group',
      'Enter a name for your group',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (text) => {
            if (text && text.trim()) {
              await addGroup(text.trim());
            }
          },
        },
      ],
      'plain-text'
    );
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
          ) : (
            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
              <MaterialIcons name="settings" size={24} color="#6366F1" />
            </TouchableOpacity>
          )}
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

    return (
      <TouchableOpacity
        style={[
          styles.container,
          { marginHorizontal: 16, marginBottom: 12, padding: 20 },
          selectionMode && { borderWidth: 2, borderColor: '#E5E7EB' },
          isSelected && { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {selectionMode && (
            <MaterialIcons 
              name={isSelected ? "check-box" : "check-box-outline-blank"} 
              size={24} 
              color={isSelected ? "#6366F1" : "#D1D5DB"}
              style={{ marginRight: 12 }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 }}>
              {item.name}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>
              Tap to view tasks
            </Text>
          </View>
          {!selectionMode && (
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          )}
        </View>
      </TouchableOpacity>
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

      <TouchableOpacity style={styles.fab} onPress={handleCreateGroup}>
        <MaterialIcons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}

