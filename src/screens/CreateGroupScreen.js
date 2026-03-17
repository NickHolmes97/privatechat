import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import matrix from '../services/matrix';
import { colors } from '../utils/theme';

export default function CreateGroupScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try { setResults(await matrix.searchUsers(q)); } catch(_){}
    setSearching(false);
  };

  const toggle = (user) => {
    if (selected.find(s => s.user_id === user.user_id)) {
      setSelected(selected.filter(s => s.user_id !== user.user_id));
    } else {
      setSelected([...selected, user]);
    }
  };

  const create = async () => {
    if (!name.trim()) return Alert.alert('Ошибка', 'Введите название группы');
    if (selected.length === 0) return Alert.alert('Ошибка', 'Добавьте участников');
    setCreating(true);
    try {
      const r = await matrix.createGroup(name.trim(), selected.map(s => s.user_id));
      navigation.navigate('chat', { roomId: r.room_id, roomName: name.trim() });
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setCreating(false);
  };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>{step === 1 ? 'Новая группа' : 'Участники'}</Text>
        {step === 1 ? (
          <TouchableOpacity onPress={() => name.trim() ? setStep(2) : Alert.alert('', 'Введите название')}>
            <Text style={s.nextBtn}>Далее</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={create} disabled={creating}>
            {creating ? <ActivityIndicator color={colors.purple} /> : <Text style={s.nextBtn}>Создать</Text>}
          </TouchableOpacity>
        )}
      </View>

      {step === 1 && (
        <View style={s.nameSection}>
          <View style={s.groupIcon}><Ionicons name="people" size={32} color={colors.purple} /></View>
          <TextInput style={s.nameInput} placeholder="Название группы" placeholderTextColor={colors.textSecondary}
            value={name} onChangeText={setName} autoFocus />
        </View>
      )}

      {step === 2 && (
        <View style={{flex:1}}>
          {selected.length > 0 && (
            <View style={s.selectedRow}>
              {selected.map(u => (
                <TouchableOpacity key={u.user_id} style={s.chip} onPress={() => toggle(u)}>
                  <Text style={s.chipText}>{u.display_name || u.user_id.split(':')[0].slice(1)}</Text>
                  <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TextInput style={s.searchInput} placeholder="Поиск пользователей..." placeholderTextColor={colors.textSecondary}
            value={query} onChangeText={search} autoFocus />
          {searching && <ActivityIndicator color={colors.purple} style={{margin:12}} />}
          <FlatList data={results} keyExtractor={i => i.user_id} renderItem={({item}) => {
            const isSel = !!selected.find(s => s.user_id === item.user_id);
            return (
              <TouchableOpacity style={s.userRow} onPress={() => toggle(item)}>
                <View style={s.userAvatar}><Text style={s.userAvatarText}>{(item.display_name||item.user_id)[0].toUpperCase()}</Text></View>
                <View style={{flex:1}}>
                  <Text style={s.userName}>{item.display_name || item.user_id}</Text>
                  <Text style={s.userUid}>{item.user_id}</Text>
                </View>
                <Ionicons name={isSel ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={isSel ? colors.purple : colors.textSecondary} />
              </TouchableOpacity>
            );
          }} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  nextBtn: { color: colors.purple, fontSize: 16, fontWeight: '600' },
  nameSection: { alignItems: 'center', padding: 24 },
  groupIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(124,106,239,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  nameInput: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, color: '#fff', fontSize: 18, width: '100%', textAlign: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(124,106,239,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  chipText: { color: colors.purple, fontSize: 14 },
  searchInput: { backgroundColor: colors.surface, borderRadius: 16, marginHorizontal: 16, padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: colors.glassBorder },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(124,106,239,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { color: colors.purple, fontWeight: 'bold', fontSize: 18 },
  userName: { color: '#fff', fontWeight: '500', fontSize: 16 },
  userUid: { color: colors.textSecondary, fontSize: 13 },
});
