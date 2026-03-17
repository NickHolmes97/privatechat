import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, Image, KeyboardAvoidingView, Platform, Linking, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import matrix from '../services/matrix';
import { colors, onThemeChange } from '../utils/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function FavoritesScreen({ navigation }) {
  const [, _themeForce] = React.useState(0);
  React.useEffect(() => { const u = onThemeChange(() => _themeForce(n=>n+1)); return u; }, []);

  const [roomId, setRoomId] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const flatRef = useRef();
  const soundRef = useRef();

  useEffect(() => {
    init();
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  const init = async () => {
    try {
      const rid = await matrix.ensureSavedRoom();
      setRoomId(rid);
      const m = await matrix.loadMessages(rid);
      setMsgs(m);
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setLoading(false);
  };

  useEffect(() => {
    if (!roomId) return;
    const unsub = matrix.onRoomsUpdate(() => loadMsgs());
    return unsub;
  }, [roomId]);

  const loadMsgs = async () => {
    if (!roomId) return;
    try { const m = await matrix.loadMessages(roomId); setMsgs(m); } catch(_){}
  };

  const send = async () => {
    const t = text.trim(); if (!t || !roomId) return;
    setText(''); setSending(true);
    try {
      await matrix.sendMessage(roomId, t);
      await loadMsgs();
      flatRef.current?.scrollToEnd({ animated: true });
    } catch(_){}
    setSending(false);
  };

  const pickImage = async () => {
    if (!roomId) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (r.canceled) return;
    const asset = r.assets[0]; setSending(true);
    try {
      let info = { exists: true, size: 0 }; try { info = await FileSystem.getInfoAsync(asset.uri); } catch(_) {}
      const resp = await FileSystem.uploadAsync(
        `http://45.83.178.10:8008/_matrix/media/v3/upload?filename=image.jpg`, asset.uri,
        { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': asset.mimeType || 'image/jpeg' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      );
      const { content_uri } = JSON.parse(resp.body);
      await matrix.sendImage(roomId, content_uri, 'image.jpg', asset.mimeType || 'image/jpeg', info.size || 0);
      await loadMsgs();
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setSending(false);
  };

  const playAudio = async (msg) => {
    const url = matrix.mxcUrl(msg.url);
    if (!url) return;
    if (playingId === msg.id) {
      if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); }
      setPlayingId(null); return;
    }
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(st => { if (st.didJustFinish) setPlayingId(null); });
      await sound.playAsync(); setPlayingId(msg.id);
    } catch(_) {}
  };

  const openFile = async (msg) => {
    const url = matrix.mxcUrl(msg.url);
    if (!url) return;
    try {
      const dl = await FileSystem.downloadAsync(url, FileSystem.cacheDirectory + (msg.filename || 'file'));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(dl.uri);
    } catch(e) { Alert.alert('Ошибка', e.message); }
  };

  const fmtTime = ts => { const d = new Date(ts); return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); };

  const friendlyDate = (ts) => {
    const d = new Date(ts); const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = (today - msgDay) / 86400000;
    if (diff === 0) return 'Сегодня'; if (diff === 1) return 'Вчера';
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const getDateKey = (ts) => new Date(ts).toDateString();

  const renderMsg = ({ item, index }) => {
    let showDate = index === 0 || (msgs[index-1] && getDateKey(msgs[index-1].ts) !== getDateKey(item.ts));
    return (
      <View>
        {showDate && (
          <View style={s.dateSep}><View style={s.dateSepLine} /><Text style={s.dateSepText}>{friendlyDate(item.ts)}</Text><View style={s.dateSepLine} /></View>
        )}
        <TouchableOpacity activeOpacity={0.8} onLongPress={() => setSelectedMsg(item)} style={[s.msgRow, s.msgRowMe]}>
          <View style={[s.bubble, s.bubbleMe]}>
            {item.msgtype === 'm.image' && item.url && (
              <TouchableOpacity onPress={() => setViewImage(matrix.mxcUrl(item.url))}>
                <Image source={{ uri: matrix.mxcThumb(item.url) }} style={s.msgImage} resizeMode="cover" />
              </TouchableOpacity>
            )}
            {item.msgtype === 'm.audio' && (
              <TouchableOpacity style={s.audioRow} onPress={() => playAudio(item)}>
                <Ionicons name={playingId === item.id ? 'pause-circle' : 'play-circle'} size={36} color={colors.purple} />
                <Text style={s.audioEmoji}>🎤</Text>
              </TouchableOpacity>
            )}
            {item.msgtype === 'm.file' && (
              <TouchableOpacity style={s.fileRow} onPress={() => openFile(item)}>
                <Ionicons name="document" size={24} color={colors.purple} />
                <Text style={s.fileName} numberOfLines={1}>{item.filename || item.body}</Text>
              </TouchableOpacity>
            )}
            {(item.msgtype === 'm.text' || (!['m.image','m.audio','m.file','m.video'].includes(item.msgtype))) && (
              <Text style={s.msgText}>{item.body}</Text>
            )}
            <Text style={s.msgTime}>{fmtTime(item.ts)}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const ContextMenu = () => {
    if (!selectedMsg) return null;
    return (
      <Modal transparent visible animationType="fade" onRequestClose={() => setSelectedMsg(null)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setSelectedMsg(null)}>
          <View style={s.ctxMenu}>
            <TouchableOpacity style={s.ctxItem} onPress={async () => { await Clipboard.setStringAsync(selectedMsg.body); setSelectedMsg(null); }}>
              <Ionicons name="copy" size={20} color={colors.purple} /><Text style={s.ctxLabel}>Копировать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ctxItem} onPress={async () => { if (roomId) { await matrix.deleteMessage(roomId, selectedMsg.id); await loadMsgs(); } setSelectedMsg(null); }}>
              <Ionicons name="trash" size={20} color={colors.red} /><Text style={[s.ctxLabel, {color: colors.red}]}>Удалить</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loading) return <View style={[s.container, {backgroundColor: colors.bg}]}><View style={[s.header, {backgroundColor: colors.surface}]}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity><Text style={[s.headerTitle, {color: colors.text}]}>Избранное</Text></View><View style={s.loadingWrap}><Text style={s.loadingText}>Загрузка...</Text></View></View>;

  return (
    <KeyboardAvoidingView style={[s.container, {backgroundColor: colors.bg}]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <View style={s.headerAvatar}><Ionicons name="star" size={18} color={colors.purple} /></View>
        <View style={{flex:1}}>
          <Text style={[s.headerTitle, {color: colors.text}]}>Избранное</Text>
          <Text style={s.headerSub}>сохранённые сообщения</Text>
        </View>
      </View>

      <FlatList ref={flatRef} data={msgs} keyExtractor={i => i.id} renderItem={renderMsg}
        contentContainerStyle={msgs.length === 0 ? s.empty : s.msgList}
        ListEmptyComponent={<View style={s.emptyWrap}><Ionicons name="star-outline" size={64} color={colors.textSecondary} /><Text style={s.emptyText}>Пусто</Text><Text style={s.emptyHint}>Сохраняйте сообщения, заметки, ссылки</Text></View>}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })} />

      <View style={s.inputBar}>
        <TouchableOpacity onPress={pickImage} style={s.inputBtn}><Ionicons name="image" size={22} color={colors.textSecondary} /></TouchableOpacity>
        <TextInput style={s.input} value={text} onChangeText={setText}
          placeholder="Заметка..." placeholderTextColor={colors.textSecondary} multiline maxLength={4096} />
        {text.trim() ? (
          <TouchableOpacity onPress={send} style={s.sendBtn}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
        ) : <View style={{width:48}} />}
      </View>

      <ContextMenu />
      {viewImage && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setViewImage(null)}>
          <View style={s.imageViewerBg}>
            <TouchableOpacity style={s.imageViewerClose} onPress={() => setViewImage(null)}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
            <Image source={{ uri: viewImage }} style={s.imageViewerImg} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 12, backgroundColor: colors.surface },
  backBtn: { padding: 8 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,106,239,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerTitle: { color: colors.text, fontWeight: '600', fontSize: 16 },
  headerSub: { color: colors.textSecondary, fontSize: 12 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: 16 },
  msgList: { paddingHorizontal: 12, paddingVertical: 8 },
  dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, paddingHorizontal: 20 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dateSepText: { color: colors.textSecondary, fontSize: 12, marginHorizontal: 12, fontWeight: '500' },
  msgRow: { marginVertical: 2, alignItems: 'flex-end' },
  msgRowMe: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 10 },
  bubbleMe: { backgroundColor: colors.bubbleOut, borderBottomRightRadius: 4 },
  msgText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  msgImage: { width: 220, height: 180, borderRadius: 12, marginBottom: 4 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  audioEmoji: { fontSize: 14 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileName: { color: colors.text, fontSize: 14, flex: 1 },
  msgTime: { color: 'rgba(142,142,147,0.7)', fontSize: 11, textAlign: 'right', marginTop: 2 },
  empty: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 18, marginTop: 12, fontWeight: '600' },
  emptyHint: { color: colors.textSecondary, fontSize: 13, marginTop: 4, opacity: 0.6 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 8 },
  inputBtn: { padding: 8 },
  input: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, fontSize: 16, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  ctxMenu: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, width: '75%' },
  ctxItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  ctxLabel: { color: colors.text, fontSize: 16 },
  imageViewerBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  imageViewerClose: { position: 'absolute', top: 50, right: 16, zIndex: 10, padding: 8 },
  imageViewerImg: { width: SCREEN_W, height: SCREEN_H * 0.8 },
});
