import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
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

  const submit = async () => {
    if (!user.trim() || !pass.trim()) return setError('Заполните все поля');
    if (isReg && pass.length < 6) return setError('Пароль минимум 6 символов');
    setLoading(true); setError('');
    try {
      const r = isReg ? await matrix.register(user.trim(), pass) : await matrix.login(user.trim(), pass);
      await saveSession(r.access_token, r.user_id, r.device_id);
      onLogin();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.logo}>
        <Ionicons name="chatbubbles" size={48} color="#fff" />
      </View>
      <Text style={s.title}>PrivateChat</Text>
      <Text style={s.subtitle}>Безопасный мессенджер</Text>

      <View style={s.card}>
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, !isReg && s.tabActive]} onPress={() => { setIsReg(false); setError(''); }}>
            <Text style={[s.tabText, !isReg && s.tabTextActive]}>Вход</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, isReg && s.tabActive]} onPress={() => { setIsReg(true); setError(''); }}>
            <Text style={[s.tabText, isReg && s.tabTextActive]}>Регистрация</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={s.input} placeholder="Имя пользователя" placeholderTextColor={colors.textSecondary}
          value={user} onChangeText={t => { setUser(t); setError(''); }} autoCapitalize="none" autoCorrect={false} />

        <View style={s.passWrap}>
          <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Пароль" placeholderTextColor={colors.textSecondary}
            value={pass} onChangeText={t => { setPass(t); setError(''); }} secureTextEntry={!showPass} />
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
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 40 },
  card: { width: '100%', backgroundColor: colors.glassBg, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder, padding: 24 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: colors.purple },
  tabText: { color: colors.textSecondary, fontSize: 14 },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, color: '#fff', fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.glassBorder },
  passWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eye: { position: 'absolute', right: 12, top: 14 },
  error: { color: colors.red, fontSize: 13, marginBottom: 8 },
  btn: { backgroundColor: colors.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  server: { color: colors.textSecondary, fontSize: 12, marginTop: 16, opacity: 0.5 },
});
