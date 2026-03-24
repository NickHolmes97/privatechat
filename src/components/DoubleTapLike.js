import React, { useRef, useState } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View, Text } from 'react-native';

export default function DoubleTapLike({ onDoubleTap, children }) {
  const lastTap = useRef(0);
  const heartAnim = useRef(new Animated.Value(0)).current;
  const heart2Anim = useRef(new Animated.Value(0)).current;
  const heart3Anim = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setShowHeart(true);
      // Main heart
      Animated.sequence([
        Animated.timing(heartAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(heartAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => setShowHeart(false));
      // Small particles
      Animated.sequence([
        Animated.delay(50),
        Animated.timing(heart2Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(heart2Anim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(heart3Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(heart3Anim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
      if (onDoubleTap) onDoubleTap();
    }
    lastTap.current = now;
  };

  const heartStyle = (anim, size, offsetX, offsetY) => ({
    opacity: anim,
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.3, 1] }) },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, offsetY || -20] }) },
      { translateX: offsetX || 0 },
    ],
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      {children}
      {showHeart && (
        <>
          <Animated.View style={[s.heart, heartStyle(heartAnim, 48, 0, -30)]}>
            <Text style={{fontSize: 48}}>\u2764\uFE0F</Text>
          </Animated.View>
          <Animated.View style={[s.heart, {left: '25%'}, heartStyle(heart2Anim, 24, -15, -45)]}>
            <Text style={{fontSize: 20}}>\u2764\uFE0F</Text>
          </Animated.View>
          <Animated.View style={[s.heart, {left: '55%'}, heartStyle(heart3Anim, 20, 20, -40)]}>
            <Text style={{fontSize: 16}}>\u2764\uFE0F</Text>
          </Animated.View>
        </>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  heart: { position: 'absolute', top: '30%', left: '35%', zIndex: 999 },
});
