import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';
import * as Haptics from 'expo-haptics';

const TABS = [
  { key: 'all', label: 'Все' },
  { key: 'personal', label: 'Личные' },
  { key: 'groups', label: 'Группы' },
  { key: 'channels', label: 'Каналы' },
  { key: 'bots', label: 'Боты' },
  { key: 'unread', label: 'Непрочит.' },
];

export default function ChatTabs({ active, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.row} contentContainerStyle={s.content}>
      {TABS.map(tab => (
        <TouchableOpacity key={tab.key}
          style={[s.tab, active === tab.key && {backgroundColor: colors.purple}]}
          onPress={() => { onChange(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <Text style={[s.tabText, active === tab.key && {color: '#fff'}]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { maxHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  content: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(124,106,239,0.1)' },
  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
});
