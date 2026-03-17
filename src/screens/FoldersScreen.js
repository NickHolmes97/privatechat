import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import * as Haptics from 'expo-haptics';

export default function FoldersScreen({ navigation }) {
  const [folders, setFolders] = useState([
    { id: 1, name: 'Все чаты', icon: 'chatbubbles', count: 0, editable: false },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const createFolder = () => {
    if (!newName.trim()) return;
    setFolders([...folders, { id: Date.now(), name: newName.trim(), icon: 'folder', count: 0, editable: true }]);
    setNewName('');
    setShowCreate(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteFolder = (id) => {
    Alert.alert('Удалить папку?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => {
        setFolders(folders.filter(f => f.id !== id));
      }}
    ]);
  };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.text}]}>Папки с чатами</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={s.headerBtn}>
          <Ionicons name="add" size={24} color={colors.purple} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionHint}>
          Создайте папки для разных типов чатов и быстро переключайтесь между ними.
        </Text>

        <View style={[s.card, {backgroundColor: colors.surface}]}>
          {folders.map((f, i) => (
            <React.Fragment key={f.id}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.folderRow}>
                <View style={[s.folderIcon, { backgroundColor: colors.purple + '20' }]}>
                  <Ionicons name={f.icon} size={20} color={colors.purple} />
                </View>
                <View style={s.folderInfo}>
                  <Text style={s.folderName}>{f.name}</Text>
                  <Text style={s.folderCount}>{f.count} чатов</Text>
                </View>
                {f.editable && (
                  <TouchableOpacity onPress={() => deleteFolder(f.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.red} />
                  </TouchableOpacity>
                )}
              </View>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add-circle-outline" size={22} color={colors.purple} />
          <Text style={s.addText}>Создать папку</Text>
        </TouchableOpacity>

        <View style={{height: 50}} />
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setShowCreate(false)}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Новая папка</Text>
            <TextInput style={s.modalInput} value={newName} onChangeText={setNewName}
              placeholder="Название папки" placeholderTextColor={colors.textSecondary} autoFocus />
            <TouchableOpacity style={s.modalBtn} onPress={createFolder}>
              <Text style={s.modalBtnText}>Создать</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 8 },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  scroll: { flex: 1 },
  sectionHint: { color: colors.textSecondary, fontSize: 14, marginHorizontal: 20, marginTop: 8, marginBottom: 16, lineHeight: 20 },
  card: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginLeft: 60 },
  folderRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  folderIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  folderInfo: { flex: 1, marginLeft: 14 },
  folderName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  folderCount: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 8 },
  addText: { color: colors.purple, fontSize: 16, fontWeight: '500' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.glassBorder, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: { backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 16 },
  modalBtn: { backgroundColor: colors.purple, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
