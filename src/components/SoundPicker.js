import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import * as Haptics from 'expo-haptics';

const SOUNDS = [
  { id: 'default', name: 'По умолчанию', icon: 'notifications' },
  { id: 'ding', name: 'Дзинь', icon: 'musical-note' },
  { id: 'pop', name: 'Поп', icon: 'ellipse' },
  { id: 'chime', name: 'Колокольчик', icon: 'notifications-outline' },
  { id: 'swoosh', name: 'Свист', icon: 'arrow-forward' },
  { id: 'bubble', name: 'Пузырь', icon: 'chatbubble' },
  { id: 'none', name: 'Без звука', icon: 'volume-mute' },
];

export default function SoundPicker({ visible, current, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.sheet, {backgroundColor: colors.surface}]}>
          <Text style={[s.title, {color: colors.text}]}>Звук уведомлений</Text>
          {SOUNDS.map(snd => (
            <TouchableOpacity key={snd.id} style={[s.item, current === snd.id && {backgroundColor: colors.purple + '15'}]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(snd.id); }}>
              <Ionicons name={snd.icon} size={20} color={current === snd.id ? colors.purple : colors.textSecondary} style={{marginRight: 14}} />
              <Text style={[s.label, {color: colors.text}]}>{snd.name}</Text>
              {current === snd.id && <Ionicons name="checkmark" size={20} color={colors.purple} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={{color: colors.red, fontWeight: '600'}}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: { borderRadius: 20, width: '100%', maxWidth: 340, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10 },
  label: { flex: 1, fontSize: 15 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
});
