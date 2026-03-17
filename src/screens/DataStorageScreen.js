import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function DataStorageScreen({ navigation }) {
  const [autoDownloadImages, setAutoDownloadImages] = useState(true);
  const [autoDownloadVideo, setAutoDownloadVideo] = useState(false);
  const [autoDownloadFiles, setAutoDownloadFiles] = useState(false);
  const [saveToGallery, setSaveToGallery] = useState(false);

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.text}]}>Данные и память</Text>
        <View style={{width:44}} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>Автозагрузка медиа</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <Row label="Фото" right={<Switch value={autoDownloadImages} onValueChange={setAutoDownloadImages} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
          <View style={s.divider} />
          <Row label="Видео" right={<Switch value={autoDownloadVideo} onValueChange={setAutoDownloadVideo} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
          <View style={s.divider} />
          <Row label="Файлы" right={<Switch value={autoDownloadFiles} onValueChange={setAutoDownloadFiles} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
        </View>

        <Text style={s.sectionTitle}>Сохранение</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <Row label="Сохранять в галерею" right={<Switch value={saveToGallery} onValueChange={setSaveToGallery} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
        </View>

        <Text style={s.sectionTitle}>Хранилище</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <TouchableOpacity style={rs.row} onPress={() => Alert.alert('', 'Кэш очищен')}>
            <Text style={rs.label}>Очистить кэш</Text>
            <Text style={{color: colors.textSecondary, fontSize: 14}}>Рассчитать...</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

function Row({ label, right }) {
  return (<View style={rs.row}><Text style={rs.label}>{label}</Text>{right}</View>);
}
const rs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  label: { color: '#fff', fontSize: 16, flex: 1 },
});
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 8 },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  scroll: { flex: 1 },
  sectionTitle: { color: colors.purple, fontSize: 14, fontWeight: '600', marginTop: 24, marginBottom: 6, marginLeft: 20 },
  card: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginLeft: 16 },
});
