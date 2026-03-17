import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

const QUICK = [
  { label: 'Через 1 час', hours: 1 },
  { label: 'Через 3 часа', hours: 3 },
  { label: 'Завтра в 9:00', hours: -1 },
  { label: 'Завтра в 18:00', hours: -2 },
];

export default function SchedulePicker({ visible, onSchedule, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.sheet, {backgroundColor: colors.surface}]}>
          <View style={s.header}>
            <Ionicons name="time-outline" size={24} color={colors.purple} />
            <Text style={[s.title, {color: colors.text}]}>Запланировать</Text>
          </View>
          {QUICK.map((q, i) => {
            let date;
            if (q.hours === -1) {
              date = new Date(); date.setDate(date.getDate() + 1); date.setHours(9, 0, 0, 0);
            } else if (q.hours === -2) {
              date = new Date(); date.setDate(date.getDate() + 1); date.setHours(18, 0, 0, 0);
            } else {
              date = new Date(Date.now() + q.hours * 3600000);
            }
            const timeStr = date.toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'});
            const dateStr = date.toLocaleDateString('ru', {day:'numeric',month:'short'});
            return (
              <TouchableOpacity key={i} style={s.item} onPress={() => onSchedule(date)}>
                <Text style={[s.itemLabel, {color: colors.text}]}>{q.label}</Text>
                <Text style={[s.itemTime, {color: colors.textSecondary}]}>{dateStr} {timeStr}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={s.customBtn} onPress={() => Alert.alert('', 'Выбор даты скоро!')}>
            <Ionicons name="calendar-outline" size={18} color={colors.purple} />
            <Text style={{color: colors.purple, marginLeft: 8, fontWeight: '600'}}>Выбрать дату</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={{color: colors.red, fontWeight: '600'}}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: { borderRadius: 20, width: '100%', maxWidth: 340, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 10 },
  itemLabel: { fontSize: 15 },
  itemTime: { fontSize: 13 },
  customBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
});
