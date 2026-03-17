import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function SlowModeBar({ seconds }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (seconds <= 0) return;
    const iv = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(iv); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [seconds]);

  if (remaining <= 0) return null;

  return (
    <View style={[s.bar, {backgroundColor: colors.surface}]}>
      <Ionicons name="hourglass-outline" size={14} color={colors.textSecondary} />
      <Text style={[s.text, {color: colors.textSecondary}]}>
        Медленный режим: {remaining}с
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  text: { fontSize: 12 },
});
