import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Telegram-style bubble tail
export function TailRight({ color }) {
  return (
    <Svg width={12} height={18} style={{position:'absolute', bottom:0, right:-10}} viewBox="0 0 12 18">
      <Path d="M0,0 Q0,18 12,18 L0,18 Z" fill={color} />
    </Svg>
  );
}

export function TailLeft({ color }) {
  return (
    <Svg width={12} height={18} style={{position:'absolute', bottom:0, left:-10}} viewBox="0 0 12 18">
      <Path d="M12,0 Q12,18 0,18 L12,18 Z" fill={color} />
    </Svg>
  );
}
