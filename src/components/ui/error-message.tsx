import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
  showIcon?: boolean;
}

export function ErrorMessage({
  message,
  onRetry,
  retryText = 'Tentar novamente',
  showIcon = true,
}: ErrorMessageProps) {
  return (
    <View className="items-center justify-center p-6 bg-white rounded-2xl shadow-lg border border-red-100">
      {showIcon && (
        <View className="w-14 h-14 rounded-full bg-red-50 items-center justify-center mb-4">
          <Ionicons name="warning" size={32} color="#f59e0b" />
        </View>
      )}

      <Text className="text-base text-gray-800 text-center mb-5 leading-6 font-medium">
        {message}
      </Text>

      {onRetry && (
        <TouchableOpacity
          className="flex-row items-center bg-primary-500 px-6 py-3 rounded-xl shadow-sm"
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={16} color="white" />
          <Text className="text-white text-base font-bold ml-2">
            {retryText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}