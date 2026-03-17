import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPin, setPin, clearPin } from '../services/storage';
import { colors, onThemeChange } from '../utils/theme';
import * as Haptics from 'expo-haptics';

export default function PrivacyScreen({ navigation }) {
  const [, _themeForce] = React.useState(0);
  React.useEffect(() => { const u = onThemeChange(() => _themeForce(n=>n+1)); return u; }, []);

  const [lastSeen, setLastSeen] = useState('all');
  const [profilePhoto, setProfilePhoto] = useState('all');
  const [readReceipts, setReadReceipts] = useState(true);
  const [forwardLinks, setForwardLinks] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pickerModal, setPickerModal] = useState(null); // 'lastSeen' | 'profilePhoto'

  React.useEffect(() => { getPin().then(p => setHasPin(!!p)); }, []);

  const savePin = async () => {
    if (pinCode.length < 4) return Alert.alert('', 'Минимум 4 цифры');
    await setPin(pinCode);
    setHasPin(true); setPinModal(false); setPinCode('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removePin = () => {
    Alert.alert('Убрать PIN?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Убрать', style: 'destructive', onPress: async () => {
        await clearPin(); setHasPin(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }}
    ]);
  };

  const labels = { all: 'Все', contacts: 'Контакты', nobody: 'Никто' };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.text}]}>Конфиденциальность</Text>
        <View style={{width:44}} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>Приватность</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <MenuItem label="Последний визит" value={labels[lastSeen]} onPress={() => setPickerModal('lastSeen')} />
          <View style={s.divider} />
          <MenuItem label="Фото профиля" value={labels[profilePhoto]} onPress={() => setPickerModal('profilePhoto')} />
          <View style={s.divider} />
          <MenuItem label="Пересылка сообщений" right={
            <Switch value={forwardLinks} onValueChange={setForwardLinks} trackColor={{true: colors.purple}} thumbColor="#fff" />
          } />
          <View style={s.divider} />
          <MenuItem label="Отчёты о прочтении" right={
            <Switch value={readReceipts} onValueChange={setReadReceipts} trackColor={{true: colors.purple}} thumbColor="#fff" />
          } />
        </View>
        <Text style={s.sectionHint}>Если вы отключите отчёты о прочтении, вы тоже не сможете видеть отчёты других людей.</Text>

        <Text style={s.sectionTitle}>Безопасность</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <MenuItem label="Код-пароль" value={hasPin ? 'Включён' : 'Выключен'}
            onPress={() => hasPin ? removePin() : setPinModal(true)} />
          <View style={s.divider} />
          <MenuItem label="Скрытые чаты" value={hasPin ? 'Защищены' : 'Не настроено'} />
        </View>
        <Text style={s.sectionHint}>Код-пароль защищает доступ к скрытым чатам.</Text>

        <View style={{height: 50}} />
      </ScrollView>

      {/* Picker modal */}
      <Modal visible={!!pickerModal} transparent animationType="slide" onRequestClose={() => setPickerModal(null)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setPickerModal(null)}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{pickerModal === 'lastSeen' ? 'Последний визит' : 'Фото профиля'}</Text>
            {['all', 'contacts', 'nobody'].map(val => (
              <TouchableOpacity key={val} style={s.optionRow} onPress={() => {
                if (pickerModal === 'lastSeen') setLastSeen(val);
                else setProfilePhoto(val);
                setPickerModal(null);
              }}>
                <Text style={s.optionText}>{labels[val]}</Text>
                {(pickerModal === 'lastSeen' ? lastSeen : profilePhoto) === val && (
                  <Ionicons name="checkmark" size={22} color={colors.purple} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PIN modal */}
      <Modal visible={pinModal} transparent animationType="slide" onRequestClose={() => setPinModal(false)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setPinModal(false)}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Установить PIN</Text>
            <TextInput style={s.pinInput} value={pinCode} onChangeText={setPinCode}
              keyboardType="number-pad" maxLength={6} secureTextEntry
              placeholder="Введите PIN (4-6 цифр)" placeholderTextColor={colors.textSecondary} autoFocus />
            <TouchableOpacity style={s.pinBtn} onPress={savePin}>
              <Text style={s.pinBtnText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function MenuItem({ label, value, onPress, right }) {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={ms.row} onPress={onPress} activeOpacity={0.6}>
      <Text style={ms.label}>{label}</Text>
      {right || (value ? <Text style={ms.value}>{value}</Text> : null)}
      {onPress && !right && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{marginLeft:4}} />}
    </W>
  );
}

const ms = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  label: { color: '#fff', fontSize: 16, flex: 1 },
  value: { color: colors.textSecondary, fontSize: 14 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 8 },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  scroll: { flex: 1 },
  sectionTitle: { color: colors.purple, fontSize: 14, fontWeight: '600', marginTop: 24, marginBottom: 6, marginLeft: 20 },
  sectionHint: { color: colors.textSecondary, fontSize: 13, marginHorizontal: 20, marginTop: 8, lineHeight: 18 },
  card: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginLeft: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.glassBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  optionText: { color: '#fff', fontSize: 16 },
  pinInput: { backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 16, color: '#fff', fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 16 },
  pinBtn: { backgroundColor: colors.purple, borderRadius: 12, padding: 14, alignItems: 'center' },
  pinBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
