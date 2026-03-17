import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function BookmarksList({ visible, bookmarks, onJump, onRemove, onClose }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide">
      <View style={[s.container, {backgroundColor: colors.bg}]}>
        <View style={[s.header, {backgroundColor: colors.surface}]}>
          <TouchableOpacity onPress={onClose}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
          <Text style={[s.title, {color: colors.text}]}>Закладки ({bookmarks.length})</Text>
          <View style={{width: 24}} />
        </View>
        {bookmarks.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
            <Text style={[s.emptyText, {color: colors.textSecondary}]}>Нет закладок</Text>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(_, i) => String(i)}
            renderItem={({item, index}) => (
              <TouchableOpacity style={[s.item, {borderBottomColor: colors.glassBorder}]} onPress={() => onJump(item)}>
                <View style={s.itemContent}>
                  <Text style={[s.sender, {color: colors.purple}]}>{item.senderName || item.sender}</Text>
                  <Text style={[s.body, {color: colors.text}]} numberOfLines={2}>{item.body}</Text>
                  <Text style={[s.time, {color: colors.textSecondary}]}>{new Date(item.ts).toLocaleString('ru')}</Text>
                </View>
                <TouchableOpacity onPress={() => onRemove(index)} style={s.removeBtn}>
                  <Ionicons name="bookmark" size={20} color={colors.purple} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, marginTop: 12 },
  item: { flexDirection: 'row', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  itemContent: { flex: 1 },
  sender: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  body: { fontSize: 14, marginBottom: 4 },
  time: { fontSize: 11 },
  removeBtn: { padding: 8 },
});
