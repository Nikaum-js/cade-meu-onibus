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
        return '#10b981'; // Verde para em movimento
      case 'stopped':
        return '#f59e0b'; // Amarelo para parado
      case 'offline':
        return '#9ca3af'; // Cinza para offline
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'moving':
        return 'bus'; // Ônibus em movimento
      case 'stopped':
        return 'pause-circle'; // Ônibus parado
      case 'offline':
        return 'moon'; // Ônibus offline
      default:
        return 'bus';
    }
  };

  const CustomMarker = () => (
    <View className="items-center">
      {/* Marker principal */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center shadow-xl border-2 border-white"
        style={{
          backgroundColor: getStatusColor(bus.status),
          elevation: 8, // Sombra para Android
        }}
      >
        <Ionicons
          name={getStatusIcon(bus.status) as any}
          size={20}
          color="white"
        />
      </View>

      {/* Número do ônibus */}
      <View className="absolute -bottom-6 bg-white px-2 py-1 rounded-lg shadow-md border border-gray-200">
        <Text className="text-xs font-bold text-gray-800">
          {bus.id.split('-')[0]}
        </Text>
      </View>

      {/* Indicador de ponto */}
      <View
        className="w-2 h-2 rounded-full mt-1"
        style={{ backgroundColor: getStatusColor(bus.status) }}
      />
    </View>
  );

  return (
    <Marker
      coordinate={{
        latitude: bus.latitude,
        longitude: bus.longitude,
      }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.8 }}
      centerOffset={{ x: 0, y: -30 }}
    >
      <CustomMarker />
    </Marker>
  );
}