import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function ScrollToBottom({ onPress, unreadCount }) {
  return (
    <TouchableOpacity style={[s.btn, {backgroundColor: colors.surface, borderColor: colors.glassBorder}]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="chevron-down" size={20} color={colors.purple} />
      {unreadCount > 0 && (
        <View style={[s.badge, {backgroundColor: colors.purple}]}>
          <Text style={s.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: { position: 'absolute', bottom: 80, right: 16, width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.3, shadowRadius: 4 },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
