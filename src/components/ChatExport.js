import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function ChatExport({ visible, roomName, messages, onClose }) {
  const exportText = () => {
    const text = messages.map(m => {
      const time = new Date(m.ts).toLocaleString('ru');
      return '[' + time + '] ' + (m.senderName || m.sender) + ': ' + (m.body || '(медиа)');
    }).join('\n');
    
    Share.share({
      message: 'Экспорт чата: ' + roomName + '\n\n' + text,
      title: 'Экспорт ' + roomName,
    });
    onClose();
  };

  const exportJson = () => {
    Alert.alert('', 'Экспорт в JSON скоро!');
    onClose();
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.sheet, {backgroundColor: colors.surface}]}>
          <Text style={[s.title, {color: colors.text}]}>Экспорт чата</Text>
          <Text style={[s.subtitle, {color: colors.textSecondary}]}>{roomName} · {messages.length} сообщений</Text>
          <TouchableOpacity style={[s.btn, {borderColor: colors.glassBorder}]} onPress={exportText}>
            <Ionicons name="document-text-outline" size={24} color={colors.purple} />
            <View style={s.btnInfo}>
              <Text style={[s.btnTitle, {color: colors.text}]}>Текстовый файл</Text>
              <Text style={[s.btnDesc, {color: colors.textSecondary}]}>Простой текст через Share</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, {borderColor: colors.glassBorder}]} onPress={exportJson}>
            <Ionicons name="code-outline" size={24} color={colors.purple} />
            <View style={s.btnInfo}>
              <Text style={[s.btnTitle, {color: colors.text}]}>JSON</Text>
              <Text style={[s.btnDesc, {color: colors.textSecondary}]}>Структурированный экспорт</Text>
            </View>
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
  sheet: { borderRadius: 20, width: '100%', maxWidth: 340, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  btnInfo: { flex: 1 },
  btnTitle: { fontSize: 15, fontWeight: '600' },
  btnDesc: { fontSize: 12, marginTop: 2 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
});
