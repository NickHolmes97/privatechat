import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

export default function FormatBar({ onFormat }) {
  const buttons = [
    { label: 'B', style: 'bold', fontWeight: '900' },
    { label: 'I', style: 'italic', fontStyle: 'italic' },
    { label: 'S', style: 'strike', textDecorationLine: 'line-through' },
    { label: '<>', style: 'code', fontFamily: 'monospace' },
    { label: '||', style: 'spoiler' },
  ];

  return (
    <View style={[s.bar, {backgroundColor: colors.surfaceLight}]}>
      {buttons.map(b => (
        <TouchableOpacity key={b.style} style={s.btn} onPress={() => onFormat(b.style)}>
          <Text style={[s.label, {color: colors.text}, b.fontWeight && {fontWeight: b.fontWeight}, b.fontStyle && {fontStyle: b.fontStyle}, b.textDecorationLine && {textDecorationLine: b.textDecorationLine}]}>
            {b.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 2 },
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  label: { fontSize: 15 },
});
