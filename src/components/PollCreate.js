import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function PollCreate({ onSend, onClose }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multi, setMulti] = useState(false);
  const [anon, setAnon] = useState(true);

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, '']);
  };

  const updateOption = (i, text) => {
    const copy = [...options];
    copy[i] = text;
    setOptions(copy);
  };

  const removeOption = (i) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const send = () => {
    const q = question.trim();
    if (!q) { Alert.alert('', 'Введите вопрос'); return; }
    const opts = options.map(o => o.trim()).filter(Boolean);
    if (opts.length < 2) { Alert.alert('', 'Минимум 2 варианта'); return; }
    onSend({ question: q, options: opts, multi, anon });
  };

  return (
    <View style={[s.overlay]}>
      <View style={[s.sheet, {backgroundColor: colors.surface}]}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          <Text style={[s.title, {color: colors.text}]}>Новый опрос</Text>
          <TouchableOpacity onPress={send}><Text style={{color: colors.purple, fontWeight: '600', fontSize: 16}}>Отправить</Text></TouchableOpacity>
        </View>
        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
          <Text style={[s.label, {color: colors.textSecondary}]}>Вопрос</Text>
          <TextInput
            style={[s.input, {backgroundColor: colors.surfaceLight, color: colors.text}]}
            placeholder="Задайте вопрос..."
            placeholderTextColor={colors.textSecondary}
            value={question}
            onChangeText={setQuestion}
            multiline
          />
          <Text style={[s.label, {color: colors.textSecondary}]}>Варианты ответа</Text>
          {options.map((opt, i) => (
            <View key={i} style={s.optRow}>
              <TextInput
                style={[s.input, s.optInput, {backgroundColor: colors.surfaceLight, color: colors.text}]}
                placeholder={`Вариант ${i + 1}`}
                placeholderTextColor={colors.textSecondary}
                value={opt}
                onChangeText={t => updateOption(i, t)}
              />
              {options.length > 2 && (
                <TouchableOpacity onPress={() => removeOption(i)} style={s.removeBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.red} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {options.length < 10 && (
            <TouchableOpacity onPress={addOption} style={s.addBtn}>
              <Ionicons name="add-circle-outline" size={20} color={colors.purple} />
              <Text style={{color: colors.purple, marginLeft: 8}}>Добавить вариант</Text>
            </TouchableOpacity>
          )}
          <View style={[s.toggleRow, {borderTopColor: colors.glassBorder}]}>
            <Text style={{color: colors.text, fontSize: 15}}>Несколько ответов</Text>
            <Switch value={multi} onValueChange={setMulti} trackColor={{true: colors.purple}} thumbColor="#fff" />
          </View>
          <View style={s.toggleRow2}>
            <Text style={{color: colors.text, fontSize: 15}}>Анонимное</Text>
            <Switch value={anon} onValueChange={setAnon} trackColor={{true: colors.purple}} thumbColor="#fff" />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 100 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  title: { fontSize: 18, fontWeight: '700' },
  body: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 8 },
  optRow: { flexDirection: 'row', alignItems: 'center' },
  optInput: { flex: 1 },
  removeBtn: { padding: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  toggleRow2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
});
