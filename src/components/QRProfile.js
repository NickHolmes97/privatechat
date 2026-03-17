import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function QRProfile({ visible, userId, displayName, onClose }) {
  const shareProfile = () => {
    Share.share({ message: 'Напиши мне в PrivateChat! ID: ' + userId });
  };

  // Simple visual QR placeholder (real QR would need a library)
  const renderQR = () => {
    const size = 200;
    const cells = 21;
    const cellSize = size / cells;
    // Generate pseudo-QR pattern from userId hash
    const hash = userId.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    const pattern = [];
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        // Position detection patterns (corners)
        const isCorner = (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
        const isBorder = isCorner && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        const isData = !isCorner && ((hash * (r * cells + c + 1)) % 3 === 0);
        if (isBorder || isData) {
          pattern.push({ top: r * cellSize, left: c * cellSize, size: cellSize });
        }
      }
    }
    return (
      <View style={{width: size, height: size, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden'}}>
        {pattern.map((p, i) => (
          <View key={i} style={{position: 'absolute', top: p.top, left: p.left, width: p.size, height: p.size, backgroundColor: '#000'}} />
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.card, {backgroundColor: colors.surface}]}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={[s.avatarBig, {backgroundColor: colors.purple + '30'}]}>
            <Text style={{color: colors.purple, fontSize: 36, fontWeight: 'bold'}}>{(displayName || '?')[0].toUpperCase()}</Text>
          </View>
          <Text style={[s.name, {color: colors.text}]}>{displayName}</Text>
          <Text style={[s.uid, {color: colors.textSecondary}]}>{userId}</Text>
          <View style={s.qrWrap}>{renderQR()}</View>
          <TouchableOpacity style={[s.shareBtn, {backgroundColor: colors.purple}]} onPress={shareProfile}>
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={s.shareBtnText}>Поделиться</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { borderRadius: 24, padding: 24, alignItems: 'center', width: '100%', maxWidth: 340 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  avatarBig: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  uid: { fontSize: 13, marginBottom: 20 },
  qrWrap: { marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.2, shadowRadius: 8 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  shareBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
