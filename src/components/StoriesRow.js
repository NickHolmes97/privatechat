import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function StoriesRow() {
  const stories = [
    { name: 'Моя', isMine: true },
    { name: 'Антон', hasNew: true },
    { name: 'Макс', hasNew: true },
    { name: 'Анна', hasNew: false },
    { name: 'Дима', hasNew: false },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.row} contentContainerStyle={s.rowContent}>
      {stories.map((st, i) => (
        <TouchableOpacity key={i} style={s.item} onPress={() => {
          if (st.isMine) Alert.alert('Истории', 'Создание историй скоро!');
          else Alert.alert(st.name, 'Просмотр историй скоро!');
        }}>
          <View style={[s.ring, st.hasNew ? {borderColor: colors.purple} : st.isMine ? {borderColor: colors.textSecondary, borderStyle: 'dashed'} : {borderColor: colors.glassBorder}]}>
            <View style={[s.avatar, {backgroundColor: colors.purple + '30'}]}>
              {st.isMine ? (
                <Ionicons name="add" size={24} color={colors.purple} />
              ) : (
                <Text style={[s.avatarText, {color: colors.purple}]}>{st.name[0]}</Text>
              )}
            </View>
          </View>
          <Text style={[s.name, {color: colors.textSecondary}]} numberOfLines={1}>{st.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { maxHeight: 100, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 14 },
  item: { alignItems: 'center', width: 60 },
  ring: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  name: { fontSize: 11, marginTop: 4 },
});
