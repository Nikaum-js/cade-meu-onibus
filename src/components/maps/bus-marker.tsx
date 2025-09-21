import React from 'react';
import { View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
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

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'moving':
        return '🚌'; // Ônibus em movimento
      case 'stopped':
        return '🛑'; // Ônibus parado
      case 'offline':
        return '💤'; // Ônibus offline
      default:
        return '🚌';
    }
  };

  const CustomMarker = () => (
    <View className="items-center">
      {/* Marker principal */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center shadow-lg border-2 border-white"
        style={{ backgroundColor: getStatusColor(bus.status) }}
      >
        <Text className="text-lg">{getStatusEmoji(bus.status)}</Text>
      </View>

      {/* Sombra/base do marcador */}
      <View
        className="w-3 h-3 rounded-full mt-1 opacity-30"
        style={{ backgroundColor: getStatusColor(bus.status) }}
      />

      {/* Linha de conexão */}
      <View
        className="w-0.5 h-2 -mt-1"
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
      anchor={{ x: 0.5, y: 1 }}
      centerOffset={{ x: 0, y: -24 }}
    >
      <CustomMarker />
    </Marker>
  );
}