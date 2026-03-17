import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, themes, setTheme, getThemeName } from '../utils/theme';
import * as Haptics from 'expo-haptics';

export default function PersonalizationScreen({ navigation }) {
  const [currentTheme, setCurrentTheme] = useState(getThemeName());
  const [, forceUpdate] = useState(0);
  const [fontSize, setFontSize] = useState('medium');
  const [chatBubbles, setChatBubbles] = useState(true);
  const [animations, setAnimations] = useState(true);

  const selectTheme = (name) => {
    setTheme(name);
    setCurrentTheme(name);
    forceUpdate(n => n + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const themeNames = { dark: 'Тёмная', light: 'Светлая', midnight: 'Полночь', ocean: 'Океан', rose: 'Роза' };
  const fontSizes = { small: 'Маленький', medium: 'Средний', large: 'Большой' };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.text}]}>Персонализация</Text>
        <View style={{width:44}} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Theme selection */}
        <Text style={s.sectionTitle}>Тема</Text>
        <View style={s.themeGrid}>
          {Object.entries(themes).map(([name, t]) => (
            <TouchableOpacity key={name} style={[s.themeCard, currentTheme === name && s.themeCardActive]}
              onPress={() => selectTheme(name)} activeOpacity={0.7}>
              <View style={[s.themePreview, { backgroundColor: t.bg }]}>
                <View style={s.themePreviewHeader}>
                  <View style={[s.themePreviewDot, {backgroundColor: t.purple}]} />
                  <View style={{flex:1, height:3, backgroundColor: t.text+'40', borderRadius:2}} />
                </View>
                <View style={{flex:1, justifyContent:'flex-end', padding:6}}>
                  <View style={[s.themePreviewBubbleL, {backgroundColor: t.surface}]} />
                  <View style={[s.themePreviewBubbleR, {backgroundColor: t.purple}]} />
                </View>
              </View>
              <Text style={[s.themeName, currentTheme === name && {color: colors.purple}]}>{themeNames[name]}</Text>
              {currentTheme === name && (
                <View style={s.themeCheck}><Ionicons name="checkmark-circle" size={18} color={colors.purple} /></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Chat settings */}
        <Text style={s.sectionTitle}>Чат</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <View style={s.menuRow}>
            <Text style={s.menuLabel}>Размер текста</Text>
            <View style={s.segmented}>
              {Object.entries(fontSizes).map(([key, label]) => (
                <TouchableOpacity key={key} style={[s.segBtn, fontSize === key && s.segBtnActive]}
                  onPress={() => setFontSize(key)}>
                  <Text style={[s.segText, fontSize === key && s.segTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.menuRow}>
            <Text style={s.menuLabel}>Углы сообщений</Text>
            <Switch value={chatBubbles} onValueChange={setChatBubbles} trackColor={{true: colors.purple}} thumbColor="#fff" />
          </View>
          <View style={s.divider} />
          <View style={s.menuRow}>
            <Text style={s.menuLabel}>Анимации</Text>
            <Switch value={animations} onValueChange={setAnimations} trackColor={{true: colors.purple}} thumbColor="#fff" />
          </View>
        </View>

        {/* Background */}
        <Text style={s.sectionTitle}>Фон чата</Text>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <TouchableOpacity style={s.menuRow} onPress={() => navigation.navigate('chatbg')}>
            <Ionicons name="image-outline" size={20} color={colors.purple} />
            <Text style={[s.menuLabel, {marginLeft:12}]}>Выбрать фон</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 8 },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  scroll: { flex: 1 },
  sectionTitle: { color: colors.purple, fontSize: 14, fontWeight: '600', marginTop: 24, marginBottom: 10, marginLeft: 20 },
  card: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginLeft: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuLabel: { color: colors.text, fontSize: 16, flex: 1 },

  // Theme grid
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  themeCard: {
    width: '30%', backgroundColor: colors.surface, borderRadius: 14,
    padding: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  themeCardActive: { borderColor: colors.purple },
  themePreview: { width: '100%', aspectRatio: 0.7, borderRadius: 8, overflow: 'hidden', marginBottom: 6 },
  themePreviewHeader: { flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4 },
  themePreviewDot: { width: 6, height: 6, borderRadius: 3 },
  themePreviewBubbleL: { height: 8, width: '60%', borderRadius: 4, marginBottom: 3 },
  themePreviewBubbleR: { height: 8, width: '50%', borderRadius: 4, alignSelf: 'flex-end' },
  themeName: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  themeCheck: { position: 'absolute', top: 6, right: 6 },

  // Segmented control
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceLight, borderRadius: 8, overflow: 'hidden' },
  segBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  segBtnActive: { backgroundColor: colors.purple, borderRadius: 8 },
  segText: { color: colors.textSecondary, fontSize: 12 },
  segTextActive: { color: '#fff', fontWeight: '600' },
});
