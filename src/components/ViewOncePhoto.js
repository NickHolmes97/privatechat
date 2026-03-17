import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function ViewOncePhoto({ uri, onViewed }) {
  const [opened, setOpened] = useState(false);
  const [viewed, setViewed] = useState(false);

  if (viewed) {
    return (
      <View style={s.viewed}>
        <Ionicons name="eye-off-outline" size={24} color={colors.textSecondary} />
        <Text style={[s.viewedText, {color: colors.textSecondary}]}>Фото просмотрено</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity style={[s.card, {backgroundColor: colors.surfaceLight, borderColor: colors.glassBorder}]}
        onPress={() => setOpened(true)}>
        <View style={s.blurPreview}>
          <Ionicons name="eye-outline" size={28} color={colors.purple} />
          <Text style={[s.tapText, {color: colors.text}]}>Нажмите для просмотра</Text>
          <Text style={[s.onceText, {color: colors.textSecondary}]}>Одноразовое фото</Text>
        </View>
      </TouchableOpacity>
      <Modal visible={opened} transparent animationType="fade">
        <TouchableOpacity style={s.fullscreen} activeOpacity={1}
          onPress={() => { setOpened(false); setViewed(true); if (onViewed) onViewed(); }}>
          <Image source={{uri}} style={s.fullImg} resizeMode="contain" />
          <Text style={s.hint}>Нажмите чтобы закрыть</Text>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', width: 200 },
  blurPreview: { width: 200, height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(124,106,239,0.08)' },
  tapText: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  onceText: { fontSize: 11, marginTop: 4 },
  viewed: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  viewedText: { fontSize: 13 },
  fullscreen: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullImg: { width: '100%', height: '80%' },
  hint: { color: 'rgba(255,255,255,0.5)', position: 'absolute', bottom: 60, fontSize: 14 },
});
