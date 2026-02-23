import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import matrix from '../services/matrix';
import { colors } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const uid = matrix.getUserId() || '';
  const name = uid.split(':')[0]?.replace('@','') || '';
  const [displayName, setDisplayName] = useState(name);
  const [editing, setEditing] = useState(false);

  const save = async () => {
    try { await matrix.setDisplayName(displayName); setEditing(false); }
    catch(e) { Alert.alert('Ошибка', e.message); }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>Профиль</Text>
      </View>
      <View style={s.avatarWrap}>
        <View style={s.avatar}><Text style={s.avatarText}>{displayName[0]?.toUpperCase()}</Text></View>
      </View>
      {editing ? (
        <View style={s.editRow}>
          <TextInput style={s.editInput} value={displayName} onChangeText={setDisplayName} autoFocus />
          <TouchableOpacity onPress={save} style={s.saveBtn}><Text style={s.saveBtnText}>Сохранить</Text></TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setEditing(true)} style={s.nameRow}>
          <Text style={s.name}>{displayName}</Text>
          <Ionicons name="pencil" size={16} color={colors.purple} />
        </TouchableOpacity>
      )}
      <Text style={s.uid}>{uid}</Text>
      <View style={s.card}>
        <InfoRow icon="at" label="Username" value={`@${name}`} />
        <InfoRow icon="cloud" label="Сервер" value="45.83.178.10" />
        <InfoRow icon="shield-checkmark" label="Шифрование" value="Активно" />
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={20} color={colors.purple} />
      <View style={{marginLeft:12}}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  avatarWrap: { alignItems: 'center', marginTop: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 40 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  name: { color: '#fff', fontWeight: 'bold', fontSize: 24 },
  uid: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 32, marginTop: 16 },
  editInput: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, color: '#fff', fontSize: 16 },
  saveBtn: { marginLeft: 12, backgroundColor: colors.purple, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  card: { margin: 24, backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoLabel: { color: colors.textSecondary, fontSize: 12 },
  infoValue: { color: '#fff', fontSize: 15 },
});
