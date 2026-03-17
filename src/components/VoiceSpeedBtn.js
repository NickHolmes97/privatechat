import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

export default function VoiceSpeedBtn({ speed, onPress }) {
  return (
    <TouchableOpacity style={[s.btn, {backgroundColor: colors.purple + '20'}]} onPress={onPress}>
      <Text style={[s.text, {color: colors.purple}]}>{speed}x</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 6 },
  text: { fontSize: 12, fontWeight: '700' },
});
