import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import * as Haptics from 'expo-haptics';

const LANGUAGES = [
  { code: 'ru', name: 'Русский', native: 'Русский' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'uk', name: 'Українська', native: 'Ukrainian' },
  { code: 'de', name: 'Deutsch', native: 'German' },
  { code: 'fr', name: 'Français', native: 'French' },
  { code: 'es', name: 'Español', native: 'Spanish' },
  { code: 'it', name: 'Italiano', native: 'Italian' },
  { code: 'pt', name: 'Português', native: 'Portuguese' },
  { code: 'zh', name: '中文', native: 'Chinese' },
  { code: 'ja', name: '日本語', native: 'Japanese' },
  { code: 'ko', name: '한국어', native: 'Korean' },
  { code: 'ar', name: 'العربية', native: 'Arabic' },
  { code: 'tr', name: 'Türkçe', native: 'Turkish' },
  { code: 'pl', name: 'Polski', native: 'Polish' },
  { code: 'ro', name: 'Română', native: 'Romanian' },
];

export default function LanguageScreen({ navigation }) {
  const [selected, setSelected] = useState('ru');

  const selectLang = (code) => {
    setSelected(code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In future: apply i18n here
    const name = LANGUAGES.find(l => l.code === code)?.name || code;
    Alert.alert('Язык', 'Выбран: ' + name);
  };

  return (
    <View style={[s.container, {backgroundColor: colors.bg}]}>
      <View style={[s.header, {backgroundColor: colors.surface}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: colors.text}]}>Язык</Text>
        <View style={{width:44}} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionHint}>Выберите язык интерфейса приложения</Text>

        <View style={[s.card, {backgroundColor: colors.surface}]}>
          {LANGUAGES.map((lang, i) => (
            <React.Fragment key={lang.code}>
              {i > 0 && <View style={s.divider} />}
              <TouchableOpacity style={s.langRow} onPress={() => selectLang(lang.code)} activeOpacity={0.6}>
                <View style={{flex:1}}>
                  <Text style={s.langName}>{lang.name}</Text>
                  <Text style={s.langNative}>{lang.native}</Text>
                </View>
                {selected === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.purple} />
                )}
              </TouchableOpacity>
            </React.Fragment>
          ))}
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
  sectionHint: { color: colors.textSecondary, fontSize: 14, marginHorizontal: 20, marginTop: 8, marginBottom: 16 },
  card: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginLeft: 16 },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  langName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  langNative: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },
});
