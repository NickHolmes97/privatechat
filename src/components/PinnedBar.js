import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function PinnedBar({ message, onPress, onClose }) {
  if (!message) return null;
  return (
    <TouchableOpacity style={[s.bar, {backgroundColor: colors.surface, borderBottomColor: colors.glassBorder}]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="pin" size={16} color={colors.purple} style={{marginRight: 8}} />
      <View style={s.content}>
        <Text style={[s.label, {color: colors.purple}]}>📌 Закреплённое</Text>
        <Text style={[s.text, {color: colors.textSecondary}]} numberOfLines={1}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={s.closeBtn}>
        <Ionicons name="close" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  content: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600' },
  text: { fontSize: 13, marginTop: 1 },
  closeBtn: { padding: 6 },
});
