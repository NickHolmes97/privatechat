import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { colors } from '../utils/theme';

const { width: SW } = Dimensions.get('window');
const COLS = 5;
const SSIZE = Math.floor((SW - 40) / COLS);

const PACKS = [
  { name: 'Смайлы', icon: '😀', stickers: ['😀','😃','😄','😁','😆','😅','🤣','😂','🥰','😍','🤩','😘','😎','🤓','🥳','😤','😭','🥺','😱','🤯','😴','🤮','👻','💀','🤖','👽','🎃','😈','💩','🤡'] },
  { name: 'Жесты', icon: '👋', stickers: ['👋','👍','👎','👊','✊','🤛','🤜','👏','🙌','🤝','🙏','💪','🫶','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','🫵','🖕','✋','🤚','🖐️','👌','🤌'] },
  { name: 'Сердца', icon: '❤️', stickers: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫶','💋','💏','💑','😍','🥰','😘','😻','💌','💐'] },
  { name: 'Животные', icon: '🐶', stickers: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🦄','🐝','🦋','🐌','🐞','🐙','🦑'] },
  { name: 'Еда', icon: '🍕', stickers: ['🍕','🍔','🍟','🌭','🍿','🧁','🍰','🍩','🍪','🍫','🍬','🍭','🍮','🍯','🥤','☕','🍵','🍺','🍻','🥂','🍷','🍸','🍹','🧊','🍉','🍓','🍑','🍌','🥑','🌮'] },
  { name: 'Спорт', icon: '⚽', stickers: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🥋','🏆','🥇','🥈','🥉','🏅','🎖️','🎯','🎮','🕹️','🎲','🧩','🎪','🎭','🎨','🎬','🎤','🎧','🎸'] },
  { name: 'Путешествия', icon: '✈️', stickers: ['✈️','🚀','🛸','🚗','🏎️','🚌','🚂','🛳️','⛵','🚁','🏠','🏰','🗼','🗽','🏝️','🌋','⛰️','🏔️','🗻','🌍','🌎','🌏','🌙','⭐','☀️','🌈','⛈️','❄️','🔥','💧'] },
];

export default function StickerPicker({ onSelect, onClose }) {
  const [packIdx, setPackIdx] = useState(0);

  return (
    <View style={[s.container, {backgroundColor: colors.surface}]}>
      <View style={s.header}>
        <Text style={[s.title, {color: colors.text}]}>Стикеры</Text>
        <TouchableOpacity onPress={onClose}><Text style={{color: colors.textSecondary, fontSize: 16}}>✕</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs}>
        {PACKS.map((p, i) => (
          <TouchableOpacity key={i} onPress={() => setPackIdx(i)}
            style={[s.tab, packIdx === i && {backgroundColor: colors.purple + '30'}]}>
            <Text style={s.tabIcon}>{p.icon}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={PACKS[packIdx].stickers}
        numColumns={COLS}
        keyExtractor={(item, i) => item + i}
        renderItem={({item}) => (
          <TouchableOpacity style={s.stickerBtn} onPress={() => onSelect(item)} activeOpacity={0.6}>
            <Text style={s.sticker}>{item}</Text>
          </TouchableOpacity>
        )}
        style={s.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { maxHeight: 300, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  title: { fontWeight: '700', fontSize: 16 },
  tabs: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, maxHeight: 44 },
  tab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 4 },
  tabIcon: { fontSize: 20 },
  grid: { paddingHorizontal: 8 },
  stickerBtn: { width: SSIZE, height: SSIZE, justifyContent: 'center', alignItems: 'center' },
  sticker: { fontSize: 36 },
});
