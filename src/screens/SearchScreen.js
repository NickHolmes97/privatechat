import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import matrix from '../services/matrix';
import { colors } from '../utils/theme';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [msgResults, setMsgResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState('users'); // users | messages

  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) { setUsers([]); setMsgResults([]); return; }
    setSearching(true);
    try {
      if (tab === 'users') {
        setUsers(await matrix.searchUsers(q));
      } else {
        // Search messages across all rooms
        const rooms = matrix.getRoomList();
        const found = [];
        for (const room of rooms.slice(0, 20)) {
          try {
            const msgs = await matrix.loadMessages(room.id, 100);
            const matches = msgs.filter(m => m.body && m.body.toLowerCase().includes(q.toLowerCase()));
            matches.forEach(m => found.push({ ...m, roomId: room.id, roomName: room.name }));
          } catch(_) {}
        }
        found.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setMsgResults(found.slice(0, 50));
      }
    } catch(_) {}
    setSearching(false);
  };

  const openChat = async (user) => {
    try {
      const r = await matrix.createDM(user.user_id);
      navigation.replace('Chat', { roomId: r.room_id, roomName: user.display_name || user.user_id });
    } catch(_) {}
  };

  const openMsg = (item) => {
    navigation.navigate('chat', { roomId: item.roomId, roomName: item.roomName });
  };

  const fmtTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.getDate() + '.' + (d.getMonth()+1) + ' ' + d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding:4}}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, {color: colors.text}]}>Поиск</Text>
      </View>
      
      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'users' && s.tabActive]} onPress={() => { setTab('users'); setUsers([]); setMsgResults([]); setQuery(''); }}>
          <Ionicons name="people" size={16} color={tab === 'users' ? '#fff' : colors.textSecondary} />
          <Text style={[s.tabText, tab === 'users' && s.tabTextActive]}>Пользователи</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'messages' && s.tabActive]} onPress={() => { setTab('messages'); setUsers([]); setMsgResults([]); setQuery(''); }}>
          <Ionicons name="chatbubbles" size={16} color={tab === 'messages' ? '#fff' : colors.textSecondary} />
          <Text style={[s.tabText, tab === 'messages' && s.tabTextActive]}>Сообщения</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={[s.input, {backgroundColor: colors.surfaceLight, color: colors.text}]}
        placeholder={tab === 'users' ? "Имя пользователя..." : "Текст сообщения..."}
        placeholderTextColor={colors.textSecondary}
        value={query} onChangeText={search} autoFocus />
      
      {searching && <ActivityIndicator color={colors.purple} style={{margin:16}} />}

      {tab === 'users' ? (
        <FlatList data={users} keyExtractor={i => i.user_id} renderItem={({item}) => (
          <TouchableOpacity style={s.row} onPress={() => openChat(item)}>
            <View style={s.av}><Text style={s.avt}>{(item.display_name||item.user_id)[0].toUpperCase()}</Text></View>
            <View style={{flex:1}}>
              <Text style={[s.name, {color: colors.text}]}>{item.display_name || item.user_id}</Text>
              <Text style={s.uid}>{item.user_id}</Text>
            </View>
            <Ionicons name="chatbubble-outline" size={20} color={colors.purple} />
          </TouchableOpacity>
        )} ListEmptyComponent={query.length >= 2 && !searching ? (
          <View style={s.emptyWrap}><Text style={s.emptyText}>Никого не найдено</Text></View>
        ) : null} />
      ) : (
        <FlatList data={msgResults} keyExtractor={(i, idx) => i.id + idx} renderItem={({item}) => (
          <TouchableOpacity style={s.msgRow} onPress={() => openMsg(item)}>
            <View style={{flex:1}}>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:4}}>
                <Text style={[s.msgRoom, {color: colors.purple}]}>{item.roomName || 'Чат'}</Text>
                <Text style={s.msgTime}>{fmtTime(item.ts)}</Text>
              </View>
              <Text style={[s.msgSender, {color: colors.text}]}>{item.senderName}</Text>
              <Text style={s.msgBody} numberOfLines={2}>{item.body}</Text>
            </View>
          </TouchableOpacity>
        )} ListEmptyComponent={query.length >= 2 && !searching ? (
          <View style={s.emptyWrap}><Text style={s.emptyText}>Ничего не найдено</Text></View>
        ) : null} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 56, paddingBottom: 14, paddingHorizontal: 16, elevation: 4, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.15, shadowRadius: 6 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(124,106,239,0.08)' },
  tabActive: { backgroundColor: colors.purple },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  input: { borderRadius: 20, marginHorizontal: 16, paddingHorizontal: 18, paddingVertical: 12, fontSize: 16, borderWidth: 0.5, borderColor: 'rgba(124,106,239,0.15)' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' },
  av: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(124,106,239,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1.5, borderColor: 'rgba(124,106,239,0.15)' },
  avt: { color: colors.purple, fontWeight: 'bold', fontSize: 18 },
  name: { fontWeight: '600', fontSize: 16, letterSpacing: -0.2 },
  uid: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  msgRow: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' },
  msgRoom: { fontSize: 13, fontWeight: '700' },
  msgTime: { color: colors.textSecondary, fontSize: 11 },
  msgSender: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  msgBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
});
