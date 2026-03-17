import React, { useRef, useState } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View, Text } from 'react-native';

export default function DoubleTapLike({ onDoubleTap, children }) {
  const lastTap = useRef(0);
  const heartAnim = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      setShowHeart(true);
      Animated.sequence([
        Animated.timing(heartAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(heartAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(() => setShowHeart(false));
      if (onDoubleTap) onDoubleTap();
    }
    lastTap.current = now;
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      {children}
      {showHeart && (
        <Animated.View style={[s.heart, {
          opacity: heartAnim,
          transform: [{ scale: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) }]
        }]}>
          <Text style={s.heartEmoji}>❤️</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  heart: { position: 'absolute', top: '30%', left: '35%', zIndex: 999 },
  heartEmoji: { fontSize: 48 },
});
