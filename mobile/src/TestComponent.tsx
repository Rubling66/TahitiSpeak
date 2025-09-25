import React, { useState } from 'react';
import { View, Text } from 'react-native';

export default function TestComponent() {
  const [count, setCount] = useState(0);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Test Component</Text>
      <Text>Count: {count}</Text>
      <Text onPress={() => setCount(count + 1)} style={{ color: 'blue', marginTop: 10 }}>
        Increment
      </Text>
    </View>
  );
}