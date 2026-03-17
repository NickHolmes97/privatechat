import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function OnlineDot({ online, size = 12 }) {
  if (!online) return null;
  return <View style={[s.dot, {width: size, height: size, borderRadius: size/2}]} />;
}

const s = StyleSheet.create({
  dot: { backgroundColor: '#34C759', position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#050508' },
});
