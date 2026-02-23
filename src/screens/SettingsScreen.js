import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clearSession } from '../services/storage';
import matrix from '../services/matrix';
import { colors } from '../utils/theme';

export default function SettingsScreen({ navigation, onLogout }) {
  const uid = matrix.getUserId() || '';
  const name = uid.split(':')[0]?.replace('@','') || '';

  const doLogout = () => {
    Alert.alert('Выход', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: async () => { await clearSession(); matrix.logout(); onLogout(); } }
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>Настройки</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity style={s.profileCard} onPress={() => navigation.navigate('Profile')}>
          <View style={s.avatar}><Text style={s.avatarText}>{name[0]?.toUpperCase()}</Text></View>
          <View style={{flex:1}}>
            <Text style={s.profileName}>{name}</Text>
            <Text style={s.profileUid}>{uid}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={s.section}>ВНЕШНИЙ ВИД</Text>
        <SettingRow icon="color-palette" title="Тема" subtitle="Тёмная" />
        <SettingRow icon="text" title="Размер текста" subtitle="Стандартный" />

        <Text style={s.section}>УВЕДОМЛЕНИЯ</Text>
        <SettingRow icon="notifications" title="Уведомления" subtitle="Включены" />

        <Text style={s.section}>БЕЗОПАСНОСТЬ</Text>
        <SettingRow icon="lock-closed" title="PIN-код" subtitle="Не установлен" />
        <SettingRow icon="eye-off" title="Конфиденциальность" subtitle="Все" />
        <SettingRow icon="shield-checkmark" title="Шифрование" subtitle="Сквозное" />

        <Text style={s.section}>О ПРИЛОЖЕНИИ</Text>
        <SettingRow icon="information-circle" title="Версия" subtitle="PrivateChat RN v1.0" />
        <SettingRow icon="cloud" title="Сервер" subtitle="45.83.178.10" />

        <TouchableOpacity style={s.logoutBtn} onPress={doLogout}>
          <Text style={s.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.purple} />
      <View style={{flex:1, marginLeft:16}}>
        <Text style={s.rowTitle}>{title}</Text>
        {subtitle && <Text style={s.rowSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 24 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,106,239,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: colors.purple, fontWeight: 'bold', fontSize: 24 },
  profileName: { color: '#fff', fontWeight: '600', fontSize: 18 },
  profileUid: { color: colors.textSecondary, fontSize: 13 },
  section: { color: colors.purple, fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowTitle: { color: '#fff', fontSize: 16 },
  rowSub: { color: colors.textSecondary, fontSize: 13 },
  logoutBtn: { backgroundColor: 'rgba(255,59,48,0.15)', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 32 },
  logoutText: { color: colors.red, fontWeight: '600', fontSize: 16 },
});
