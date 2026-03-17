import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function ContactCard({ name, userId, onPress }) {
  return (
    <TouchableOpacity style={[s.card, {backgroundColor: colors.surfaceLight, borderColor: colors.glassBorder}]} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.avatar, {backgroundColor: colors.purple + '30'}]}>
        <Text style={{color: colors.purple, fontWeight: 'bold', fontSize: 18}}>{(name || '?')[0].toUpperCase()}</Text>
      </View>
      <View style={s.info}>
        <Text style={[s.name, {color: colors.text}]}>{name}</Text>
        <Text style={[s.uid, {color: colors.textSecondary}]}>{userId}</Text>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={colors.purple} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, gap: 12, marginVertical: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  uid: { fontSize: 12, marginTop: 2 },
});
