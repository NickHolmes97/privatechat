import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import matrix from '../services/matrix';
import { colors } from '../utils/theme';

export default function ChatScreen({ route, navigation }) {
  const { roomId, roomName } = route.params;
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [recording, setRecording] = useState(null);
  const [recDuration, setRecDuration] = useState(0);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const flatRef = useRef();
  const soundRef = useRef();
  const recInterval = useRef();

  useEffect(() => {
    loadMsgs();
    const unsub = matrix.onRoomsUpdate(() => loadMsgs());
    return () => { unsub(); if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  const loadMsgs = async () => {
    try {
      const m = await matrix.loadMessages(roomId);
      setMsgs(m);
      if (m.length) matrix.markRead(roomId, m[m.length-1].id);
    } catch(_){}
    setLoading(false);
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    setSending(true);
    try {
      if (editing) { await matrix.editMessage(roomId, editing.id, t); setEditing(null); }
      else if (replyTo) { await matrix.sendReply(roomId, t, replyTo); setReplyTo(null); }
      else await matrix.sendMessage(roomId, t);
      matrix.sendTyping(roomId, false);
      await loadMsgs();
      flatRef.current?.scrollToEnd({ animated: true });
    } catch(_){}
    setSending(false);
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (r.canceled) return;
    const asset = r.assets[0];
    setSending(true);
    try {
      const info = await FileSystem.getInfoAsync(asset.uri);
      const resp = await FileSystem.uploadAsync(
        `http://45.83.178.10:8444/_matrix/media/v3/upload?filename=image.jpg`,
        asset.uri,
        { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': asset.mimeType || 'image/jpeg' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      );
      const { content_uri } = JSON.parse(resp.body);
      await matrix.sendImage(roomId, content_uri, 'image.jpg', asset.mimeType || 'image/jpeg', info.size || 0);
      await loadMsgs();
      flatRef.current?.scrollToEnd({ animated: true });
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setSending(false);
  };

  const pickFile = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({});
      if (r.canceled) return;
      const file = r.assets[0];
      setSending(true);
      const resp = await FileSystem.uploadAsync(
        `http://45.83.178.10:8444/_matrix/media/v3/upload?filename=${encodeURIComponent(file.name)}`,
        file.uri,
        { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': file.mimeType || 'application/octet-stream' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      );
      const { content_uri } = JSON.parse(resp.body);
      await matrix.sendFile(roomId, content_uri, file.name, file.mimeType || 'application/octet-stream', file.size || 0);
      await loadMsgs();
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setSending(false);
  };

  // Voice recording
  const startRecord = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setRecDuration(0);
      recInterval.current = setInterval(() => setRecDuration(d => d + 1), 1000);
    } catch(e) { Alert.alert('Ошибка', 'Нет доступа к микрофону'); }
  };

  const stopRecord = async (send = true) => {
    clearInterval(recInterval.current);
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      if (send) {
        const uri = recording.getURI();
        const info = await FileSystem.getInfoAsync(uri);
        setSending(true);
        const resp = await FileSystem.uploadAsync(
          `http://45.83.178.10:8444/_matrix/media/v3/upload?filename=voice.m4a`,
          uri,
          { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': 'audio/mp4' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
        );
        const { content_uri } = JSON.parse(resp.body);
        await matrix.sendAudio(roomId, content_uri, recDuration * 1000, info.size || 0);
        await loadMsgs();
        flatRef.current?.scrollToEnd({ animated: true });
        setSending(false);
      }
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setRecording(null);
    setRecDuration(0);
  };

  // Audio playback
  const playAudio = async (msg) => {
    const url = matrix.mxcUrl(msg.url);
    if (!url) return;
    if (playingId === msg.id) {
      if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); }
      setPlayingId(null);
      return;
    }
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); }
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(st => { if (st.didJustFinish) setPlayingId(null); });
      await sound.playAsync();
      setPlayingId(msg.id);
    } catch(_) {}
  };

  const fmtTime = ts => { const d = new Date(ts); return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); };

  const renderMsg = ({ item }) => {
    const isMe = item.isMe;
    return (
      <TouchableOpacity activeOpacity={0.8} onLongPress={() => setSelectedMsg(item)} style={[s.msgRow, isMe && s.msgRowMe]}>
        {!isMe && <Text style={s.senderName}>{item.senderName}</Text>}
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleOther]}>
          {item.msgtype === 'm.image' && item.url && (
            <Image source={{ uri: matrix.mxcThumb(item.url) }} style={s.msgImage} resizeMode="cover" />
          )}
          {item.msgtype === 'm.audio' && (
            <TouchableOpacity style={s.audioRow} onPress={() => playAudio(item)}>
              <Ionicons name={playingId === item.id ? 'pause-circle' : 'play-circle'} size={36} color={colors.purple} />
              <View style={s.waveform}>{Array.from({length:20}).map((_,i) => <View key={i} style={[s.waveBar, { height: 4 + Math.sin(i*0.8)*10, backgroundColor: playingId === item.id ? colors.purple : 'rgba(124,106,239,0.5)' }]} />)}</View>
              <Text style={s.audioEmoji}>🎤</Text>
            </TouchableOpacity>
          )}
          {item.msgtype === 'm.file' && (
            <View style={s.fileRow}>
              <Ionicons name="document" size={24} color={colors.purple} />
              <Text style={s.fileName} numberOfLines={1}>{item.filename || item.body}</Text>
            </View>
          )}
          {item.msgtype === 'm.video' && (
            <View style={s.fileRow}>
              <Ionicons name="videocam" size={24} color={colors.purple} />
              <Text style={s.fileName}>Видео</Text>
            </View>
          )}
          {(item.msgtype === 'm.text' || (!['m.image','m.audio','m.file','m.video'].includes(item.msgtype))) && (
            <Text style={s.msgText}>{item.body}</Text>
          )}
          <View style={s.msgMeta}>
            {item.edited && <Text style={s.editedLabel}>ред.</Text>}
            <Text style={s.msgTime}>{fmtTime(item.ts)}</Text>
            {isMe && <Text style={s.check}>✓</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Context menu
  const ContextMenu = () => {
    if (!selectedMsg) return null;
    const msg = selectedMsg;
    const actions = [
      { icon: 'arrow-undo', label: 'Ответить', action: () => { setReplyTo(msg); setSelectedMsg(null); } },
      { icon: 'star', label: 'В избранное', action: () => { setSelectedMsg(null); } },
      { icon: 'copy', label: 'Копировать', action: () => { setSelectedMsg(null); } },
      { icon: 'arrow-redo', label: 'Переслать', action: () => { /* forward picker */ setSelectedMsg(null); } },
    ];
    if (msg.isMe && msg.msgtype === 'm.text') actions.push({ icon: 'pencil', label: 'Редактировать', action: () => { setEditing(msg); setText(msg.body); setSelectedMsg(null); } });
    if (msg.isMe) actions.push({ icon: 'trash', label: 'Удалить', action: async () => { await matrix.deleteMessage(roomId, msg.id); await loadMsgs(); setSelectedMsg(null); }, color: colors.red });

    return (
      <Modal transparent visible animationType="fade" onRequestClose={() => setSelectedMsg(null)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setSelectedMsg(null)}>
          <View style={s.ctxMenu}>
            <View style={s.reactions}>
              {['❤️','👍','😂','😮','😢','🔥'].map(e => (
                <TouchableOpacity key={e} onPress={() => { matrix.sendReaction(roomId, msg.id, e); setSelectedMsg(null); }} style={s.reactBtn}>
                  <Text style={s.reactEmoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {actions.map((a,i) => (
              <TouchableOpacity key={i} style={s.ctxItem} onPress={a.action}>
                <Ionicons name={a.icon} size={20} color={a.color || colors.purple} />
                <Text style={[s.ctxLabel, a.color && { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <View style={s.headerAvatar}><Text style={s.headerAvatarText}>{(roomName||'?')[0].toUpperCase()}</Text></View>
        <View style={{flex:1}}>
          <Text style={s.headerName} numberOfLines={1}>{roomName}</Text>
          <Text style={s.headerStatus}>онлайн</Text>
        </View>
        <TouchableOpacity style={s.headerBtn}><Ionicons name="call" size={20} color="#fff" /></TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList ref={flatRef} data={msgs} keyExtractor={i => i.id} renderItem={renderMsg}
        contentContainerStyle={s.msgList} onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })} />

      {/* Reply/Edit bar */}
      {(replyTo || editing) && (
        <View style={s.replyBar}>
          <View style={s.replyLine} />
          <View style={{flex:1}}>
            <Text style={s.replyTitle}>{editing ? 'Редактирование' : replyTo.senderName}</Text>
            <Text style={s.replyText} numberOfLines={1}>{editing ? editing.body : replyTo.body}</Text>
          </View>
          <TouchableOpacity onPress={() => { setReplyTo(null); setEditing(null); setText(''); }}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Recording bar */}
      {recording && (
        <View style={s.recBar}>
          <View style={s.recDot} />
          <Text style={s.recTime}>{Math.floor(recDuration/60)}:{(recDuration%60).toString().padStart(2,'0')}</Text>
          <View style={{flex:1}} />
          <TouchableOpacity onPress={() => stopRecord(false)}><Text style={s.recCancel}>Отмена</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => stopRecord(true)}><Text style={s.recSend}>Отправить</Text></TouchableOpacity>
        </View>
      )}

      {/* Input */}
      {!recording && (
        <View style={s.inputBar}>
          <TouchableOpacity onPress={pickImage} style={s.inputBtn}><Ionicons name="image" size={22} color={colors.textSecondary} /></TouchableOpacity>
          <TouchableOpacity onPress={pickFile} style={s.inputBtn}><Ionicons name="attach" size={22} color={colors.textSecondary} /></TouchableOpacity>
          <TextInput style={s.input} value={text} onChangeText={t => { setText(t); matrix.sendTyping(roomId, t.length > 0); }}
            placeholder="Сообщение" placeholderTextColor={colors.textSecondary} multiline maxLength={4096} />
          {text.trim() ? (
            <TouchableOpacity onPress={send} style={s.sendBtn}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={startRecord} style={s.sendBtn}><Ionicons name="mic" size={20} color="#fff" /></TouchableOpacity>
          )}
        </View>
      )}

      <ContextMenu />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 12, backgroundColor: colors.surface },
  backBtn: { padding: 8 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,106,239,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerAvatarText: { color: colors.purple, fontWeight: 'bold', fontSize: 16 },
  headerName: { color: '#fff', fontWeight: '600', fontSize: 16 },
  headerStatus: { color: colors.green, fontSize: 12 },
  headerBtn: { padding: 8 },
  msgList: { paddingHorizontal: 12, paddingVertical: 8 },
  msgRow: { marginVertical: 2, alignItems: 'flex-start' },
  msgRowMe: { alignItems: 'flex-end' },
  senderName: { color: colors.purple, fontSize: 12, fontWeight: '500', marginLeft: 12, marginBottom: 2 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10 },
  bubbleMe: { backgroundColor: colors.bubbleOut, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.bubbleIn, borderBottomLeftRadius: 4 },
  msgText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  msgImage: { width: 220, height: 180, borderRadius: 12, marginBottom: 4 },
  audioRow: { flexDirection: 'row', alignItems: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 8 },
  waveBar: { width: 3, borderRadius: 2 },
  audioEmoji: { marginLeft: 8, fontSize: 12 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileName: { color: '#fff', fontSize: 14, flex: 1 },
  msgMeta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 2 },
  editedLabel: { color: 'rgba(142,142,147,0.5)', fontSize: 10, marginRight: 4, fontStyle: 'italic' },
  msgTime: { color: 'rgba(142,142,147,0.7)', fontSize: 11 },
  check: { color: colors.purple, fontSize: 11, marginLeft: 4 },
  replyBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8 },
  replyLine: { width: 3, height: 36, backgroundColor: colors.purple, borderRadius: 2, marginRight: 8 },
  replyTitle: { color: colors.purple, fontSize: 13, fontWeight: '600' },
  replyText: { color: colors.textSecondary, fontSize: 13 },
  recBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.red, marginRight: 8 },
  recTime: { color: '#fff', fontSize: 16 },
  recCancel: { color: colors.red, marginRight: 16, fontWeight: '500' },
  recSend: { color: colors.purple, fontWeight: 'bold' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 8 },
  inputBtn: { padding: 8 },
  input: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 16, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  ctxMenu: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, width: '80%' },
  reactions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  reactBtn: { padding: 4 },
  reactEmoji: { fontSize: 24 },
  ctxItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  ctxLabel: { color: '#fff', fontSize: 16, marginLeft: 12 },
});
