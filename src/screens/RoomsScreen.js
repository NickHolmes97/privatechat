import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import matrix from '../services/matrix';
import { colors } from '../utils/theme';

export default function RoomsScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setRooms(matrix.getRoomList());
    const unsub = matrix.onRoomsUpdate(list => setRooms([...list]));
    return unsub;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRooms(matrix.getRoomList());
    setRefreshing(false);
  }, []);

  const fmtTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts), now = new Date(), diff = now - d;
    if (diff < 86400000) return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
    if (diff < 604800000) return ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()];
    return `${d.getDate()}.${(d.getMonth()+1).toString().padStart(2,'0')}`;
  };

  const renderRoom = ({ item }) => (
    <TouchableOpacity style={s.room} onPress={() => navigation.navigate('Chat', { roomId: item.id, roomName: item.name })} activeOpacity={0.7}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
      </View>
      <View style={s.roomInfo}>
        <View style={s.roomTop}>
          <Text style={s.roomName} numberOfLines={1}>{item.name || 'Чат'}</Text>
          <Text style={s.roomTime}>{fmtTime(item.lastTs)}</Text>
        </View>
        <View style={s.roomBottom}>
          <Text style={s.roomMsg} numberOfLines={1}>{item.lastMsg || 'Нет сообщений'}</Text>
          {item.unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text></View>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Чаты</Text>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={s.headerBtn}>
            <Ionicons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={s.headerBtn}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={rooms}
        keyExtractor={item => item.id}
        renderItem={renderRoom}
        contentContainerStyle={rooms.length === 0 ? s.empty : undefined}
        ListEmptyComponent={<View style={s.emptyWrap}><Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} /><Text style={s.emptyText}>Нет чатов</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} colors={[colors.purple]} />}
      />
      <View style={s.bottomNav}>
        <NavBtn icon="chatbubbles" label="Чаты" active />
        <NavBtn icon="call" label="Звонки" onPress={() => {}} />
        <NavBtn icon="search" label="Поиск" onPress={() => navigation.navigate('Search')} />
        <NavBtn icon="star" label="Избранное" onPress={() => {}} />
        <NavBtn icon="person" label="Профиль" onPress={() => navigation.navigate('Profile')} />
      </View>
    </View>
  );
}

function NavBtn({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={s.navBtn} onPress={onPress}>
      <Ionicons name={active ? icon : `${icon}-outline`} size={22} color={active ? colors.purple : colors.textSecondary} />
      <Text style={[s.navLabel, active && { color: colors.purple }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: colors.bg },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 8 },
  room: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(124,106,239,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.purple, fontWeight: 'bold', fontSize: 20 },
  roomInfo: { flex: 1, marginLeft: 12 },
  roomTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
  roomTime: { fontSize: 12, color: colors.textSecondary },
  roomBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  roomMsg: { fontSize: 14, color: colors.textSecondary, flex: 1, marginRight: 8 },
  badge: { backgroundColor: colors.purple, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empty: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: 12 },
  bottomNav: { flexDirection: 'row', backgroundColor: colors.surface, paddingBottom: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  navBtn: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
