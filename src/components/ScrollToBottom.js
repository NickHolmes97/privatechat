import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function ScrollToBottom({ onPress, unreadCount }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start();
    // Bounce arrow
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 4, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{position:'absolute', bottom:80, right:16, transform:[{scale:scaleAnim}]}}>
      <TouchableOpacity style={[s.btn, {backgroundColor: colors.surface, borderColor: colors.glassBorder}]} onPress={onPress} activeOpacity={0.7}>
        <Animated.View style={{transform:[{translateY: bounceAnim}]}}>
          <Ionicons name="chevron-down" size={22} color={colors.purple} />
        </Animated.View>
        {unreadCount > 0 && (
          <View style={[s.badge, {backgroundColor: colors.purple}]}>
            <Text style={s.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  btn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: colors.purple, shadowOffset: {width:0,height:3}, shadowOpacity: 0.3, shadowRadius: 8 },
  badge: { position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
