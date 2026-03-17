import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

const ACTIONS = [
  { icon: 'person-remove-outline', label: 'Кикнуть', color: '#FF6B6B', key: 'kick' },
  { icon: 'ban-outline', label: 'Забанить', color: '#FF3B30', key: 'ban' },
  { icon: 'volume-mute-outline', label: 'Заглушить', color: '#FFA500', key: 'mute' },
  { icon: 'shield-outline', label: 'Сделать админом', color: '#34C759', key: 'admin' },
  { icon: 'create-outline', label: 'Изменить имя группы', color: '#7C6AEF', key: 'rename' },
  { icon: 'image-outline', label: 'Изменить фото группы', color: '#00B4D8', key: 'photo' },
  { icon: 'lock-closed-outline', label: 'Только админы пишут', color: '#E84393', key: 'readonly' },
];

export default function AdminPanel({ visible, onAction, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={[s.sheet, {backgroundColor: colors.surface}]}>
          <View style={s.handle} />
          <Text style={[s.title, {color: colors.text}]}>Управление</Text>
          {ACTIONS.map(a => (
            <TouchableOpacity key={a.key} style={s.item} onPress={() => onAction(a.key)} activeOpacity={0.7}>
              <View style={[s.iconWrap, {backgroundColor: a.color + '20'}]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={[s.label, {color: colors.text}]}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={{color: colors.red, fontWeight: '600', fontSize: 16}}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  label: { flex: 1, fontSize: 15 },
  cancelBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
});
