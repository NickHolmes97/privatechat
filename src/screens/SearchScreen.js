import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import matrix from '../services/matrix';
import { colors } from '../utils/theme';

export default function SearchScreen({ navigation }) {
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

  const openChat = async (user) => {
    try {
      const r = await matrix.createDM(user.user_id);
      navigation.replace('Chat', { roomId: r.room_id, roomName: user.display_name || user.user_id });
    } catch(_){}
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>Поиск</Text>
      </View>
      <TextInput style={s.input} placeholder="Поиск пользователей..." placeholderTextColor={colors.textSecondary}
        value={query} onChangeText={search} autoFocus />
      {searching && <ActivityIndicator color={colors.purple} style={{margin:16}} />}
      <FlatList data={results} keyExtractor={i => i.user_id} renderItem={({item}) => (
        <TouchableOpacity style={s.row} onPress={() => openChat(item)}>
          <View style={s.av}><Text style={s.avt}>{(item.display_name||item.user_id)[0].toUpperCase()}</Text></View>
          <View style={{flex:1}}>
            <Text style={s.name}>{item.display_name || item.user_id}</Text>
            <Text style={s.uid}>{item.user_id}</Text>
          </View>
        </TouchableOpacity>
      )} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  input: { backgroundColor: colors.surface, borderRadius: 16, marginHorizontal: 16, padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: colors.glassBorder },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  av: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(124,106,239,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avt: { color: colors.purple, fontWeight: 'bold', fontSize: 18 },
  name: { color: '#fff', fontWeight: '500', fontSize: 16 },
  uid: { color: colors.textSecondary, fontSize: 13 },
});
