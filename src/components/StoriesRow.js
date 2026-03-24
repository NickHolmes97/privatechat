import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Image, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { colors } from '../utils/theme';
import matrix from '../services/matrix';

const W = Dimensions.get('window').width;
const H = Dimensions.get('window').height;
const STORY_TTL = 24 * 60 * 60 * 1000; // 24h

let storiesCache = {};
let storyRoomId = null;

export default function StoriesRow() {
  const [stories, setStories] = useState([]);
  const [viewing, setViewing] = useState(null); // {userId, images, index}
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadStories();
    const interval = setInterval(loadStories, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStories = async () => {
    try {
      // Find or create stories room
      const rooms = matrix.getRoomList();
      let sr = rooms.find(r => r.name === '📸 Stories');
      if (!sr) {
        const r = await matrix.createGroup('📸 Stories', []);
        storyRoomId = r.room_id;
      } else {
        storyRoomId = sr.id;
      }
      
      // Load recent messages
      const msgs = await matrix.loadMessages(storyRoomId, 50);
      const now = Date.now();
      const valid = msgs.filter(m => m.msgtype === 'm.image' && (now - m.ts) < STORY_TTL);
      
      // Group by sender
      const grouped = {};
      valid.forEach(m => {
        if (!grouped[m.sender]) grouped[m.sender] = { userId: m.sender, name: m.senderName, images: [] };
        grouped[m.sender].images.push({ url: matrix.mxcUrl(m.url), ts: m.ts });
      });
      
      storiesCache = grouped;
      const myId = matrix.getUserId();
      const list = [];
      
      // My story first
      list.push({
        userId: myId,
        name: 'Моя',
        isMine: true,
        hasStory: !!grouped[myId],
        images: grouped[myId]?.images || [],
      });
      
      // Others
      Object.entries(grouped).forEach(([uid, data]) => {
        if (uid !== myId) {
          list.push({ userId: uid, name: data.name, isMine: false, hasStory: true, images: data.images });
        }
      });
      
      setStories(list);
    } catch(e) {}
  };

  const addStory = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (r.canceled) return;
    const asset = r.assets[0];
    try {
      if (!storyRoomId) return Alert.alert('Ошибка', 'Комната историй не найдена');
      const resp = await FileSystem.uploadAsync(
        `http://45.83.178.10:8008/_matrix/media/v3/upload?filename=story.jpg`,
        asset.uri,
        {
          httpMethod: 'POST',
          headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': asset.mimeType || 'image/jpeg' },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        }
      );
      const { content_uri } = JSON.parse(resp.body);
      await matrix.sendImage(storyRoomId, content_uri, 'story.jpg', asset.width, asset.height);
      loadStories();
    } catch(e) { Alert.alert('Ошибка', e.message); }
  };

  const viewStory = (st) => {
    if (st.isMine && !st.hasStory) { addStory(); return; }
    if (!st.images || st.images.length === 0) { if (st.isMine) addStory(); return; }
    setViewing({ userId: st.userId, name: st.name, images: st.images, index: 0 });
    setProgress(0);
  };

  // Auto-advance story
  useEffect(() => {
    if (!viewing) return;
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 1) {
          // Next image or close
          setViewing(v => {
            if (!v) return null;
            if (v.index + 1 < v.images.length) {
              return { ...v, index: v.index + 1 };
            }
            return null;
          });
          return 0;
        }
        return p + 0.02; // 5 seconds per story (50 * 100ms)
      });
    }, 100);
    return () => clearInterval(timer);
  }, [viewing?.userId, viewing?.index]);

  const nextStory = () => {
    if (!viewing) return;
    if (viewing.index + 1 < viewing.images.length) {
      setViewing({ ...viewing, index: viewing.index + 1 });
      setProgress(0);
    } else {
      setViewing(null);
    }
  };

  const prevStory = () => {
    if (!viewing) return;
    if (viewing.index > 0) {
      setViewing({ ...viewing, index: viewing.index - 1 });
      setProgress(0);
    }
  };

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.row} contentContainerStyle={s.rowContent}>
        {stories.map((st, i) => (
          <TouchableOpacity key={st.userId + i} style={s.item} onPress={() => viewStory(st)}>
            <View style={[s.ring, st.hasStory ? {borderColor: colors.purple} : st.isMine ? {borderColor: colors.textSecondary} : {borderColor: colors.glassBorder}]}>
              <View style={[s.avatar, {backgroundColor: colors.purple + '30'}]}>
                {st.isMine && !st.hasStory ? (
                  <Ionicons name="add" size={24} color={colors.purple} />
                ) : (
                  <Text style={[s.avatarText, {color: colors.purple}]}>{(st.name || '?')[0].toUpperCase()}</Text>
                )}
              </View>
            </View>
            <Text style={[s.name, {color: colors.textSecondary}]} numberOfLines={1}>{st.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Story Viewer */}
      {viewing && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setViewing(null)}>
          <View style={s.viewer}>
            {/* Progress bars */}
            <View style={s.progressRow}>
              {viewing.images.map((_, i) => (
                <View key={i} style={s.progressTrack}>
                  <View style={[s.progressFill, {
                    backgroundColor: '#fff',
                    width: i < viewing.index ? '100%' : i === viewing.index ? `${progress * 100}%` : '0%'
                  }]} />
                </View>
              ))}
            </View>

            {/* Header */}
            <View style={s.viewerHeader}>
              <View style={s.viewerAvatar}>
                <Text style={{color: colors.purple, fontWeight: 'bold', fontSize: 14}}>{(viewing.name || '?')[0].toUpperCase()}</Text>
              </View>
              <Text style={s.viewerName}>{viewing.name}</Text>
              <Text style={s.viewerTime}>{timeAgo(viewing.images[viewing.index]?.ts)}</Text>
              <TouchableOpacity onPress={() => setViewing(null)} style={{marginLeft: 'auto', padding: 8}}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Image */}
            <Image source={{uri: viewing.images[viewing.index]?.url}} style={s.viewerImage} resizeMode="contain" />

            {/* Tap zones */}
            <View style={s.tapZones}>
              <TouchableOpacity style={s.tapLeft} onPress={prevStory} activeOpacity={1} />
              <TouchableOpacity style={s.tapRight} onPress={nextStory} activeOpacity={1} />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  return `${h} ч`;
}

const s = StyleSheet.create({
  row: { maxHeight: 100, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 14 },
  item: { alignItems: 'center', width: 60 },
  ring: { width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  name: { fontSize: 11, marginTop: 4 },
  // Viewer
  viewer: { flex: 1, backgroundColor: '#000' },
  progressRow: { flexDirection: 'row', gap: 3, paddingHorizontal: 8, paddingTop: 50 },
  progressTrack: { flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  viewerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(124,106,239,0.3)', justifyContent: 'center', alignItems: 'center' },
  viewerName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  viewerTime: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  viewerImage: { flex: 1, width: W },
  tapZones: { position: 'absolute', top: 100, bottom: 0, left: 0, right: 0, flexDirection: 'row' },
  tapLeft: { flex: 1 },
  tapRight: { flex: 2 },
});
