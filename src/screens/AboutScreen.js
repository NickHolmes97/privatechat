import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import matrix from '../services/matrix';

export default function AboutScreen({ navigation }) {
  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.text}]}>О приложении</Text>
        <View style={{width:44}} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logo}><Ionicons name="chatbubbles" size={40} color="#fff" /></View>
          <Text style={s.appName}>PrivateChat</Text>
          <Text style={s.version}>Версия 1.1.0</Text>
        </View>

        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <InfoRow label="Версия" value="1.1.0" />
          <View style={s.divider} />
          <InfoRow label="Сервер" value="45.83.178.10" />
          <View style={s.divider} />
          <InfoRow label="Протокол" value="Matrix" />
          <View style={s.divider} />
          <InfoRow label="Шифрование" value="Активно" valueColor="#51CF66" />
          <View style={s.divider} />
          <InfoRow label="ID устройства" value={matrix.getDeviceId() || '—'} />
          <View style={s.divider} />
          <InfoRow label="Платформа" value="React Native + Expo" />
        </View>

        <Text style={s.footer}>Безопасный мессенджер на базе Matrix.{'\n'}Ваши данные — только ваши.</Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <View style={ir.row}>
      <Text style={ir.label}>{label}</Text>
      <Text style={[ir.value, valueColor && {color: valueColor}]}>{value}</Text>
    </View>
  );
}
const ir = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  label: { color: '#fff', fontSize: 16, flex: 1 },
  value: { color: colors.textSecondary, fontSize: 14 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 8 },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  scroll: { flex: 1 },
  content: { alignItems: 'center' },
  logoWrap: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  logo: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  version: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  card: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden', width: '100%', maxWidth: 400 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginLeft: 16 },
  footer: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 20, paddingHorizontal: 40 },
});
