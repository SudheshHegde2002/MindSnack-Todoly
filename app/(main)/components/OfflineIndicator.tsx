import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  if (isOnline) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0, // Direct contact with dock (70px dock - 1px to overlap border)
        left: 0,
        right: 0,
        backgroundColor: '#FCD34D',
        paddingVertical: 4,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <MaterialIcons name="wifi-off" size={14} color="#78350F" style={{ marginRight: 6 }} />
      <Text style={{ color: '#78350F', fontSize: 12, fontWeight: '600' }}>
        Todos will sync once internet connection is restored
      </Text>
    </View>
  );
}

// Export hook to check if offline (for adjusting FAB positions)
export function useIsOffline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  return !isOnline;
}

