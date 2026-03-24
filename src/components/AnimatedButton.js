import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, StyleSheet } from 'react-native';

export default function AnimatedButton({ onPress, onLongPress, style, children, activeScale = 0.92 }) {
  const scale = useRef(new Animated.Value(1)).current;
  
  const onPressIn = () => {
    Animated.spring(scale, { toValue: activeScale, friction: 5, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }).start();
  };

  return (
    <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
