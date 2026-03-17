import React from 'react';
import { View, Image, TouchableOpacity, FlatList, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const TILE = (SW - GAP * (COLS - 1)) / COLS;

export default function MediaGrid({ visible, images, onSelect, onClose }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide">
      <View style={[s.container, {backgroundColor: colors.bg}]}>
        <View style={[s.header, {backgroundColor: colors.surface}]}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.title, {color: colors.text}]}>Медиа ({images.length})</Text>
          <View style={{width: 44}} />
        </View>
        <FlatList
          data={images}
          numColumns={COLS}
          keyExtractor={(_, i) => String(i)}
          renderItem={({item, index}) => (
            <TouchableOpacity onPress={() => onSelect(index)} activeOpacity={0.8}>
              <Image source={{uri: item.uri}} style={s.tile} />
            </TouchableOpacity>
          )}
          columnWrapperStyle={{gap: GAP}}
          ItemSeparatorComponent={() => <View style={{height: GAP}} />}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 8 },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  tile: { width: TILE, height: TILE, backgroundColor: '#1a1a2e' },
});
