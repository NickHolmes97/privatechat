import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, onThemeChange, setChatBg, getChatBg } from '../utils/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 10;
const TILE = (width - 32 - GAP * (COLS - 1)) / COLS;

const BACKGROUNDS = [
  { id: 'default', color: null, label: 'По умолч.' },
  { id: 'dark1', color: '#0D0D1A', label: 'Ночь' },
  { id: 'dark2', color: '#1A1A2E', label: 'Тёмно-синий' },
  { id: 'navy', color: '#0A192F', label: 'Морской' },
  { id: 'forest', color: '#0A1F0A', label: 'Лесной' },
  { id: 'wine', color: '#1A0A14', label: 'Винный' },
  { id: 'charcoal', color: '#1C1C1C', label: 'Уголь' },
  { id: 'purple1', color: '#150A30', label: 'Фиолет' },
  { id: 'ocean', color: '#051520', label: 'Океан' },
  { id: 'grad1', color: '#4A3078', label: 'Градиент 1' },
  { id: 'grad2', color: '#8B3060', label: 'Градиент 2' },
  { id: 'grad3', color: '#2A6080', label: 'Градиент 3' },
];

export default function ChatBgScreen({ navigation }) {
  const [, _themeForce] = React.useState(0);
  React.useEffect(() => { const u = onThemeChange(() => _themeForce(n=>n+1)); return u; }, []);

  const currentBg = getChatBg();
  const [selected, setSelected] = useState(
    BACKGROUNDS.find(b => b.color === currentBg)?.id || 'default'
  );

  const selectBg = (bg) => {
    setSelected(bg.id);
    setChatBg(bg.color);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.text}]}>Фон чата</Text>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={{color: colors.purple, fontWeight: '600'}}>Готово</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.sectionTitle, {color: colors.purple}]}>Цвета</Text>
        <View style={s.grid}>
          {BACKGROUNDS.map(bg => (
            <TouchableOpacity
              key={bg.id}
              style={[s.tile, selected === bg.id && {borderColor: colors.purple}]}
              onPress={() => selectBg(bg)}
              activeOpacity={0.7}
            >
              <View style={[s.tilePreview, { backgroundColor: bg.color || colors.bg }]}>
                {selected === bg.id && (
                  <View style={s.checkWrap}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.purple} />
                  </View>
                )}
              </View>
              <Text style={[s.tileLabel, {color: colors.textSecondary}]}>{bg.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 8 },
  headerBtn: { minWidth: 44, height: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scroll: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 10, marginLeft: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: GAP },
  tile: { width: TILE, marginBottom: 10, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  tilePreview: { width: '100%', height: TILE * 1.3, borderRadius: 10 },
  checkWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  tileLabel: { fontSize: 11, textAlign: 'center', marginTop: 4 },
});
