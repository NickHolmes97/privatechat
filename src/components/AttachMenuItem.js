import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function AttachMenuItem({ icon, iconText, label, color, onPress, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: delay,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { scale: anim },
        { translateY: anim.interpolate({inputRange:[0,1], outputRange:[20,0]}) }
      ],
    }}>
      <TouchableOpacity style={s.item} onPress={onPress} activeOpacity={0.7}>
        <View style={[s.icon, {backgroundColor: color}]}>
          {icon ? <Ionicons name={icon} size={22} color="#fff" /> : 
           <Text style={{color:'#fff',fontWeight:'bold',fontSize:14}}>{iconText}</Text>}
        </View>
        <Text style={s.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  item: { alignItems: 'center', width: 70 },
  icon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 6, elevation: 3, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.25, shadowRadius: 4 },
  label: { color: colors.textSecondary, fontSize: 11 },
});
