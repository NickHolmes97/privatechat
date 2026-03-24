import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Image, Modal, TextInput, Alert, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import matrix from '../services/matrix';
import StoriesRow from '../components/StoriesRow';
import ChatTabs from '../components/ChatTabs';
import { colors, onThemeChange } from '../utils/theme';
import { getHiddenChats, setHiddenChats, getPin, setPin, getFavorites, saveFavorites } from '../services/storage';

// SwipeableRow for room list
function SwipeableRow({ onSwipeLeft, onSwipeRight, leftColor, rightColor, leftIcon, rightIcon, children }) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy * 1.5),
    onPanResponderMove: (_, g) => {
      if (Math.abs(g.dx) < 100) translateX.setValue(g.dx);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx > 60 && onSwipeRight) {
        Animated.timing(translateX, { toValue: 100, duration: 200, useNativeDriver: true }).start(() => {
          onSwipeRight();
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        });
      } else if (g.dx < -60 && onSwipeLeft) {
        Animated.timing(translateX, { toValue: -100, duration: 200, useNativeDriver: true }).start(() => {
          onSwipeLeft();
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        });
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;
  
  return (
    <View style={{overflow: 'hidden'}}>
      <View style={{position:'absolute', left:0, right:0, top:0, bottom:0, flexDirection:'row'}}>
        <View style={{flex:1, backgroundColor: rightColor || '#34C759', justifyContent:'center', paddingLeft:20}}>
          <Ionicons name={rightIcon || 'pin'} size={22} color="#fff" />
        </View>
        <View style={{flex:1, backgroundColor: leftColor || '#FF3B30', justifyContent:'center', alignItems:'flex-end', paddingRight:20}}>
          <Ionicons name={leftIcon || 'trash'} size={22} color="#fff" />
        </View>
      </View>
      <Animated.View style={{transform: [{translateX}], backgroundColor: colors.bg}} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}



export default function RoomsScreen({ navigation }) {
  const [activeTab, setActiveTab] = React.useState('all');
  const [mutedRooms, setMutedRooms] = React.useState({});
  const [showArchived, setShowArchived] = React.useState(false);
  const [, _themeForce] = React.useState(0);
  React.useEffect(() => { const u = onThemeChange(() => _themeForce(n=>n+1)); return u; }, []);

  const [rooms, setRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pinnedIds, setPinnedIds] = useState([]);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinAction, setPinAction] = useState(null); // 'show' | 'set'
  const [contextRoom, setContextRoom] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    loadMeta();
    setRooms(matrix.getRoomList());
    const unsub = matrix.onRoomsUpdate(list => setRooms([...list]));
    return unsub;
  }, []);

  const loadMeta = async () => {
    const h = await getHiddenChats();
    setHiddenIds(h);
    const f = await getFavorites();
    setPinnedIds(f);
  };

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

  const sortedRooms = () => {
    let visible = rooms.filter(r => !hiddenIds.includes(r.id));
    // Tab filtering
    if (activeTab === 'personal') visible = visible.filter(r => Object.keys(r.members || {}).length <= 2 && !r.isInvite);
    else if (activeTab === 'groups') visible = visible.filter(r => Object.keys(r.members || {}).length > 2);
    else if (activeTab === 'unread') visible = visible.filter(r => r.unread > 0);
    else if (activeTab === 'channels') visible = visible.filter(r => (r.name || '').startsWith('#'));
    else if (activeTab === 'bots') visible = visible.filter(r => (r.name || '').toLowerCase().includes('bot'));
    const pinned = visible.filter(r => pinnedIds.includes(r.id));
    const rest = visible.filter(r => !pinnedIds.includes(r.id));
    return [...pinned, ...rest];
  };

  const hiddenRooms = () => rooms.filter(r => hiddenIds.includes(r.id));

  const togglePin = async (roomId) => {
    const newPinned = pinnedIds.includes(roomId) ? pinnedIds.filter(id => id !== roomId) : [...pinnedIds, roomId];
    setPinnedIds(newPinned);
    await saveFavorites(newPinned);
    setContextRoom(null);
  };

  const hideRoom = async (roomId) => {
    const currentPin = await getPin();
    if (!currentPin) {
      setPinAction('set');
      setPinModal(true);
      setPinInput('');
      // after setting pin, hide room
      setContextRoom({ ...contextRoom, pendingHide: roomId });
      return;
    }
    const newHidden = [...hiddenIds, roomId];
    setHiddenIds(newHidden);
    await setHiddenChats(newHidden);
    setContextRoom(null);
  };

  const unhideRoom = async (roomId) => {
    const newHidden = hiddenIds.filter(id => id !== roomId);
    setHiddenIds(newHidden);
    await setHiddenChats(newHidden);
  };

  const tryShowHidden = async () => {
    const currentPin = await getPin();
    if (!currentPin) { setShowHidden(true); return; }
    setPinAction('show');
    setPinModal(true);
    setPinInput('');
  };

  const submitPin = async () => {
    if (pinAction === 'set') {
      if (pinInput.length < 4) return Alert.alert('', 'PIN минимум 4 цифры');
      await setPin(pinInput);
      setPinModal(false);
      if (contextRoom?.pendingHide) {
        const newHidden = [...hiddenIds, contextRoom.pendingHide];
        setHiddenIds(newHidden);
        await setHiddenChats(newHidden);
        setContextRoom(null);
      }
    } else if (pinAction === 'show') {
      const currentPin = await getPin();
      if (pinInput === currentPin) { setPinModal(false); setShowHidden(true); }
      else Alert.alert('', 'Неверный PIN');
    }
    setPinInput('');
  };

  const acceptInvite = async (roomId) => {
    try { await matrix.joinRoom(roomId); } catch(e) { Alert.alert('Ошибка', e.message); }
  };

  const declineInvite = async (roomId) => {
    try { await matrix.leaveRoom(roomId); } catch(e) { Alert.alert('Ошибка', e.message); }
  };

  const renderRoom = ({ item }) => {
    if (item.isInvite) {
      return (
        <View style={s.inviteRoom}>
          <View style={s.avatar}><Text style={s.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text></View>
          <View style={s.roomInfo}>
            <Text style={s.roomName}>{item.name}</Text>
            <Text style={s.inviteText}>Приглашение</Text>
          </View>
          <TouchableOpacity style={s.acceptBtn} onPress={() => acceptInvite(item.id)}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.declineBtn} onPress={() => declineInvite(item.id)}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }
    const isPinned = pinnedIds.includes(item.id);
    return (
      <TouchableOpacity style={s.room} onPress={() => navigation.navigate('chat', { roomId: item.id, roomName: item.name })}
        onLongPress={() => setContextRoom(item)} activeOpacity={0.7}>
        <View style={{position:'relative'}}>
          {item.avatar ? (
            <Image source={{uri: matrix.mxcThumb(item.avatar, 52, 52)}} style={s.avatarImg} />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
            </View>
          )}
          {(() => {
            const otherUid = Object.keys(item.members || {}).find(k => k !== matrix.getUserId());
            if (otherUid && Object.keys(item.members || {}).length <= 2) {
              const p = matrix.getPresence(otherUid);
              if (p.status === 'online') return <View style={s.onlineDot} />;
            }
            return null;
          })()}
        </View>
        <View style={s.roomInfo}>
          <View style={s.roomTop}>
            <View style={{flexDirection:'row', alignItems:'center', flex:1}}>
              {isPinned && <Ionicons name="pin" size={12} color={colors.purple} style={{marginRight:4}} />}
              <Text style={s.roomName} numberOfLines={1}>{item.name || 'Чат'}</Text>
            </View>
            <Text style={s.roomTime}>{fmtTime(item.lastTs)}</Text>
          </View>
          <View style={s.roomBottom}>
            <Text style={s.roomMsg} numberOfLines={1}>{item.lastMsg || 'Нет сообщений'}</Text>
            {item.unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text></View>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Context menu for room long press
  const RoomContextMenu = () => {
    if (!contextRoom) return null;
    const isPinned = pinnedIds.includes(contextRoom.id);
    const isHidden = hiddenIds.includes(contextRoom.id);
    return (
      <Modal transparent visible animationType="fade" onRequestClose={() => setContextRoom(null)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setContextRoom(null)}>
          <View style={s.ctxMenu}>
            <TouchableOpacity style={s.ctxItem} onPress={() => togglePin(contextRoom.id)}>
              <Ionicons name={isPinned ? 'pin-outline' : 'pin'} size={20} color={colors.purple} />
              <Text style={s.ctxLabel}>{isPinned ? 'Открепить' : 'Закрепить'}</Text>
            </TouchableOpacity>
            {!isHidden && (
              <TouchableOpacity style={s.ctxItem} onPress={() => hideRoom(contextRoom.id)}>
                <Ionicons name="eye-off" size={20} color={colors.purple} />
                <Text style={s.ctxLabel}>Скрыть чат</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.ctxItem} onPress={() => {
              Alert.alert('Удалить чат', 'Покинуть этот чат?', [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: async () => { await matrix.leaveRoom(contextRoom.id); setContextRoom(null); } }
              ]);
            }}>
              <Ionicons name="trash" size={20} color={colors.red} />
              <Text style={[s.ctxLabel, { color: colors.red }]}>Удалить</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <Text style={[s.headerTitle, {color: colors.text}]}>Чаты</Text>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('search')} style={s.headerBtn}>
            <Ionicons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('settings')} style={s.headerBtn}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {hiddenIds.length > 0 && !showHidden && (
        <TouchableOpacity style={s.hiddenBar} onPress={tryShowHidden}>
          <Ionicons name="eye-off" size={16} color={colors.purple} />
          <Text style={s.hiddenBarText}>Скрытые чаты ({hiddenIds.length})</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:14,paddingHorizontal:20,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.glassBorder}} onPress={() => setShowArchived(!showArchived)}>
          <Ionicons name="archive-outline" size={20} color={colors.purple} style={{marginRight:12}} />
          <Text style={{color:colors.text,fontSize:15,flex:1}}>Архив</Text>
          <Ionicons name={showArchived ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <StoriesRow />
        <ChatTabs active={activeTab} onChange={setActiveTab} />
        <FlatList
        data={showHidden ? hiddenRooms() : sortedRooms()}
        keyExtractor={item => item.id}
        renderItem={showHidden ? ({ item }) => (
          <TouchableOpacity style={s.room} onPress={() => navigation.navigate('chat', { roomId: item.id, roomName: item.name })} activeOpacity={0.7}>
            <View style={s.avatar}><Text style={s.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text></View>
            <View style={s.roomInfo}>
              <Text style={s.roomName} numberOfLines={1}>{item.name || 'Чат'}</Text>
              <Text style={s.roomMsg} numberOfLines={1}>{item.lastMsg || ''}</Text>
            </View>
            <TouchableOpacity onPress={() => unhideRoom(item.id)} style={{padding:8}}>
              <Ionicons name="eye" size={20} color={colors.purple} />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : renderRoom}
        contentContainerStyle={rooms.length === 0 ? s.empty : undefined}
        ListEmptyComponent={<View style={s.emptyWrap}><View style={{width:80, height:80, borderRadius:40, backgroundColor:'rgba(124,106,239,0.1)', justifyContent:'center', alignItems:'center', marginBottom:16}}><Ionicons name="chatbubbles-outline" size={40} color={colors.purple} /></View><Text style={[s.emptyText, {fontSize:18, fontWeight:'600', color:colors.text}]}>Нет чатов</Text><Text style={[s.emptyText, {fontSize:14, marginTop:4}]}>Нажмите + чтобы начать общение</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} colors={[colors.purple]} />}
      />

      {showHidden && (
        <TouchableOpacity style={s.hiddenBackBtn} onPress={() => setShowHidden(false)}>
          <Text style={s.hiddenBackText}>← Назад к чатам</Text>
        </TouchableOpacity>
      )}

      <View style={s.bottomNav}>
        <NavBtn icon="chatbubbles" label="Чаты" active />
        <NavBtn icon="call" label="Звонки" onPress={() => {}} />
        <NavBtn icon="search" label="Поиск" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('search'); }} />
        <NavBtn icon="star" label="Избранное" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('favorites'); }} />
        <NavBtn icon="settings" label="Настройки" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('settings'); }} />
      </View>

      {/* FAB */}
      {fabOpen && <TouchableOpacity activeOpacity={1} onPress={() => setFabOpen(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.25)',zIndex:9}} />}
      <TouchableOpacity style={[s.fab, {zIndex:11}]} onPress={() => { setFabOpen(!fabOpen); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
        <Animated.View style={{transform:[{rotate: fabOpen ? '45deg' : '0deg'}]}}>
          <Ionicons name={fabOpen ? 'close' : 'create'} size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
      {fabOpen && (
        <View style={[s.fabMenu, {zIndex:11}]}>
          <TouchableOpacity style={s.fabItem} onPress={() => { setFabOpen(false); navigation.navigate('search'); }}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={s.fabItemText}>Новый чат</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.fabItem} onPress={() => { setFabOpen(false); navigation.navigate('creategroup'); }}>
            <Ionicons name="people" size={20} color="#fff" />
            <Text style={s.fabItemText}>Новая группа</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.fabItem} onPress={() => { setFabOpen(false); navigation.navigate('createchannel'); }}>
            <Ionicons name="megaphone" size={20} color="#fff" />
            <Text style={s.fabItemText}>Новый канал</Text>
          </TouchableOpacity>
        </View>
      )}

      <RoomContextMenu />

      {/* PIN modal */}
      <Modal transparent visible={pinModal} animationType="fade" onRequestClose={() => setPinModal(false)}>
        <View style={s.modalBg}>
          <View style={s.pinCard}>
            <Text style={s.pinTitle}>{pinAction === 'set' ? 'Установите PIN' : 'Введите PIN'}</Text>
            <TextInput style={s.pinInput} value={pinInput} onChangeText={setPinInput}
              keyboardType="number-pad" secureTextEntry maxLength={6} autoFocus placeholder="••••" placeholderTextColor={colors.textSecondary} />
            <View style={{flexDirection:'row', gap:12}}>
              <TouchableOpacity style={s.pinCancel} onPress={() => { setPinModal(false); setContextRoom(null); }}>
                <Text style={s.pinCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.pinSubmit} onPress={submitPin}>
                <Text style={s.pinSubmitText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: colors.bg },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 8 },
  hiddenBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(124,106,239,0.1)', marginHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  hiddenBarText: { color: colors.purple, fontSize: 14, fontWeight: '500' },
  hiddenBackBtn: { padding: 12, alignItems: 'center' },
  hiddenBackText: { color: colors.purple, fontSize: 15, fontWeight: '500' },
  room: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  inviteRoom: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(124,106,239,0.05)' },
  inviteText: { color: colors.purple, fontSize: 13 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.green, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  declineBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.red, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#5B4BC7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 20 },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#34C759', borderWidth: 2, borderColor: colors.bg },
  roomInfo: { flex: 1, marginLeft: 12 },
  roomTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
  roomTime: { fontSize: 12, color: colors.textSecondary },
  roomBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  roomMsg: { fontSize: 14, color: colors.textSecondary, flex: 1, marginRight: 8 },
  badge: { backgroundColor: colors.purple, borderRadius: 11, paddingHorizontal: 6, paddingVertical: 2, minWidth: 22, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empty: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: 12 },
  bottomNav: { flexDirection: 'row', backgroundColor: colors.surface, paddingBottom: 20, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: colors.glassBorder },
  navBtn: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  // FAB
  fab: { position: 'absolute', right: 16, bottom: 88, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabMenu: { position: 'absolute', right: 16, bottom: 152, backgroundColor: colors.surface, borderRadius: 16, padding: 8, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  fabItemText: { color: '#fff', fontSize: 15 },
  // Context menu
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  ctxMenu: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, width: '75%' },
  ctxItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  ctxLabel: { color: colors.text, fontSize: 16 },
  // PIN
  pinCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '75%', alignItems: 'center' },
  pinTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  pinInput: { backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 14, color: '#fff', fontSize: 24, textAlign: 'center', width: '100%', letterSpacing: 8, marginBottom: 16 },
  pinCancel: { flex: 1, padding: 12, alignItems: 'center' },
  pinCancelText: { color: colors.textSecondary, fontSize: 16 },
  pinSubmit: { flex: 1, backgroundColor: colors.purple, borderRadius: 12, padding: 12, alignItems: 'center' },
  pinSubmitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
