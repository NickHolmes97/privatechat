import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import matrix from '../services/matrix';
import { colors, onThemeChange } from '../utils/theme';

export default function SettingsScreen({ navigation }) {
  const [, _themeForce] = React.useState(0);
  React.useEffect(() => { const u = onThemeChange(() => _themeForce(n=>n+1)); return u; }, []);

  const uid = matrix.getUserId() || '';
  const username = uid.split(':')[0]?.replace('@','') || '';
  const [displayName, setDisplayName] = useState(username);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await matrix.getProfile();
        setDisplayName(p.displayname || username);
        if (p.avatar_url) setAvatarUrl(matrix.mxcThumb(p.avatar_url, 400, 400));
      } catch(_){}
    })();
  }, []);

  const pickAvatar = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8, allowsEditing: true, aspect: [1,1]
    });
    if (r.canceled) return;
    try {
      const resp = await FileSystem.uploadAsync(
        `http://45.83.178.10:8008/_matrix/media/v3/upload?filename=avatar.jpg`, r.assets[0].uri,
        { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': 'image/jpeg' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      );
      const { content_uri } = JSON.parse(resp.body);
      await matrix.setAvatar(content_uri);
      setAvatarUrl(matrix.mxcThumb(content_uri, 400, 400));
    } catch(e) {}
  };

  const initial = (displayName || '?')[0].toUpperCase();

  const menuItems = [
    { icon: 'person-outline', bg: '#007AFF', label: 'Аккаунт', sub: 'Имя пользователя, «О себе»', screen: 'profile' },
    { icon: 'chatbubble-outline', bg: '#AF52DE', label: 'Настройки чатов', sub: 'Обои, темы, анимации', screen: 'personalization' },
    { icon: 'key-outline', bg: '#FF9500', label: 'Конфиденциальность', sub: 'Время захода, устройства, PIN', screen: 'privacy' },
    { icon: 'notifications-outline', bg: '#FF3B30', label: 'Уведомления', sub: 'Звуки, вибрация, счётчик', screen: 'notifications' },
    { icon: 'arrow-down-circle-outline', bg: '#30D158', label: 'Данные и память', sub: 'Настройки загрузки медиафайлов', screen: 'datastorage' },
    { icon: 'folder-outline', bg: '#007AFF', label: 'Папки с чатами', sub: 'Сортировка чатов по папкам', screen: 'folders' },
    { icon: 'phone-portrait-outline', bg: '#5856D6', label: 'Устройства', sub: 'Управление активными сеансами', screen: 'devices' },
    { icon: 'language-outline', bg: '#AF52DE', label: 'Язык', sub: 'Русский', screen: 'language' },
    { icon: 'information-circle-outline', bg: '#8E8E93', label: 'О приложении', sub: 'Версия 1.1.0', screen: 'about' },
  ];

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header with avatar */}
        <View style={s.headerSection}>
          <View style={s.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity style={s.headerIcon}>
              <Ionicons name="search-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerIcon}>
              <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={s.avatarWrap}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatar} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarInitial}>{initial}</Text>
                </View>
              )}
              <View style={s.cameraBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Name & username */}
          <Text style={s.displayName}>{displayName}</Text>
          <Text style={s.userInfo}>@{username}</Text>
        </View>

        {/* Menu items */}
        <View style={s.menuList}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={s.menuRow}
              onPress={() => { if (item.screen) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(item.screen); } }}
              activeOpacity={0.6}
            >
              <View style={[s.menuIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={20} color="#fff" />
              </View>
              <View style={s.menuContent}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuSub}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },

  // Header section
  headerSection: {
    backgroundColor: colors.surface,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingHorizontal: 8, width: '100%',
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  // Avatar
  avatarWrap: { marginTop: 8, marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 42, fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },

  // Name
  displayName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userInfo: { color: colors.textSecondary, fontSize: 15, marginTop: 4 },

  // Menu
  menuList: { marginTop: 16 },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 20,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  menuContent: { flex: 1, marginLeft: 16 },
  menuLabel: { color: colors.text, fontSize: 16, fontWeight: '500' },
  menuSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
