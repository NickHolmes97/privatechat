import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function NotificationsScreen({ navigation }) {
  const [messages, setMessages] = useState(true);
  const [groups, setGroups] = useState(true);
  const [channels, setChannels] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [preview, setPreview] = useState(true);

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.text}]}>Уведомления</Text>
        <View style={{width:44}} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>Личные сообщения</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <Row label="Уведомления" right={<Switch value={messages} onValueChange={setMessages} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
          <View style={s.divider} />
          <Row label="Предпросмотр" right={<Switch value={preview} onValueChange={setPreview} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
        </View>

        <Text style={s.sectionTitle}>Группы</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <Row label="Уведомления" right={<Switch value={groups} onValueChange={setGroups} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
        </View>

        <Text style={s.sectionTitle}>Каналы</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <Row label="Уведомления" right={<Switch value={channels} onValueChange={setChannels} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
        </View>

        <Text style={s.sectionTitle}>Общие</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <Row label="Звуки" right={<Switch value={sounds} onValueChange={setSounds} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
          <View style={s.divider} />
          <Row label="Вибрация" right={<Switch value={vibration} onValueChange={setVibration} trackColor={{true: colors.purple}} thumbColor="#fff" />} />
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

function Row({ label, right }) {
  return (
    <View style={rs.row}>
      <Text style={rs.label}>{label}</Text>
      {right}
    </View>
  );
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
