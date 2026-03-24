import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, Image, KeyboardAvoidingView, Platform, Linking, Dimensions, Vibration, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio, Video } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import matrix from '../services/matrix';
import EmojiPicker from '../components/EmojiPicker';
import PollCreate from '../components/PollCreate';
import PollMessage from '../components/PollMessage';
import StickerPicker from '../components/StickerPicker';
import SelfDestructPicker from '../components/SelfDestructPicker';
import GifPicker from '../components/GifPicker';
import PinnedBar from '../components/PinnedBar';
import TypingIndicator from '../components/TypingIndicator';
import LinkPreview from '../components/LinkPreview';
import ScrollToBottom from '../components/ScrollToBottom';
import SchedulePicker from '../components/SchedulePicker';
import SelectionBar from '../components/SelectionBar';
import MediaGrid from '../components/MediaGrid';
import BookmarksList from '../components/BookmarksList';
import FormatBar from '../components/FormatBar';
import ReadReceipts from '../components/ReadReceipts';
import * as Location from 'expo-location';
import TranslateButton from '../components/TranslateButton';
import DoubleTapLike from '../components/DoubleTapLike';
import ContactCard from '../components/ContactCard';
import ChatExport from '../components/ChatExport';
import SharedLinks from '../components/SharedLinks';
import ConnectionBar from '../components/ConnectionBar';
import { colors, onThemeChange, getChatBg } from '../utils/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;

export default function ChatScreen({ route, navigation }) {
  const [, _themeForce] = React.useState(0);
  React.useEffect(() => { const u = onThemeChange(() => _themeForce(n=>n+1)); return u; }, []);

  const { roomId, roomName } = route.params;
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [recording, setRecording] = useState(null);
  const [recLocked, setRecLocked] = useState(false);
  const [micMode, setMicMode] = useState('voice'); // 'voice' or 'video'
  
  const recAnim = useRef(new Animated.Value(1)).current;
  const recSlideY = useRef(0);
  const micPressStart = useRef(0);
  const micStartedRec = useRef(false);
  const micTimer = useRef(null);
  const [showCircleCamera, setShowCircleCamera] = useState(false);
  const [circleRecording, setCircleRecording] = useState(false);
  const [circleDuration, setCircleDuration] = useState(0);
  const circleTimerRef = useRef(null);
  const cameraRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState('front');
  const recLockThreshold = -80;
  const [recDuration, setRecDuration] = useState(0);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPollCreate, setShowPollCreate] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showStickers, setShowStickers] = useState(false);
  const [selfDestructTimer, setSelfDestructTimer] = useState(0);
  const [showDestructPicker, setShowDestructPicker] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [showMediaGrid, setShowMediaGrid] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactResults, setContactResults] = useState([]);
  const [contactQuery, setContactQuery] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [showSharedLinks, setShowSharedLinks] = useState(false);
  const [connStatus, setConnStatus] = useState(null);
  const [forwardRooms, setForwardRooms] = useState([]);
  const [typingText, setTypingText] = useState('');
  const [onlineStatus, setOnlineStatus] = useState('');
  const flatRef = useRef();
  const soundRef = useRef();
  const recInterval = useRef();
  const inputRef = useRef();

  useEffect(() => {
    loadMsgs();
    const unsub = matrix.onRoomsUpdate(() => { loadMsgs(); updateStatus(); });
    updateStatus();
    const si = setInterval(updateStatus, 3000);
    return () => { unsub(); clearInterval(si); if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  const updateStatus = () => {
    const typing = matrix.getTypingInRoom(roomId);
    if (typing.length > 0) {
      const room = matrix.getRoom(roomId);
      const names = typing.map(u => room?.members[u] || u.split(':')[0].slice(1));
      setTypingText(names.length === 1 ? `${names[0]} печатает...` : 'печатают...');
    } else { setTypingText(''); }
    const room = matrix.getRoom(roomId);
    if (room) {
      const others = Object.keys(room.members).filter(k => k !== matrix.getUserId());
      if (others.length === 1) {
        const p = matrix.getPresence(others[0]);
        if (p.status === 'online') setOnlineStatus('онлайн');
        else if (p.status === 'unavailable') setOnlineStatus('был(а) недавно');
        else setOnlineStatus('оффлайн');
      } else { setOnlineStatus(`${Object.keys(room.members).length} участников`); }
    }
  };

  const loadMsgs = async () => {
    try {
      const m = await matrix.loadMessages(roomId);
      setMsgs(m);
      if (m.length) matrix.markRead(roomId, m[m.length-1].id);
    } catch(_){}
    setLoading(false);
  };

  const searchContacts = async (q) => {
    setContactQuery(q);
    if (q.length < 2) { setContactResults([]); return; }
    try {
      const users = await matrix.searchUsers(q);
      setContactResults(users.filter(u => u.userId !== matrix.getUserId()));
    } catch(e) {}
  };

  const sendContact = async (user) => {
    setShowContactPicker(false);
    setContactQuery('');
    setContactResults([]);
    await matrix.sendMessage(roomId, `📇 Контакт: ${user.displayName || user.userId}\n${user.userId}`);
  };

  const sendLocation = async () => {
    try {
      setAttachMenu(false);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Ошибка', 'Нет доступа к геолокации');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
      await matrix.sendMessage(roomId, `📍 Моя локация\n${url}`);
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const cycleVoiceSpeed = () => {
    const speeds = [1, 1.5, 2];
    const idx = speeds.indexOf(voiceSpeed);
    setVoiceSpeed(speeds[(idx + 1) % speeds.length]);
  };

  const sendGif = async (gif) => {
    setShowGif(false);
    try {
      await matrix.sendMessage(roomId, gif.url);
      await loadMsgs();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch(e) { Alert.alert('Error', e.message); }
  };

  const sendSticker = async (emoji) => {
    setShowStickers(false);
    try {
      await matrix.sendMessage(roomId, emoji);
      await loadMsgs();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch(e) { Alert.alert('Error', e.message); }
  };

  const addBookmark = (msg) => {
    setBookmarks(prev => [...prev, msg]);
    setSelectedMsg(null);
  };

  const formatText = (style) => {
    const wraps = {bold:'**',italic:'_',strike:'~~',code:'`',spoiler:'||'};
    const w = wraps[style] || '';
    setText(t => w + t + w);
  };

  const handleSchedule = (date) => {
    setShowSchedule(false);
    const t = text.trim();
    if (!t) return;
    const delay = date.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        try { await matrix.sendMessage(roomId, t); await loadMsgs(); } catch(e) {}
      }, delay);
      setText('');
      Alert.alert('\u2705', '\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0437\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E');
    }
  };

  const getSharedLinks = () => {
    const urlRe = /https?:\/\/[^\s]+/gi;
    return msgs.filter(m => m.body && urlRe.test(m.body)).map(m => ({
      url: m.body.match(urlRe)[0],
      senderName: m.senderName || m.sender,
      ts: m.ts,
    }));
  };

  const getMediaImages = () => {
    return msgs.filter(m => m.msgtype === 'm.image' && m.url).map(m => ({
      uri: m.url.startsWith('mxc://') ? 'http://45.83.178.10:8008/_matrix/media/v3/download/' + m.url.slice(6) : m.url,
    }));
  };

  const handleScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    setShowScrollBtn(distFromBottom > 300);
  };

  const insertEmoji = (emoji) => {
    setText(t => t + emoji);
    setShowEmoji(false);
  };

  const handleSendPoll = async (poll) => {
    try {
      await matrix.sendPoll(roomId, poll.question, poll.options, poll.multi, poll.anon);
      setShowPollCreate(false);
      await loadMsgs();
    } catch(e) { Alert.alert('Error', e.message); }
  };

  const handleVotePoll = async (msgId, answerId) => {
    try {
      await matrix.votePoll(roomId, msgId, answerId);
      await loadMsgs();
    } catch(e) { Alert.alert('Error', e.message); }
  };

  const doSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase();
    setSearchResults(msgs.filter(m => m.body && m.body.toLowerCase().includes(lower)));
  };

  const openGalleryView = () => {
    const images = msgs.filter(m => m.msgtype === 'm.image' && m.url).map(m => {
      const uri = m.url.startsWith('mxc://') ? 'http://45.83.178.10:8008/_matrix/media/v3/download/' + m.url.slice(6) : m.url;
      return { uri, id: m.id };
    });
    if (images.length === 0) return;
    setGalleryImages(images);
    setGalleryIndex(0);
  };


  const send = async () => {
    const t = text.trim(); if (!t) return;
    setText(''); setSending(true);
    try {
      if (editing) {
        await matrix.editMessage(roomId, editing.id, t);
        setEditing(null);
      } else if (replyTo) {
        await matrix.sendReply(roomId, t, replyTo);
        setReplyTo(null);
      } else {
        await matrix.sendMessage(roomId, t);
      }
      matrix.sendTyping(roomId, false);
      await loadMsgs();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setSending(false);
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, maxWidth: 1280, maxHeight: 1280 });
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
      await loadMsgs(); setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setSending(false);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('', 'Нет доступа к камере');
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7, maxWidth: 1280, maxHeight: 1280 });
    if (r.canceled) return;
    const asset = r.assets[0]; setSending(true);
    try {
      let info = { exists: true, size: 0 }; try { info = await FileSystem.getInfoAsync(asset.uri); } catch(_) {}
      const resp = await FileSystem.uploadAsync(
        `http://45.83.178.10:8008/_matrix/media/v3/upload?filename=photo.jpg`, asset.uri,
        { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': 'image/jpeg' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      );
      const { content_uri } = JSON.parse(resp.body);
      await matrix.sendImage(roomId, content_uri, 'photo.jpg', 'image/jpeg', info.size || 0);
      await loadMsgs();
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setSending(false);
  };

  const pickFile = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({});
      if (r.canceled) return;
      const file = r.assets[0]; setSending(true);
      const resp = await FileSystem.uploadAsync(
        `http://45.83.178.10:8008/_matrix/media/v3/upload?filename=${encodeURIComponent(file.name)}`, file.uri,
        { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': file.mimeType || 'application/octet-stream' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      );
      const { content_uri } = JSON.parse(resp.body);
      await matrix.sendFile(roomId, content_uri, file.name, file.mimeType || 'application/octet-stream', file.size || 0);
      await loadMsgs();
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setSending(false);
  };

  const recordVideo = async () => {
    setShowCircleCamera(true);
    // Auto-start recording after camera mounts (small delay for init)
    setTimeout(() => autoStartCircle.current = true, 500);
  };

  const autoStartCircle = useRef(false);

  const onCameraReady = () => {
    if (autoStartCircle.current) {
      autoStartCircle.current = false;
      startCircleRecording();
    }
  };

  const startCircleRecording = async () => {
    if (!cameraRef.current) return;
    try {
      setCircleRecording(true);
      setCircleDuration(0);
      Vibration.vibrate(30);
      circleTimerRef.current = setInterval(() => setCircleDuration(d => {
        if (d >= 59) { stopCircleRecording(true); return d; }
        return d + 1;
      }), 1000);
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      // This resolves when recording stops
      if (video && video.uri) {
        await sendCircleVideo(video.uri);
      }
    } catch(e) { Alert.alert('Ошибка', e.message); setCircleRecording(false); }
  };

  const stopCircleRecording = async (doSend = true) => {
    clearInterval(circleTimerRef.current);
    setCircleRecording(false);
    if (cameraRef.current) {
      try { cameraRef.current.stopRecording(); } catch(_) {}
    }
    if (!doSend) {
      setShowCircleCamera(false);
    }
    // The recorded video will be handled by recordAsync promise
  };

  const sendCircleVideo = async (uri) => {
    setShowCircleCamera(false);
    setSending(true);
    try {
      let info = { exists: true, size: 0 }; try { info = await FileSystem.getInfoAsync(uri); } catch(_) {}
      const resp = await FileSystem.uploadAsync(
        `http://45.83.178.10:8008/_matrix/media/v3/upload?filename=circle.mp4`, uri,
        { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': 'video/mp4' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      );
      const { content_uri } = JSON.parse(resp.body);
      await matrix.sendVideoCircle(roomId, content_uri, circleDuration * 1000, info.size || 0);
      await loadMsgs();
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setSending(false);
    setCircleDuration(0);
  };

  const startRecord = async () => {
    try {
      Vibration.vibrate(30);
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec); setRecDuration(0); setRecLocked(false);
      recInterval.current = setInterval(() => setRecDuration(d => d + 1), 1000);
      // Pulse animation
      const pulse = () => {
        Animated.sequence([
          Animated.timing(recAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
          Animated.timing(recAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start(() => pulse());
      };
      pulse();
    } catch(e) { Alert.alert('Ошибка', 'Нет доступа к микрофону'); }
  };

  const stopRecord = async (doSend = true) => {
    clearInterval(recInterval.current);
    recAnim.stopAnimation();
    recAnim.setValue(1);
    setRecLocked(false);
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      if (doSend) {
        const uri = recording.getURI();
        let info = { exists: true, size: 0 }; try { info = await FileSystem.getInfoAsync(uri); } catch(_) {}
        setSending(true);
        const resp = await FileSystem.uploadAsync(
          `http://45.83.178.10:8008/_matrix/media/v3/upload?filename=voice.m4a`, uri,
          { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': 'audio/mp4' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
        );
        const { content_uri } = JSON.parse(resp.body);
        await matrix.sendAudio(roomId, content_uri, recDuration * 1000, info.size || 0);
        await loadMsgs(); setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        setSending(false);
      }
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setRecording(null); setRecDuration(0);
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
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, staysActiveInBackground: false, playThroughEarpieceAndroid: false });
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(st => { if (st.didJustFinish) setPlayingId(null); });
      await sound.setRateAsync(voiceSpeed, true);
      await sound.playAsync(); setPlayingId(msg.id);
    } catch(e) { Alert.alert('Ошибка воспроизведения', e.message); }
  };

  const openFile = async (msg) => {
    const url = matrix.mxcUrl(msg.url);
    if (!url) return;
    try {
      const dl = await FileSystem.downloadAsync(url, FileSystem.cacheDirectory + (msg.filename || msg.body || 'file'));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(dl.uri);
      else Alert.alert('Скачано', dl.uri);
    } catch(e) { Alert.alert('Ошибка', e.message); }
  };

  const saveToFavorites = async (msg) => {
    try {
      const rid = await matrix.ensureSavedRoom();
      const prefix = msg.senderName ? `[${msg.senderName}] ` : '';
      if (msg.msgtype === 'm.text') await matrix.sendMessage(rid, prefix + msg.body);
      else if (msg.msgtype === 'm.image' && msg.url) await matrix.sendImage(rid, msg.url, msg.filename || 'image', msg.info?.mimetype || 'image/jpeg', msg.info?.size || 0);
      else if (msg.url) await matrix.sendFile(rid, msg.url, msg.filename || msg.body, msg.info?.mimetype || 'application/octet-stream', msg.info?.size || 0);
      else await matrix.sendMessage(rid, prefix + msg.body);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setSelectedMsg(null);
  };

  const onLongPressMsg = (msg) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMsg(msg);
  };

  const doForward = async (targetRoomId) => {
    if (!forwardMsg) return;
    try {
      if (forwardMsg.msgtype === 'm.text') await matrix.sendMessage(targetRoomId, forwardMsg.body);
      else if (forwardMsg.msgtype === 'm.image' && forwardMsg.url) await matrix.sendImage(targetRoomId, forwardMsg.url, forwardMsg.filename || 'image', forwardMsg.info?.mimetype || 'image/jpeg', forwardMsg.info?.size || 0);
      else if (forwardMsg.url) await matrix.sendFile(targetRoomId, forwardMsg.url, forwardMsg.filename || forwardMsg.body, forwardMsg.info?.mimetype || 'application/octet-stream', forwardMsg.info?.size || 0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch(e) { Alert.alert('Ошибка', e.message); }
    setForwardMsg(null); setForwardRooms([]);
  };

  // Helper functions
  const fmtTime = ts => { const d = new Date(ts); return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); };

  const friendlyDate = (ts) => {
    const d = new Date(ts); const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = (today - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000;
    if (diff === 0) return 'Сегодня'; if (diff === 1) return 'Вчера';
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const isRead = (msgId) => {
    const receipts = matrix.getReadReceipts(roomId);
    for (const [uid, r] of Object.entries(receipts)) {
      if (uid !== matrix.getUserId() && r.eventId === msgId) return true;
    }
    return false;
  };

  const getReaders = (msgId) => {
    const receipts = matrix.getReadReceipts(roomId);
    const readers = [];
    for (const [uid, r] of Object.entries(receipts)) {
      if (uid !== matrix.getUserId() && r.eventId === msgId) {
        readers.push({ userId: uid, name: uid.split(':')[0].slice(1) });
      }
    }
    return readers;
  };

  const renderTextWithLinks = (body) => {
    const parts = body.split(URL_REGEX);
    if (parts.length === 1) return <Text style={[s.msgText, {color: colors.text}]}>{body}</Text>;
    return (
      <Text style={[s.msgText, {color: colors.text}]}>
        {parts.map((part, i) => {
          if (URL_REGEX.test(part)) { URL_REGEX.lastIndex = 0; return <Text key={i} style={s.link} onPress={() => Linking.openURL(part)}>{part}</Text>; }
          return part;
        })}
      </Text>
    );
  };

  // Render message
  const renderMsg = ({ item, index }) => {
    const isMe = item.isMe;
    const prevMsg = index > 0 ? msgs[index-1] : null;
    const showDate = !prevMsg || new Date(prevMsg.ts).toDateString() !== new Date(item.ts).toDateString();
    const read = isMe && isRead(item.id);
    const showSender = !isMe && (!prevMsg || prevMsg.sender !== item.sender);

    // Check if reply
    const replyEventId = item.relatesTo?.['m.in_reply_to']?.event_id;
    const replyMsg = replyEventId ? msgs.find(m => m.id === replyEventId) : null;

    return (
      <View>
        {showDate && (
          <View style={s.dateSep}><View style={[s.dateSepLine, {backgroundColor: colors.glassBorder}]} /><Text style={s.dateSepText}>{friendlyDate(item.ts)}</Text><View style={[s.dateSepLine, {backgroundColor: colors.glassBorder}]} /></View>
        )}
        <DoubleTapLike onDoubleTap={() => matrix.sendReaction(roomId, item.id, '❤️')}>
        <TouchableOpacity activeOpacity={0.7} onLongPress={() => onLongPressMsg(item)} style={[s.msgRow, isMe && s.msgRowMe]}>
          {showSender && !isMe && <Text style={s.senderName}>{item.senderName}</Text>}
          <View style={[s.bubble, isMe ? [s.bubbleMe, {backgroundColor: colors.bubbleOut}] : [s.bubbleOther, {backgroundColor: colors.bubbleIn}]]}>
            {/* Reply preview */}
            {replyMsg && (
              <View style={s.replyPreview}>
                <View style={s.replyPreviewLine} />
                <View>
                  <Text style={s.replyPreviewName}>{replyMsg.senderName}</Text>
                  <Text style={s.replyPreviewText} numberOfLines={1}>{replyMsg.body}</Text>
                </View>
              </View>
            )}
            {/* Image */}
            {item.msgtype === 'm.image' && item.url && (
              <TouchableOpacity onPress={() => setViewImage(matrix.mxcUrl(item.url))}>
                <Image source={{ uri: matrix.mxcThumb(item.url) }} style={s.msgImage} resizeMode="cover" />
              </TouchableOpacity>
            )}
            {/* Audio */}
            {item.msgtype === 'm.audio' && (
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <TouchableOpacity style={[s.audioRow, {flex:1}]} onPress={() => playAudio(item)}>
                  <Ionicons name={playingId === item.id ? 'pause-circle' : 'play-circle'} size={36} color={colors.purple} />
                  <View style={s.waveform}>{Array.from({length:20}).map((_,i) => <View key={i} style={[s.waveBar, { height: 4 + Math.sin(i*0.8)*10, backgroundColor: playingId === item.id ? colors.purple : 'rgba(124,106,239,0.4)' }]} />)}</View>
                  {item.info?.duration > 0 && <Text style={s.audioDur}>{Math.floor(item.info.duration/60000)}:{Math.floor((item.info.duration%60000)/1000).toString().padStart(2,'0')}</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={cycleVoiceSpeed} style={{paddingHorizontal:6}}>
                  <Text style={{color:colors.purple, fontSize:12, fontWeight:'700'}}>{voiceSpeed}x</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* File */}
            {item.msgtype === 'm.file' && (
              <TouchableOpacity style={s.fileRow} onPress={() => openFile(item)}>
                <View style={s.fileIcon}><Ionicons name="document" size={20} color={colors.purple} /></View>
                <View style={{flex:1}}>
                  <Text style={s.fileName} numberOfLines={1}>{item.filename || item.body}</Text>
                  {item.info?.size > 0 && <Text style={s.fileSize}>{(item.info.size / 1024).toFixed(0)} КБ</Text>}
                </View>
                <Ionicons name="download-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {/* Video Circle */}
            {item.msgtype === 'm.video' && item.url && item['org.matrix.msc3245.voice'] && (
              <TouchableOpacity onPress={() => {
                if (playingId === item.event_id) { setPlayingId(null); }
                else { setPlayingId(item.event_id); }
              }} style={s.circleVideoWrap}>
                <Video
                  source={{ uri: matrix.mxcUrl(item.url) }}
                  style={s.circleVideoPlayer}
                  resizeMode="cover"
                  shouldPlay={playingId === item.event_id}
                  isLooping={false}
                  onPlaybackStatusUpdate={(st) => {
                    if (st.didJustFinish) setPlayingId(null);
                  }}
                />
                {playingId !== item.event_id && (
                  <View style={s.circlePlayOverlay}>
                    <Ionicons name="play" size={32} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            {/* Regular Video */}
            {item.msgtype === 'm.video' && item.url && !item['org.matrix.msc3245.voice'] && (
              <View style={s.videoWrap}>
                <Video source={{ uri: matrix.mxcUrl(item.url) }} style={s.videoPlayer}
                  useNativeControls resizeMode="cover" shouldPlay={false} />
              </View>
            )}
            {/* Text */}
            {(item.msgtype === 'm.text' || (!['m.image','m.audio','m.file','m.video'].includes(item.msgtype))) && renderTextWithLinks(item.body)}
            {/* Link Preview */}
            {item.msgtype === 'm.text' && (() => { const m = (item.body || '').match(/https?:\/\/[^\s]+/); return m ? <LinkPreview url={m[0]} /> : null; })()}
            {item.msgtype === 'm.text' && !isMe && <TranslateButton text={item.body} msgId={item.id} />}
            {/* Meta */}
            <View style={s.msgMeta}>
              {item.edited && <Text style={s.editedLabel}>ред.</Text>}
              <Text style={s.msgTime}>{fmtTime(item.ts)}</Text>
              {isMe && <Text style={[s.check, read && s.checkRead]}>{read ? '✓✓' : '✓'}</Text>}
            </View>
            {item.reactions && item.reactions.length > 0 && (
              <View style={s.msgReactions}>
                {item.reactions.map((r, i) => (
                  <TouchableOpacity key={i} onPress={() => matrix.sendReaction(roomId, item.id, r.emoji)}
                    style={[s.msgReactionBadge, r.byMe && s.msgReactionByMe]}>
                    <Text style={s.msgReactionEmoji}>{r.emoji}</Text>
                    {r.count > 1 && <Text style={s.msgReactionCount}>{r.count}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {isMe && <ReadReceipts readers={getReaders(item.id)} />}
          </View>
        </TouchableOpacity>
        </DoubleTapLike>
      </View>
    );
  };

  // Context Menu
  const ContextMenu = () => {
    if (!selectedMsg) return null;
    const msg = selectedMsg;
    const actions = [
        { icon: "pin", label: "Закрепить", action: () => { setPinnedMsg(selectedMsg?.body); setSelectedMsg(null); } },];

    actions.push({ icon: 'arrow-undo', label: 'Ответить', action: () => { setReplyTo(msg); setSelectedMsg(null); inputRef.current?.focus(); } });
    if (msg.isMe && msg.msgtype === 'm.text') {
      actions.push({ icon: 'pencil', label: 'Редактировать', action: () => { setEditing(msg); setText(msg.body); setSelectedMsg(null); inputRef.current?.focus(); } });
    }
    actions.push({ icon: 'copy', label: 'Копировать', action: async () => { await Clipboard.setStringAsync(msg.body); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setSelectedMsg(null); } });
    actions.push({ icon: 'star', label: 'В избранное', action: () => saveToFavorites(msg) });
    actions.push({ icon: 'arrow-redo', label: 'Переслать', action: () => { setForwardMsg(msg); setForwardRooms(matrix.getRoomList().filter(r => r.id !== roomId)); setSelectedMsg(null); } });
    if (msg.isMe) {
      actions.push({ icon: 'trash', label: 'Удалить', action: () => {
        Alert.alert('Удалить сообщение?', '', [
          { text: 'Отмена', style: 'cancel', onPress: () => setSelectedMsg(null) },
          { text: 'Удалить', style: 'destructive', onPress: async () => { await matrix.deleteMessage(roomId, msg.id); await loadMsgs(); setSelectedMsg(null); } }
        ]);
      }, color: colors.red });
    }

    return (
      <Modal transparent visible animationType="fade" onRequestClose={() => setSelectedMsg(null)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setSelectedMsg(null)}>
          <View style={s.ctxMenu}>
            {/* Message preview */}
            <View style={s.ctxPreview}>
              <Text style={s.ctxPreviewName}>{msg.senderName}</Text>
              <Text style={s.ctxPreviewText} numberOfLines={2}>{msg.msgtype === 'm.image' ? '📷 Фото' : msg.msgtype === 'm.audio' ? '🎤 Голосовое' : msg.body}</Text>
            </View>
            {/* Quick reactions */}
            <View style={s.reactions}>
              {['❤️','👍','😂','😮','😢','🔥','👎','🎉'].map(e => (
                <TouchableOpacity key={e} onPress={() => { matrix.sendReaction(roomId, msg.id, e); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedMsg(null); }} style={s.reactBtn}>
                  <Text style={s.reactEmoji}>{e}</Text>
                </TouchableOpacity>

              ))}
            </View>
            {/* Actions */}
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

  // Forward Picker
  const ForwardPicker = () => {
    if (!forwardMsg) return null;
    return (
      <Modal transparent visible animationType="slide" onRequestClose={() => setForwardMsg(null)}>
        <View style={s.forwardOverlay}>
          <View style={s.forwardSheet}>
            <View style={s.forwardHeader}>
              <Text style={s.forwardTitle}>Переслать в...</Text>
              <TouchableOpacity onPress={() => setForwardMsg(null)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <View style={s.forwardPreview}>
              <Text style={s.forwardPreviewText} numberOfLines={1}>{forwardMsg.msgtype === 'm.image' ? '📷 Фото' : forwardMsg.body}</Text>
            </View>
            <FlatList data={forwardRooms} keyExtractor={i => i.id} renderItem={({ item }) => (
              <TouchableOpacity style={s.forwardRoom} onPress={() => doForward(item.id)}>
                <View style={s.forwardAvatar}><Text style={s.forwardAvatarText}>{(item.name||'?')[0].toUpperCase()}</Text></View>
                <Text style={s.forwardRoomName} numberOfLines={1}>{item.name}</Text>
                <Ionicons name="send" size={18} color={colors.purple} />
              </TouchableOpacity>
            )} />
          </View>
        </View>
      </Modal>
    );
  };

  // Image Viewer
  const ImageViewer = () => {
    if (!viewImage) return null;
    return (
      <Modal transparent visible animationType="fade" onRequestClose={() => setViewImage(null)}>
        <View style={s.imageViewerBg}>
          <TouchableOpacity style={s.imageViewerClose} onPress={() => setViewImage(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: viewImage }} style={s.imageViewerImg} resizeMode="contain" />
          <View style={s.imageViewerActions}>
            <TouchableOpacity style={s.imageViewerBtn} onPress={async () => {
              try {
                const dl = await FileSystem.downloadAsync(viewImage, FileSystem.cacheDirectory + 'shared_image.jpg');
                if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(dl.uri);
              } catch(_){}
            }}>
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Attach menu
  const [attachMenu, setAttachMenu] = useState(false);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0} style={[s.container, {backgroundColor: getChatBg()}]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={s.headerInfo} onPress={() => navigation.navigate('roominfo', { roomId, roomName })}>
          <View style={s.headerAvatar}><Text style={s.headerAvatarText}>{(roomName||'?')[0].toUpperCase()}</Text></View>
        {/* <ConnectionBar status={connStatus} /> */}
        <PinnedBar message={pinnedMsg} onPress={() => {}} onClose={() => setPinnedMsg(null)} />
          <View style={{flex:1}}>
            <Text style={[s.headerName, {color: colors.text}]} numberOfLines={1}>{roomName}</Text>
            <Text style={[s.headerStatus, typingText ? s.headerTyping : (onlineStatus === 'онлайн' ? s.headerOnline : null)]}>
              {typingText || onlineStatus || ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.headerBtn} onPress={recordVideo}><Ionicons name="videocam" size={20} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={s.headerBtn}><Ionicons name="call" size={20} color="#fff" /></TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList ref={flatRef}
            onScroll={handleScroll}
            scrollEventThrottle={100} data={msgs} keyExtractor={i => i.id} renderItem={renderMsg}
        contentContainerStyle={s.msgList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<View style={s.emptyChat}><Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} /><Text style={s.emptyChatText}>Нет сообщений</Text></View>}
      />

      {/* Reply/Edit bar */}
      {(replyTo || editing) && (
        <View style={[s.replyBar, {backgroundColor: colors.surface}]}>
          <View style={s.replyLine} />
          <Ionicons name={editing ? 'pencil' : 'arrow-undo'} size={16} color={colors.purple} style={{marginRight:8}} />
          <View style={{flex:1}}>
            <Text style={s.replyTitle}>{editing ? 'Редактирование' : replyTo.senderName}</Text>
            <Text style={s.replyText} numberOfLines={1}>{editing ? editing.body : replyTo.body}</Text>
          </View>
          <TouchableOpacity onPress={() => { setReplyTo(null); setEditing(null); if (editing) setText(''); }}>
            <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Circle Camera */}
      {showCircleCamera && (
        <Modal visible animationType="fade" transparent={false} statusBarTranslucent>
          <View style={s.circleBg}>
            <View style={s.circlePreviewWrap}>
              <CameraView
                ref={cameraRef}
                style={s.circlePreview}
                facing={cameraFacing}
                mode="video"
                onCameraReady={onCameraReady}
              />
            </View>
            <Text style={s.circleTimer}>
              {Math.floor(circleDuration/60)}:{(circleDuration%60).toString().padStart(2,'0')}
            </Text>
            <View style={s.circleControls}>
              <TouchableOpacity onPress={() => { if (!circleRecording) { setShowCircleCamera(false); } else { stopCircleRecording(false); }}} style={s.circleCancel}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { if (!circleRecording) startCircleRecording(); else stopCircleRecording(true); }}
                style={[s.circleRecBtn, circleRecording && s.circleRecBtnActive]}
              >
                {circleRecording ? (
                  <View style={s.circleStopIcon} />
                ) : (
                  <View style={s.circleStartIcon} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCameraFacing(f => f === 'front' ? 'back' : 'front')} style={s.circleFlip}>
                <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Recording bar - shown above input during recording */}
      {recording && (
        <View style={[s.recBar, {backgroundColor: colors.surface}]}>
          <Animated.View style={[s.recDot, { transform: [{ scale: recAnim }] }]} />
          <Text style={s.recTime}>{Math.floor(recDuration/60)}:{(recDuration%60).toString().padStart(2,'0')}</Text>
          <View style={{flex:1}} />
          {recLocked ? (
            <>
              <TouchableOpacity onPress={() => stopRecord(false)} style={s.recCancelBtn}>
                <Ionicons name="trash-outline" size={24} color={colors.red} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => stopRecord(true)} style={s.recSendBtn}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <Text style={s.recSlideHint}>▲ закреп</Text>
          )}
        </View>
      )}

      {/* Attach menu */}
      {attachMenu && (
        <View style={[s.attachMenu, {backgroundColor: colors.surface}]}>
          <TouchableOpacity style={s.attachItem} onPress={() => { setAttachMenu(false); pickImage(); }}>
            <View style={[s.attachIcon, {backgroundColor:'#7C6AEF'}]}><Ionicons name="image" size={20} color="#fff" /></View>
            <Text style={s.attachLabel}>Галерея</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.attachItem} onPress={() => { setAttachMenu(false); takePhoto(); }}>
            <View style={[s.attachIcon, {backgroundColor:'#FF6B6B'}]}><Ionicons name="camera" size={20} color="#fff" /></View>
            <Text style={s.attachLabel}>Камера</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.attachItem} onPress={() => { setAttachMenu(false); pickFile(); }}>
            <View style={[s.attachIcon, {backgroundColor:'#51CF66'}]}><Ionicons name="document" size={20} color="#fff" /></View>
            <Text style={s.attachLabel}>Файл</Text>
          </TouchableOpacity>
            <TouchableOpacity style={s.attachItem} onPress={() => { setShowPollCreate(true); }}>
              <View style={[s.attachIcon, {backgroundColor:'#FFA500'}]}><Ionicons name="stats-chart" size={20} color="#fff" /></View>
              <Text style={s.attachLabel}>Опрос</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.attachItem} onPress={() => { setShowGif(true); }}>
              <View style={[s.attachIcon, {backgroundColor:'#9B59B6'}]}><Text style={{color:'#fff',fontWeight:'bold',fontSize:14}}>GIF</Text></View>
              <Text style={s.attachLabel}>GIF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.attachItem} onPress={sendLocation}>
              <View style={[s.attachIcon, {backgroundColor:'#2ECC71'}]}><Ionicons name="location" size={20} color="#fff" /></View>
              <Text style={s.attachLabel}>Локация</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.attachItem} onPress={() => { setAttachMenu(false); setShowContactPicker(true); }}>
              <View style={[s.attachIcon, {backgroundColor:'#3498DB'}]}><Ionicons name="person" size={20} color="#fff" /></View>
              <Text style={s.attachLabel}>Контакт</Text>
            </TouchableOpacity>

        </View>
      )}

      {/* Contact Picker */}
      {showContactPicker && (
        <Modal transparent visible animationType="slide" onRequestClose={() => setShowContactPicker(false)}>
          <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end'}}>
            <View style={{backgroundColor:colors.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:16, maxHeight:'60%'}}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                <Text style={{color:colors.text, fontSize:18, fontWeight:'700'}}>Отправить контакт</Text>
                <TouchableOpacity onPress={() => setShowContactPicker(false)}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
              </View>
              <TextInput style={{backgroundColor:colors.surfaceLight, color:colors.text, borderRadius:12, paddingHorizontal:14, paddingVertical:10, fontSize:15, marginBottom:12}}
                placeholder="Поиск пользователей..." placeholderTextColor={colors.textSecondary}
                value={contactQuery} onChangeText={searchContacts} autoFocus />
              <FlatList data={contactResults} keyExtractor={i => i.userId}
                renderItem={({item}) => <ContactCard name={item.displayName || item.userId.split(':')[0].slice(1)} userId={item.userId} onPress={() => sendContact(item)} />}
                ListEmptyComponent={contactQuery.length >= 2 ? <Text style={{color:colors.textSecondary, textAlign:'center', padding:20}}>Никого не найдено</Text> : null}
              />
            </View>
          </View>
        </Modal>
      )}
      {/* Format Bar */}
      {showFormat && <FormatBar onFormat={(style) => {
        const wrap = {bold:'**', italic:'_', strike:'~~', code:'`', spoiler:'||'}[style] || '';
        if (wrap) setText(t => wrap + t + wrap);
      }} />}
      {/* Input - always visible */}
      <View style={[s.inputBar, {backgroundColor: colors.surface}]}>
        {!recording && (
          <>
            <TouchableOpacity onPress={() => setAttachMenu(!attachMenu)} style={s.inputBtn}>
              <Ionicons name={attachMenu ? 'close' : 'add-circle'} size={26} color={colors.purple} />
            </TouchableOpacity>
            <TouchableOpacity style={s.inputBtn} onPress={() => setShowEmoji(!showEmoji)}><Ionicons name="happy-outline" size={22} color={colors.textSecondary} /></TouchableOpacity>
            <TouchableOpacity style={s.inputBtn} onPress={() => setShowStickers(!showStickers)}><Ionicons name="cube-outline" size={22} color={colors.textSecondary} /></TouchableOpacity>
            <TouchableOpacity style={s.inputBtn} onPress={() => setShowFormat(!showFormat)}><Ionicons name="text" size={20} color={showFormat ? colors.purple : colors.textSecondary} /></TouchableOpacity>
            <TextInput ref={inputRef} style={[s.input, {backgroundColor: colors.surfaceLight, color: colors.text}]} value={text}
              onChangeText={t => { setText(t); matrix.sendTyping(roomId, t.length > 0); }}
              placeholder="Сообщение..." placeholderTextColor={colors.textSecondary} multiline maxLength={4096} />
          </>
        )}
        {recording && (
          <View style={{flex:1, flexDirection:'row', alignItems:'center', paddingLeft: 8}}>
            <Ionicons name={micMode === 'voice' ? 'mic' : 'videocam'} size={20} color={colors.red} />
            <Text style={{color:colors.red, marginLeft:8, fontSize:14}}>Запись...</Text>
          </View>
        )}
        {text.trim() && !recording ? (
          <TouchableOpacity onPress={send} style={s.sendBtn}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
        ) : recording && recLocked ? null : (
          <View
            style={[s.micBtnWrap, recording ? {backgroundColor: colors.red} : {}]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              recSlideY.current = e.nativeEvent.pageY;
              micStartedRec.current = false;
              micTimer.current = setTimeout(() => {
                micStartedRec.current = true;
                if (micMode === 'video') {
                  recordVideo();
                } else {
                  startRecord();
                }
              }, 300);
            }}
            onResponderMove={(e) => {
              const dy = e.nativeEvent.pageY - recSlideY.current;
              if (dy < recLockThreshold && recording && !recLocked) {
                setRecLocked(true);
                Vibration.vibrate(30);
              }
            }}
            onResponderRelease={() => {
              clearTimeout(micTimer.current);
              if (micStartedRec.current) {
                if (recording && !recLocked) stopRecord(true);
              } else {
                setMicMode(m => m === 'voice' ? 'video' : 'voice');
                Vibration.vibrate(20);
              }
            }}
          >
            <Animated.View style={recording ? { transform: [{ scale: recAnim }] } : undefined}>
              <Ionicons name={micMode === 'voice' ? 'mic' : 'videocam'} size={20} color="#fff" />
            </Animated.View>
          </View>
        )}
      </View>

      <ContextMenu />
      <ForwardPicker />
      <ImageViewer />
    
        {showScrollBtn && <ScrollToBottom onPress={() => { flatRef.current?.scrollToEnd({animated: true}); setShowScrollBtn(false); }} unreadCount={0} />}
        {showGif && <GifPicker onSelect={sendGif} onClose={() => setShowGif(false)} />}
        {showStickers && <StickerPicker onSelect={sendSticker} onClose={() => setShowStickers(false)} />}
        {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
        {showExport && <ChatExport visible={true} roomName={roomName} messages={msgs} onClose={() => setShowExport(false)} />}
        {showSharedLinks && <SharedLinks visible={true} links={getSharedLinks()} onClose={() => setShowSharedLinks(false)} />}
        {showBookmarks && <BookmarksList visible={true} bookmarks={bookmarks} onJump={() => setShowBookmarks(false)} onRemove={(i) => setBookmarks(b => b.filter((_,idx) => idx !== i))} onClose={() => setShowBookmarks(false)} />}
        {showSchedule && <SchedulePicker visible={true} onSchedule={handleSchedule} onClose={() => setShowSchedule(false)} />}
        {showMediaGrid && <MediaGrid visible={true} images={getMediaImages()} onSelect={(i) => { setGalleryImages(getMediaImages()); setGalleryIndex(i); setShowMediaGrid(false); }} onClose={() => setShowMediaGrid(false)} />}
        {showDestructPicker && <SelfDestructPicker visible={true} current={selfDestructTimer} onSelect={(v) => { setSelfDestructTimer(v); setShowDestructPicker(false); }} onClose={() => setShowDestructPicker(false)} />}
        {showPollCreate && <PollCreate onSend={handleSendPoll} onClose={() => setShowPollCreate(false)} />}
        {searchMode && (
          <View style={[s.searchBar, {backgroundColor: colors.surface}]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput style={[s.searchInput, {color: colors.text}]} placeholder="Поиск..." placeholderTextColor={colors.textSecondary} value={searchQuery} onChangeText={doSearch} autoFocus />
            <Text style={{color: colors.textSecondary, fontSize: 12}}>{searchResults.length}</Text>
            <TouchableOpacity onPress={() => { setSearchMode(false); setSearchQuery(''); setSearchResults([]); }}><Ionicons name="close" size={20} color={colors.textSecondary} /></TouchableOpacity>
          </View>
        )}
        {galleryImages.length > 0 && (
          <Modal visible={true} transparent animationType="fade">
            <View style={s.imageViewerBg}>
              <TouchableOpacity style={s.imageViewerClose} onPress={() => setGalleryImages([])}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Image source={{uri: galleryImages[galleryIndex]?.uri}} style={s.imageViewerImg} resizeMode="contain" />
              {galleryImages.length > 1 && (
                <View style={s.imageViewerActions}>
                  <TouchableOpacity style={s.imageViewerBtn} onPress={() => setGalleryIndex(Math.max(0, galleryIndex - 1))}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={{color:'#fff',fontSize:16}}>{galleryIndex + 1} / {galleryImages.length}</Text>
                  <TouchableOpacity style={s.imageViewerBtn} onPress={() => setGalleryIndex(Math.min(galleryImages.length - 1, galleryIndex + 1))}>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingBottom: 14, paddingHorizontal: 14, backgroundColor: colors.surface, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, zIndex: 10 },
  backBtn: { padding: 8 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,106,239,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerAvatarText: { color: colors.purple, fontWeight: 'bold', fontSize: 16 },
  headerName: { color: colors.text, fontWeight: '600', fontSize: 16 },
  headerStatus: { color: colors.textSecondary, fontSize: 12 },
  headerOnline: { color: colors.green },
  headerTyping: { color: colors.purple },
  headerBtn: { padding: 8 },
  msgList: { paddingHorizontal: 12, paddingVertical: 8, flexGrow: 1 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyChatText: { color: colors.textSecondary, fontSize: 16, marginTop: 8 },
  dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, paddingHorizontal: 20 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dateSepText: { color: colors.textSecondary, fontSize: 11, marginHorizontal: 14, fontWeight: '600', backgroundColor: colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  msgRow: { marginVertical: 2, alignItems: 'flex-start' },
  msgRowMe: { alignItems: 'flex-end' },
  senderName: { color: colors.purple, fontSize: 12, fontWeight: '500', marginLeft: 12, marginBottom: 2 },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMe: { backgroundColor: colors.bubbleOut, borderBottomRightRadius: 4, elevation: 1, shadowColor: colors.purple, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
  bubbleCircle: { backgroundColor: "transparent", padding: 0, borderRadius: 0 },
  bubbleOther: { backgroundColor: colors.bubbleIn, borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  // Reply preview inside bubble
  replyPreview: { flexDirection: 'row', backgroundColor: 'rgba(124,106,239,0.15)', borderRadius: 8, padding: 8, marginBottom: 6 },
  replyPreviewLine: { width: 3, backgroundColor: colors.purple, borderRadius: 2, marginRight: 8 },
  replyPreviewName: { color: colors.purple, fontSize: 12, fontWeight: '600' },
  replyPreviewText: { color: colors.textSecondary, fontSize: 12 },
  msgText: { color: colors.text, fontSize: 15, lineHeight: 22, letterSpacing: 0.1 },
  link: { color: '#6CB4FF', textDecorationLine: 'underline' },
  msgImage: { width: 240, height: 200, borderRadius: 14, marginBottom: 4 },
  audioRow: { flexDirection: 'row', alignItems: 'center', minWidth: 180 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 8, flex: 1 },
  waveBar: { width: 3, borderRadius: 2 },
  audioDur: { color: colors.textSecondary, fontSize: 11, marginLeft: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 180 },
  fileIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(124,106,239,0.15)', justifyContent: 'center', alignItems: 'center' },
  fileName: { color: colors.text, fontSize: 14 },
  fileSize: { color: colors.textSecondary, fontSize: 11 },
  circleVideoWrap: { width: 200, height: 200, borderRadius: 100, overflow: 'hidden', borderWidth: 3, borderColor: colors.purple, marginBottom: 4 },
  circleVideoPlayer: { width: 200, height: 200 },
  circlePlayOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 100 },
  videoWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  videoPlayer: { width: 240, height: 180 },
  msgMeta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 2 },
  editedLabel: { color: 'rgba(142,142,147,0.5)', fontSize: 10, marginRight: 4, fontStyle: 'italic' },
  msgTime: { color: 'rgba(142,142,147,0.7)', fontSize: 11 },
  check: { color: 'rgba(142,142,147,0.5)', fontSize: 11, marginLeft: 4 },
  checkRead: { color: colors.green },
  // Reply/edit bar
  replyBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8 },
  replyLine: { width: 3, height: 36, backgroundColor: colors.purple, borderRadius: 2, marginRight: 8 },
  replyTitle: { color: colors.purple, fontSize: 13, fontWeight: '600' },
  replyText: { color: colors.textSecondary, fontSize: 13 },
  // Recording
  recBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.red, marginRight: 8 },
  recTime: { color: colors.text, fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  recCancelBtn: { paddingHorizontal: 12 },
  recCancel: { color: colors.red, fontWeight: '500' },
  recSendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center' },
  // Attach menu
  attachMenu: { flexDirection: 'row', backgroundColor: colors.surface, paddingVertical: 18, paddingHorizontal: 16, gap: 14, justifyContent: 'center', flexWrap: 'wrap', borderTopWidth: 0.5, borderTopColor: colors.glassBorder },
  attachItem: { alignItems: 'center', width: 70 },
  attachIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 6, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  attachLabel: { color: colors.textSecondary, fontSize: 11 },
  // Input
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 8 },
  inputBtn: { padding: 8 },
  input: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, color: colors.text, fontSize: 16, maxHeight: 120, borderWidth: 0.5, borderColor: 'rgba(124,106,239,0.15)' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center', marginLeft: 6, elevation: 4, shadowColor: colors.purple, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6 },
  micBtnWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 4, backgroundColor: colors.purple },
  micBtn: { padding: 10, marginLeft: 4 },
  modeToggle: { padding: 6 },
  recSlideHint: { color: colors.textSecondary, fontSize: 12, marginLeft: 8 },
  recLockHint: { color: colors.textSecondary, fontSize: 10, marginLeft: 4, marginRight: 8 },
  // Circle camera
  circleBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  circlePreviewWrap: { width: 280, height: 280, borderRadius: 140, overflow: 'hidden', borderWidth: 3, borderColor: colors.purple },
  circlePreview: { width: 280, height: 280 },
  circleTimer: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  circleControls: { flexDirection: 'row', alignItems: 'center', marginTop: 40, gap: 40 },
  circleCancel: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  circleRecBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  circleRecBtnActive: { borderColor: colors.red },
  circleStartIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.red },
  circleStopIcon: { width: 28, height: 28, borderRadius: 4, backgroundColor: colors.red },
  circleFlip: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  // Reactions on messages
  msgReactions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 4 },
  msgReactionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(124,106,239,0.15)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  msgReactionByMe: { backgroundColor: 'rgba(124,106,239,0.35)', borderWidth: 1, borderColor: 'rgba(124,106,239,0.5)' },
  msgReactionEmoji: { fontSize: 14 },
  msgReactionCount: { fontSize: 11, color: '#fff', marginLeft: 3 },
  // Context menu
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  ctxMenu: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, width: '85%', maxWidth: 340, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  ctxPreview: { backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 10, marginBottom: 12 },
  ctxPreviewName: { color: colors.purple, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  ctxPreviewText: { color: colors.textSecondary, fontSize: 13 },
  reactions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14, backgroundColor: colors.surfaceLight, borderRadius: 28, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 0.5, borderColor: 'rgba(124,106,239,0.1)' },
  reactBtn: { padding: 4 },
  reactEmoji: { fontSize: 22 },
  ctxItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  ctxLabel: { color: colors.text, fontSize: 16, marginLeft: 14 },
  // Forward
  forwardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  forwardSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 30 },
  forwardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  forwardTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  forwardPreview: { backgroundColor: colors.surfaceLight, marginHorizontal: 16, marginVertical: 8, borderRadius: 10, padding: 10 },
  forwardPreviewText: { color: colors.textSecondary, fontSize: 13 },
  forwardRoom: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
  forwardAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(124,106,239,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  forwardAvatarText: { color: colors.purple, fontWeight: 'bold', fontSize: 16 },
  forwardRoomName: { color: colors.text, fontSize: 16, flex: 1 },
  // Image viewer
  imageViewerBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  imageViewerClose: { position: 'absolute', top: 50, right: 16, zIndex: 10, padding: 8 },
  imageViewerImg: { width: SCREEN_W, height: SCREEN_H * 0.8 },
  imageViewerActions: { position: 'absolute', bottom: 40, flexDirection: 'row', gap: 20 },
  imageViewerBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
});
