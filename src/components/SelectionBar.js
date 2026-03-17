import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function SelectionBar({ count, onForward, onDelete, onCopy, onCancel }) {
  return (
    <View style={[s.bar, {backgroundColor: colors.surface, borderTopColor: colors.glassBorder}]}>
      <TouchableOpacity onPress={onCancel} style={s.btn}>
        <Ionicons name="close" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[s.count, {color: colors.text}]}>{count} выбрано</Text>
      <View style={s.actions}>
        <TouchableOpacity onPress={onCopy} style={s.btn}>
          <Ionicons name="copy-outline" size={20} color={colors.purple} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onForward} style={s.btn}>
          <Ionicons name="arrow-redo-outline" size={20} color={colors.purple} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={s.btn}>
          <Ionicons name="trash-outline" size={20} color={colors.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  btn: { padding: 10 },
  count: { flex: 1, fontSize: 16, fontWeight: '600', marginLeft: 4 },
  actions: { flexDirection: 'row', gap: 4 },
});
