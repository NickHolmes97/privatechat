import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import matrix from '../services/matrix';
import { colors } from '../utils/theme';

export default function CreateChannelScreen({ navigation }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!name.trim()) return Alert.alert('', 'Введите название канала');
    setCreating(true);
    try {
      const r = await matrix.createChannel(name.trim(), desc.trim(), isPublic);
      navigation.navigate('chat', { roomId: r.room_id, roomName: name.trim() });
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setCreating(false);
  };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Новый канал</Text>
        <TouchableOpacity onPress={create} disabled={creating}>
          {creating ? <ActivityIndicator color={colors.purple} /> : <Text style={s.createBtn}>Создать</Text>}
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        <View style={s.iconWrap}><Ionicons name="megaphone" size={40} color={colors.purple} /></View>

        <TextInput style={s.input} placeholder="Название канала" placeholderTextColor={colors.textSecondary}
          value={name} onChangeText={setName} autoFocus />

        <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Описание (необязательно)"
          placeholderTextColor={colors.textSecondary} value={desc} onChangeText={setDesc} multiline />

        <View style={s.switchRow}>
          <View style={{flex:1}}>
            <Text style={s.switchTitle}>Публичный канал</Text>
            <Text style={s.switchSub}>Любой сможет найти и подписаться</Text>
          </View>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: colors.surfaceLight, true: colors.purple }} thumbColor="#fff" />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  createBtn: { color: colors.purple, fontSize: 16, fontWeight: '600' },
  content: { padding: 24 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(124,106,239,0.2)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 24 },
  input: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, color: colors.text, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.glassBorder },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  switchTitle: { color: '#fff', fontSize: 16 },
  switchSub: { color: colors.textSecondary, fontSize: 13 },
});
