import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { BusPosition } from '../../types/bus';

interface BusMarkerProps {
  bus: BusPosition;
  onPress?: (bus: BusPosition) => void;
}

export function BusMarker({ bus, onPress }: BusMarkerProps) {
  const getStatusColor = () => {
    switch (bus.status) {
      case 'moving':
        return '#059669'; // Green
      case 'stopped':
        return '#D97706'; // Orange
      case 'offline':
        return '#9CA3AF'; // Gray
      default:
        return '#9CA3AF';
    }
  };

  const getStatusIcon = () => {
    switch (bus.status) {
      case 'moving':
        return 'bus';
      case 'stopped':
        return 'pause';
      case 'offline':
        return 'bus-outline';
      default:
        return 'bus-outline';
    }
  };

  const handlePress = () => {
    onPress?.(bus);
  };

  return (
    <Marker
      coordinate={{
        latitude: bus.latitude,
        longitude: bus.longitude,
      }}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
    >
      <View style={[styles.markerContainer, { backgroundColor: getStatusColor() }]}>
        <Ionicons
          name={getStatusIcon()}
          size={16}
          color="white"
        />
      </View>

      {/* Optional: Show line code as a small badge */}
      {bus.lineCode && (
        <View style={styles.lineCodeBadge}>
          <Text style={styles.lineCodeText}>{bus.lineCode}</Text>
        </View>
      )}
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lineCodeBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  lineCodeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});