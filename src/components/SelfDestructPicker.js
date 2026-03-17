import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

const TIMERS = [
  { label: 'Выкл', value: 0 },
  { label: '5 секунд', value: 5 },
  { label: '30 секунд', value: 30 },
  { label: '1 минута', value: 60 },
  { label: '5 минут', value: 300 },
  { label: '1 час', value: 3600 },
  { label: '1 день', value: 86400 },
  { label: '1 неделя', value: 604800 },
];

export default function SelfDestructPicker({ visible, current, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.sheet, {backgroundColor: colors.surface}]}>
          <View style={s.header}>
            <Ionicons name="timer-outline" size={24} color={colors.purple} />
            <Text style={[s.title, {color: colors.text}]}>Автоудаление</Text>
          </View>
          <Text style={[s.subtitle, {color: colors.textSecondary}]}>
            Сообщения будут удалены после прочтения
          </Text>
          {TIMERS.map(t => (
            <TouchableOpacity key={t.value} style={[s.item, current === t.value && {backgroundColor: colors.purple + '15'}]}
              onPress={() => onSelect(t.value)}>
              <Text style={[s.itemText, {color: colors.text}]}>{t.label}</Text>
              {current === t.value && <Ionicons name="checkmark" size={20} color={colors.purple} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={{color: colors.red, fontSize: 16, fontWeight: '600'}}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: { borderRadius: 20, width: '100%', maxWidth: 340, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginBottom: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 2 },
  itemText: { fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
});
