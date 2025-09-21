import React from 'react';
import { View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { BusPosition } from '../../types/bus';

interface BusMarkerProps {
  bus: BusPosition;
  onPress?: () => void;
}

export function BusMarker({ bus, onPress }: BusMarkerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving':
        return '#b91c1c'; // Vermelho vinho SPTrans - em movimento
      case 'stopped':
        return '#991b1b'; // Vermelho vinho mais escuro - parado
      case 'offline':
        return '#9ca3af'; // Cinza - offline
      default:
        return '#b91c1c'; // Vermelho vinho padrão
    }
  };

  return (
    <Marker
      coordinate={{
        latitude: bus.latitude,
        longitude: bus.longitude,
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: getStatusColor(bus.status),
          borderWidth: 2,
          borderColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Ionicons
          name="bus"
          size={18}
          color="white"
        />
      </View>
    </Marker>
  );
}