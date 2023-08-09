import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const HomeScreen = ({ handleJoinPress }) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity
        onPress={handleJoinPress}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: '#2471ED',
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 20, color: '#ffffff' }}>Join Room</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
