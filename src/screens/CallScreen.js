import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');

export default function CallScreen({ navigation, route }) {
  const { userName, isVideo, isIncoming } = route?.params || {};
  const [callState, setCallState] = useState(isIncoming ? 'incoming' : 'calling');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [videoOn, setVideoOn] = useState(isVideo);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (callState === 'calling') {
      // Simulate connect after 3s
      const t = setTimeout(() => setCallState('connected'), 3000);
      return () => clearTimeout(t);
    }
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [callState]);

  useEffect(() => {
    if (callState === 'calling' || callState === 'incoming') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [callState]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  };

  const endCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    clearInterval(timerRef.current);
    navigation.goBack();
  };

  const acceptCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCallState('connected');
  };

  const statusText = callState === 'incoming' ? 'Входящий звонок...' :
    callState === 'calling' ? 'Вызов...' :
    formatTime(duration);

  return (
    <View style={s.container}>
      {/* Avatar area */}
      <View style={s.avatarArea}>
        <Animated.View style={[s.avatarPulse, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[s.avatar, {backgroundColor: colors.purple + '30'}]}>
            <Text style={s.avatarText}>{(userName || '?')[0].toUpperCase()}</Text>
          </View>
        </Animated.View>
        <Text style={s.userName}>{userName || 'Пользователь'}</Text>
        <Text style={s.status}>{statusText}</Text>
        {isVideo && callState === 'connected' && (
          <Text style={s.videoHint}>Видеозвонки скоро!</Text>
        )}
      </View>

      {/* Controls */}
      <View style={s.controls}>
        {callState === 'incoming' ? (
          <View style={s.incomingBtns}>
            <TouchableOpacity style={[s.callBtn, {backgroundColor: colors.red}]} onPress={endCall}>
              <Ionicons name="call" size={28} color="#fff" style={{transform: [{rotate: '135deg'}]}} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.callBtn, {backgroundColor: colors.green}]} onPress={acceptCall}>
              <Ionicons name="call" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.row}>
              <TouchableOpacity style={[s.ctrlBtn, muted && {backgroundColor: '#fff'}]} onPress={() => { setMuted(!muted); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Ionicons name={muted ? 'mic-off' : 'mic'} size={24} color={muted ? '#000' : '#fff'} />
                <Text style={[s.ctrlLabel, muted && {color: '#000'}]}>Микрофон</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.ctrlBtn, speaker && {backgroundColor: '#fff'}]} onPress={() => { setSpeaker(!speaker); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Ionicons name={speaker ? 'volume-high' : 'volume-medium'} size={24} color={speaker ? '#000' : '#fff'} />
                <Text style={[s.ctrlLabel, speaker && {color: '#000'}]}>Динамик</Text>
              </TouchableOpacity>
              {isVideo && (
                <TouchableOpacity style={[s.ctrlBtn, !videoOn && {backgroundColor: '#fff'}]} onPress={() => { setVideoOn(!videoOn); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Ionicons name={videoOn ? 'videocam' : 'videocam-off'} size={24} color={!videoOn ? '#000' : '#fff'} />
                  <Text style={[s.ctrlLabel, !videoOn && {color: '#000'}]}>Камера</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={[s.endBtn, {backgroundColor: colors.red}]} onPress={endCall}>
              <Ionicons name="call" size={32} color="#fff" style={{transform: [{rotate: '135deg'}]}} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A1A', justifyContent: 'space-between', paddingTop: 80, paddingBottom: 60 },
  avatarArea: { alignItems: 'center' },
  avatarPulse: { marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  userName: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  status: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  videoHint: { color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 20 },
  controls: { alignItems: 'center' },
  row: { flexDirection: 'row', gap: 24, marginBottom: 40 },
  ctrlBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  ctrlLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 },
  endBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  incomingBtns: { flexDirection: 'row', gap: 60 },
  callBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
});
