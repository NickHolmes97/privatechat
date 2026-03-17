import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

export default function ReadReceipts({ readers, maxShow = 3 }) {
  if (!readers || readers.length === 0) return null;
  const shown = readers.slice(0, maxShow);
  const extra = readers.length - maxShow;
  
  return (
    <View style={s.row}>
      {shown.map((r, i) => (
        <View key={i} style={[s.avatar, {backgroundColor: colors.purple + '40', marginLeft: i > 0 ? -6 : 0}]}>
          <Text style={s.avatarText}>{(r.name || r.userId || '?')[0].toUpperCase()}</Text>
        </View>
      ))}
      {extra > 0 && <Text style={[s.extra, {color: colors.textSecondary}]}>+{extra}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginLeft: 4 },
  avatar: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#050508' },
  avatarText: { fontSize: 8, fontWeight: 'bold', color: '#fff' },
  extra: { fontSize: 10, marginLeft: 4 },
});
