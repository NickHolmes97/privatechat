import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import matrix from '../services/matrix';
import { colors } from '../utils/theme';

export default function AddMemberScreen({ route, navigation }) {
  const { roomId } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try { setResults(await matrix.searchUsers(q)); } catch(_){}
    setSearching(false);
  };

  const invite = async (user) => {
    try {
      await matrix.inviteUser(roomId, user.user_id);
      Alert.alert('Готово', `${user.display_name || user.user_id} приглашён`);
    } catch(e) { Alert.alert('Ошибка', e.message); }
  };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={s.title}>Добавить участника</Text>
      </View>
      <TextInput style={s.input} placeholder="Поиск..." placeholderTextColor={colors.textSecondary}
        value={query} onChangeText={search} autoFocus />
      {searching && <ActivityIndicator color={colors.purple} style={{margin:12}} />}
      <FlatList data={results} keyExtractor={i => i.user_id} renderItem={({item}) => (
        <TouchableOpacity style={s.row} onPress={() => invite(item)}>
          <View style={s.av}><Text style={s.avt}>{(item.display_name||item.user_id)[0].toUpperCase()}</Text></View>
          <View style={{flex:1}}>
            <Text style={s.name}>{item.display_name || item.user_id}</Text>
            <Text style={s.uid}>{item.user_id}</Text>
          </View>
          <Ionicons name="person-add" size={20} color={colors.purple} />
        </TouchableOpacity>
      )} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  input: { backgroundColor: colors.surface, borderRadius: 16, marginHorizontal: 16, padding: 14, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.glassBorder },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  av: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(124,106,239,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avt: { color: colors.purple, fontWeight: 'bold', fontSize: 18 },
  name: { color: '#fff', fontWeight: '500', fontSize: 16 },
  uid: { color: colors.textSecondary, fontSize: 13 },
});
