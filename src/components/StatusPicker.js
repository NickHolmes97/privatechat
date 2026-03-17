import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import { colors } from '../utils/theme';

const PRESETS = [
  { emoji: '🟢', text: 'Доступен' },
  { emoji: '🔴', text: 'Не беспокоить' },
  { emoji: '🌙', text: 'Сплю' },
  { emoji: '🏠', text: 'Дома' },
  { emoji: '💼', text: 'На работе' },
  { emoji: '🎮', text: 'Играю' },
  { emoji: '🎧', text: 'Слушаю музыку' },
  { emoji: '📚', text: 'Учусь' },
  { emoji: '✈️', text: 'В пути' },
  { emoji: '🤒', text: 'Болею' },
];

export default function StatusPicker({ visible, onSet, onClose }) {
  const [custom, setCustom] = useState('');
  const [emoji, setEmoji] = useState('😊');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={[s.sheet, {backgroundColor: colors.surface}]}>
          <View style={s.handle} />
          <Text style={[s.title, {color: colors.text}]}>Установить статус</Text>
          <View style={[s.inputRow, {backgroundColor: colors.surfaceLight}]}>
            <Text style={s.emoji}>{emoji}</Text>
            <TextInput
              style={[s.input, {color: colors.text}]}
              placeholder="Ваш статус..."
              placeholderTextColor={colors.textSecondary}
              value={custom}
              onChangeText={setCustom}
              maxLength={50}
            />
          </View>
          <TouchableOpacity style={[s.setBtn, {backgroundColor: colors.purple}]}
            onPress={() => onSet({ emoji: custom ? emoji : '', text: custom })}>
            <Text style={s.setBtnText}>Установить</Text>
          </TouchableOpacity>
          <Text style={[s.sectionLabel, {color: colors.textSecondary}]}>Быстрый выбор</Text>
          {PRESETS.map((p, i) => (
            <TouchableOpacity key={i} style={s.preset} onPress={() => onSet(p)}>
              <Text style={s.presetEmoji}>{p.emoji}</Text>
              <Text style={[s.presetText, {color: colors.text}]}>{p.text}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={{color: colors.red, fontWeight: '600'}}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, paddingTop: 12, maxHeight: '80%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', paddingHorizontal: 20, marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  emoji: { fontSize: 24, marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  setBtn: { marginHorizontal: 20, marginTop: 12, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  setBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 8, paddingHorizontal: 20 },
  preset: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  presetEmoji: { fontSize: 20, marginRight: 14 },
  presetText: { fontSize: 15 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
});
