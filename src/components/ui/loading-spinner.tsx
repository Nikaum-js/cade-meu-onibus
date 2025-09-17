import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  overlay?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  message = 'Carregando...',
  overlay = false,
}: LoadingSpinnerProps) {
  const containerClasses = overlay
    ? 'absolute top-0 left-0 right-0 bottom-0 bg-gray-800/50 items-center justify-center z-50'
    : 'items-center justify-center p-8';

  return (
    <View className={containerClasses}>
      <ActivityIndicator size={size} color="#b91c1c" />
      {message && (
        <Text className="mt-5 text-base text-white text-center font-semibold">
          {message}
        </Text>
      )}
    </View>
  );
}