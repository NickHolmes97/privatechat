import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import matrix from '../services/matrix';
import AdminPanel from '../components/AdminPanel';
import SharedLinks from '../components/SharedLinks';
import ChatExport from '../components/ChatExport';
import MediaGrid from '../components/MediaGrid';
import { colors, onThemeChange } from '../utils/theme';

export default function RoomInfoScreen({ route, navigation }) {
  const [showAdmin, setShowAdmin] = React.useState(false);
  const [showLinks, setShowLinks] = React.useState(false);
  const [showExport, setShowExport] = React.useState(false);
  const [showMedia, setShowMedia] = React.useState(false);
  const [chatLinks, setChatLinks] = React.useState([]);
  const [chatMsgs, setChatMsgs] = React.useState([]);
  const [chatImages, setChatImages] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      try {
        const msgs = await matrix.loadMessages(roomId, 200);
        setChatMsgs(msgs);
        const urls = [];
        const imgs = [];
        msgs.forEach(m => {
          if (m.msgtype === 'm.text' && m.body) {
            const matches = m.body.match(/https?:\/\/[^\s]+/g);
            if (matches) matches.forEach(u => urls.push({ url: u, sender: m.senderName, ts: m.ts }));
          }
          if (m.msgtype === 'm.image' && m.url) {
            imgs.push({ uri: matrix.mxcUrl(m.url), ts: m.ts });
          }
        });
        setChatLinks(urls);
        setChatImages(imgs);
      } catch(e) {}
    })();
  }, [roomId]);
  const [, _themeForce] = React.useState(0);
  React.useEffect(() => { const u = onThemeChange(() => _themeForce(n=>n+1)); return u; }, []);

  const { roomId, roomName } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const room = matrix.getRoom(roomId);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const m = await matrix.getRoomMembers(roomId);
      setMembers(m);
    } catch(_){}
    setLoading(false);
  };

  const doLeave = () => {
    Alert.alert('Покинуть чат', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Покинуть', style: 'destructive', onPress: async () => {
        await matrix.leaveRoom(roomId);
        navigation.navigate('rooms');
      }}
    ]);
  };

  const addMember = () => {
    navigation.navigate('addmember', { roomId });
  };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={s.title}>Информация</Text>
      </View>
      <ScrollView>
        <View style={s.avatarWrap}>
          <View style={s.avatar}><Text style={s.avatarText}>{(roomName||'?')[0].toUpperCase()}</Text></View>
          <Text style={s.roomName}>{roomName}</Text>
          <Text style={s.memberCount}>{members.length} участников</Text>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Участники</Text>
            <TouchableOpacity onPress={addMember}>
              <Ionicons name="person-add" size={20} color={colors.purple} />
            </TouchableOpacity>
          </View>
          {members.map(m => (
            <View key={m.userId} style={s.memberRow}>
              <View style={s.memberAvatar}>
                <Text style={s.memberAvatarText}>{(m.displayName||'?')[0].toUpperCase()}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={s.memberName}>{m.displayName}</Text>
                <Text style={s.memberUid}>{m.userId}</Text>
              </View>
              {matrix.getPresence(m.userId).status === 'online' && <View style={s.onlineDot} />}
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Действия</Text>
          <TouchableOpacity style={s.actionRow} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={20} color={colors.purple} />
            <Text style={s.actionText}>Уведомления</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionRow} onPress={() => {}}>
            <Ionicons name="search" size={20} color={colors.purple} />
            <Text style={s.actionText}>Поиск по чату</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionRow} onPress={() => setShowMedia(true)}>
            <Ionicons name="images-outline" size={20} color={colors.purple} />
            <Text style={s.actionText}>Медиа</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionRow} onPress={() => setShowLinks(true)}>
            <Ionicons name="link-outline" size={20} color={colors.purple} />
            <Text style={s.actionText}>Ссылки</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionRow} onPress={() => setShowExport(true)}>
            <Ionicons name="download-outline" size={20} color={colors.purple} />
            <Text style={s.actionText}>Экспорт чата</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionRow, { borderBottomWidth: 0 }]} onPress={doLeave}>
            <Ionicons name="exit-outline" size={20} color={colors.red} />
            <Text style={[s.actionText, { color: colors.red }]}>Покинуть чат</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    
        <AdminPanel visible={showAdmin} onAction={(a) => { setShowAdmin(false); Alert.alert("", a + " скоро!"); }} onClose={() => setShowAdmin(false)} />
        <SharedLinks visible={showLinks} links={chatLinks} onClose={() => setShowLinks(false)} />
        <ChatExport visible={showExport} roomName={roomName} messages={chatMsgs} onClose={() => setShowExport(false)} />
        <MediaGrid visible={showMedia} images={chatImages} onSelect={() => {}} onClose={() => setShowMedia(false)} />
      </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  avatarWrap: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(124,106,239,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.purple, fontWeight: 'bold', fontSize: 32 },
  roomName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 12 },
  memberCount: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  section: { margin: 16, backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: colors.purple, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(124,106,239,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberAvatarText: { color: colors.purple, fontWeight: '600', fontSize: 16 },
  memberName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  memberUid: { color: colors.textSecondary, fontSize: 12 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.glassBorder, gap: 12 },
  actionText: { color: '#fff', fontSize: 16 },
});
