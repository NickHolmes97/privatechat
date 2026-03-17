import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import matrix from '../services/matrix';
import { clearSession } from '../services/storage';
import QRProfile from '../components/QRProfile';
import StatusPicker from '../components/StatusPicker';
import { colors, onThemeChange } from '../utils/theme';

export default function ProfileScreen({ navigation, onLogout }) {
  const [showQR, setShowQR] = React.useState(false);
  const [showStatus, setShowStatus] = React.useState(false);
  const [userStatus, setUserStatus] = React.useState(null);
  const [, _themeForce] = React.useState(0);
  React.useEffect(() => { const u = onThemeChange(() => _themeForce(n=>n+1)); return u; }, []);

  const uid = matrix.getUserId() || '';
  const username = uid.split(':')[0]?.replace('@','') || '';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const p = await matrix.getProfile();
      const name = p.displayname || username;
      const parts = name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      if (p.avatar_url) setAvatarUrl(matrix.mxcThumb(p.avatar_url, 400, 400));
    } catch(_){}
    setLoading(false);
  };

  const saveName = async () => {
    const full = (firstName.trim() + ' ' + lastName.trim()).trim();
    if (!full) return;
    try {
      await matrix.setDisplayName(full);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch(e) { Alert.alert('Ошибка', e.message); }
  };

  const pickAvatar = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8, allowsEditing: true, aspect: [1,1]
    });
    if (r.canceled) return;
    const asset = r.assets[0];
    try {
      const resp = await FileSystem.uploadAsync(
        `http://45.83.178.10:8008/_matrix/media/v3/upload?filename=avatar.jpg`, asset.uri,
        { httpMethod: 'POST', headers: { 'Authorization': `Bearer ${matrix.getToken()}`, 'Content-Type': asset.mimeType || 'image/jpeg' }, uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT }
      );
      const { content_uri } = JSON.parse(resp.body);
      await matrix.setAvatar(content_uri);
      setAvatarUrl(matrix.mxcThumb(content_uri, 400, 400));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch(e) { Alert.alert('Ошибка', e.message); }
  };

  const copyText = async (text) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const doLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: async () => {
        await clearSession();
        matrix.logout();
        if (onLogout) onLogout();
      }}
    ]);
  };

  const initial = (firstName || username || '?')[0].toUpperCase();

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      {/* Header */}
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.text}]}>Аккаунт</Text>
        <TouchableOpacity onPress={saveName} style={s.headerBtn}>
          <Ionicons name="checkmark" size={24} color={colors.purple} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={s.cameraBadge}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Информация о Вас */}
        <Text style={s.sectionTitle}>Информация о Вас</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <TouchableOpacity style={s.infoRow} onPress={() => copyText('@' + username)}>
            <Ionicons name="at-outline" size={22} color={colors.textSecondary} />
            <View style={s.infoContent}>
              <Text style={s.infoValue}>@{username}</Text>
              <Text style={s.infoLabel}>Имя пользователя</Text>
            </View>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.infoRow} onPress={() => copyText(uid)}>
            <Ionicons name="finger-print-outline" size={22} color={colors.textSecondary} />
            <View style={s.infoContent}>
              <Text style={s.infoValue} numberOfLines={1}>{uid}</Text>
              <Text style={s.infoLabel}>Matrix ID</Text>
            </View>
          </TouchableOpacity>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Ionicons name="server-outline" size={22} color={colors.textSecondary} />
            <View style={s.infoContent}>
              <Text style={s.infoValue}>45.83.178.10</Text>
              <Text style={s.infoLabel}>Сервер</Text>
            </View>
          </View>
        </View>

        {/* Ваше имя */}
        <Text style={s.sectionTitle}>Ваше имя</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <View style={s.inputRow}>
            <TextInput
              style={s.nameInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Имя"
              placeholderTextColor={colors.textSecondary}
              onBlur={saveName}
            />
          </View>
          <View style={s.divider} />
          <View style={s.inputRow}>
            <TextInput
              style={s.nameInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Фамилия"
              placeholderTextColor={colors.textSecondary}
              onBlur={saveName}
            />
          </View>
        </View>

        {/* О себе */}
        <Text style={s.sectionTitle}>О себе</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <View style={[s.card, {backgroundColor: colors.surface}]}>
          <TouchableOpacity style={s.menuRow} onPress={() => setShowStatus(true)}>
            <Text style={{fontSize: 20, marginRight: 12}}>{userStatus?.emoji || '😊'}</Text>
            <Text style={[s.menuLabel, {color: colors.text}]}>{userStatus?.text || 'Установить статус'}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <TouchableOpacity style={s.menuRow} onPress={() => setShowQR(true)}>
            <Ionicons name="qr-code-outline" size={20} color={colors.purple} />
            <Text style={[s.menuLabel, {color: colors.text, marginLeft: 12}]}>QR-код профиля</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={s.bioRow}>
            <TextInput
              style={s.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Напишите что-нибудь о себе..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={140}
            />
            <Text style={s.bioCounter}>{140 - bio.length}</Text>
          </View>
        </View>
        <Text style={s.sectionHint}>
          Вы можете добавить несколько строк о себе. В настройках можно выбрать, кому они будут видны.
        </Text>

        {/* Безопасность */}
        <Text style={s.sectionTitle}>Безопасность</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <View style={s.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#51CF66" />
            <View style={s.infoContent}>
              <Text style={s.infoValue}>Активно</Text>
              <Text style={s.infoLabel}>Шифрование</Text>
            </View>
          </View>
          <View style={s.divider} />
          <TouchableOpacity style={s.infoRow} onPress={() => copyText(matrix.getDeviceId() || '')}>
            <Ionicons name="phone-portrait-outline" size={22} color={colors.textSecondary} />
            <View style={s.infoContent}>
              <Text style={s.infoValue}>{matrix.getDeviceId() || '—'}</Text>
              <Text style={s.infoLabel}>ID устройства</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Выход */}
        <TouchableOpacity style={s.logoutCard} onPress={doLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={s.logoutText}>Выход</Text>
        </TouchableOpacity>

        <View style={{height: 50}} />
      </ScrollView>
    
        <StatusPicker visible={showStatus} onSet={(s) => { setUserStatus(s); setShowStatus(false); }} onClose={() => setShowStatus(false)} />
        <QRProfile visible={showQR} userId={matrix.getUserId()} displayName={""} onClose={() => setShowQR(false)} />
      </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 8,
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  scroll: { flex: 1 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 42, fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: colors.bg,
  },

  // Sections
  sectionTitle: {
    color: colors.purple, fontSize: 14, fontWeight: '600',
    marginTop: 24, marginBottom: 6, marginLeft: 20,
  },
  sectionHint: {
    color: colors.textSecondary, fontSize: 13, marginHorizontal: 20, marginTop: 8, lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface, marginHorizontal: 16,
    borderRadius: 14, overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginLeft: 56 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  infoContent: { flex: 1, marginLeft: 14 },
  infoValue: { color: '#fff', fontSize: 16 },
  infoLabel: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },

  // Name inputs
  inputRow: { paddingHorizontal: 16 },
  nameInput: { color: '#fff', fontSize: 17, paddingVertical: 16 },

  // Bio
  bioRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
  bioInput: { color: '#fff', fontSize: 16, flex: 1, minHeight: 40, textAlignVertical: 'top' },
  bioCounter: { color: colors.textSecondary, fontSize: 14, marginLeft: 8, marginTop: 2 },

  // Logout
  logoutCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 24,
    borderRadius: 14, padding: 16, gap: 14,
  },
  logoutText: { color: '#FF3B30', fontSize: 17 },
});
