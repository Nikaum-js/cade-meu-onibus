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
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 60,
      height: 80,
      paddingTop: 5,
    }}>
      {/* Marker principal */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: getStatusColor(bus.status),
          borderWidth: 3,
          borderColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 8,
        }}
      >
        <Ionicons
          name={getStatusIcon(bus.status) as any}
          size={26}
          color="white"
        />
      </View>

      {/* Número do ônibus */}
      <View
        style={{
          position: 'absolute',
          top: 55,
          backgroundColor: 'white',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          minWidth: 32,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 3,
        }}
      >
        <Text style={{
          fontSize: 11,
          fontWeight: 'bold',
          color: '#374151',
          textAlign: 'center',
        }}>
          {bus.id.split('-')[0]}
        </Text>
      </View>

      {/* Indicador de ponto */}
      <View
        style={{
          position: 'absolute',
          top: 75,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: getStatusColor(bus.status),
        }}
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
      anchor={{ x: 0.5, y: 0.9 }}
      centerOffset={{ x: 0, y: -40 }}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CustomMarker />
    </Marker>
  );
}