import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STATES = {
  connected: { bg: '#34C759', icon: 'wifi', text: 'Подключено' },
  connecting: { bg: '#FFA500', icon: 'sync', text: 'Подключение...' },
  disconnected: { bg: '#FF3B30', icon: 'cloud-offline', text: 'Нет связи' },
  updating: { bg: '#7C6AEF', icon: 'refresh', text: 'Обновление...' },
};

export default function ConnectionBar({ status }) {
  const slideAnim = useRef(new Animated.Value(-40)).current;
  const visible = !!status && status !== 'connected';

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -40,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const st = STATES[status] || STATES.connected;

  return (
    <Animated.View style={[s.bar, {backgroundColor: st.bg, transform: [{translateY: slideAnim}]}]}>
      <Ionicons name={st.icon} size={14} color="#fff" />
      <Text style={s.text}>{st.text}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  bar: { position: 'absolute', top: 0, left: 0, right: 0, height: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 100 },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
