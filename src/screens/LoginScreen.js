import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import matrix from '../services/matrix';
import { saveSession } from '../services/storage';
import { colors } from '../utils/theme';

export default function LoginScreen({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isReg, setIsReg] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const scrollRef = useRef();
  const passRef = useRef();

  const submit = async () => {
    Keyboard.dismiss();
    if (!user.trim() || !pass.trim()) return setError('Заполните все поля');
    if (isReg && pass.length < 6) return setError('Пароль минимум 6 символов');
    setLoading(true); setError('');
    try {
      const r = isReg ? await matrix.register(user.trim(), pass) : await matrix.login(user.trim(), pass);
      await saveSession(r.access_token, r.user_id, r.device_id);
      onLogin();
    } catch (e) { setError(e.message || 'Ошибка'); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={[s.container, {backgroundColor: colors.bg}]} contentContainerStyle={s.scroll}
        ref={scrollRef} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={s.logo}>
          <Ionicons name="chatbubbles" size={48} color="#fff" />
        </View>
        <Text style={s.title}>PrivateChat</Text>
        <Text style={s.subtitle}>Безопасный мессенджер</Text>

        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <View style={s.tabs}>
            <TouchableOpacity style={[s.tab, !isReg && s.tabActive]} onPress={() => { setIsReg(false); setError(''); }}>
              <Text style={[s.tabText, !isReg && s.tabTextActive]}>Вход</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, isReg && s.tabActive]} onPress={() => { setIsReg(true); setError(''); }}>
              <Text style={[s.tabText, isReg && s.tabTextActive]}>Регистрация</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={s.input} placeholder="Имя пользователя" placeholderTextColor={colors.textSecondary}
            value={user} onChangeText={t => { setUser(t); setError(''); }} autoCapitalize="none" autoCorrect={false}
            returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />

          <View style={s.passWrap}>
            <TextInput ref={passRef} style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Пароль" placeholderTextColor={colors.textSecondary}
              value={pass} onChangeText={t => { setPass(t); setError(''); }} secureTextEntry={!showPass}
              returnKeyType="done" onSubmitEditing={submit}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)} />
            <TouchableOpacity style={s.eye} onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{isReg ? 'Создать аккаунт' : 'Войти'}</Text>}
          </TouchableOpacity>
        </View>
        <Text style={s.server}>Сервер: 45.83.178.10</Text>
        <View style={{ height: 300 }} />
      </ScrollView>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32, paddingBottom: 50 },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 40 },
  card: { width: '100%', backgroundColor: colors.glassBg, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder, padding: 24 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: colors.purple },
  tabText: { color: colors.textSecondary, fontSize: 14 },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, color: colors.text, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.glassBorder },
  passWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eye: { position: 'absolute', right: 12, top: 14 },
  error: { color: colors.red, fontSize: 13, marginBottom: 8 },
  btn: { backgroundColor: colors.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  server: { color: colors.textSecondary, fontSize: 12, marginTop: 16, opacity: 0.5 },
});
