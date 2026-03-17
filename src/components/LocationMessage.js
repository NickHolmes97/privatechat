import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function LocationMessage({ lat, lon, label }) {
  const mapUrl = `https://static-maps.yandex.ru/v1?ll=${lon},${lat}&z=15&size=300,200&l=map&pt=${lon},${lat},pm2rdm`;
  const openUrl = `https://www.google.com/maps?q=${lat},${lon}`;

  return (
    <TouchableOpacity style={s.container} onPress={() => Linking.openURL(openUrl)} activeOpacity={0.8}>
      <View style={s.mapPlaceholder}>
        <Ionicons name="location" size={40} color={colors.purple} />
        <Text style={[s.coords, {color: colors.textSecondary}]}>{lat.toFixed(4)}, {lon.toFixed(4)}</Text>
      </View>
      {label && <Text style={[s.label, {color: colors.text}]}>{label}</Text>}
      <Text style={[s.hint, {color: colors.purple}]}>📍 Открыть карту</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  mapPlaceholder: { width: 240, height: 140, backgroundColor: 'rgba(124,106,239,0.08)', justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  coords: { fontSize: 11, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '500', marginTop: 6 },
  hint: { fontSize: 12, marginTop: 4 },
});
