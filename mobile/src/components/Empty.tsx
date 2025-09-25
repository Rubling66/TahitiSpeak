import React from 'react';
import { View, Text } from 'react-native';

// Empty component
export default function Empty() {
  return (
    <View style={{
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Text>Empty</Text>
    </View>
  );
}