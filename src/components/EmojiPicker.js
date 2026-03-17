import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../utils/theme';

const { width: SW } = Dimensions.get('window');
const COLS = 8;
const ESIZE = Math.floor((SW - 32) / COLS);

const CATEGORIES = {
  'Смайлы': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  'Жесты': ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄'],
  'Сердца': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫶','😍','🥰','😘','💋','💑','💏','👩‍❤️‍👨','👨‍❤️‍👨','👩‍❤️‍👩'],
  'Природа': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🫎','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🌸','💐','🌷','🌹','🥀','🌺','🌻','🌼','🌱','🌲','🌳','🌴','🌵','🍀','☀️','🌙','⭐','🌈','☁️','⛈️','❄️','🔥','💧'],
  'Еда': ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🌮','🌯','🫔','🥙','🧆','🥘','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍡','🧁','🎂','🍰','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','☕','🍵','🧃','🥤','🍶','🍺','🍻','🥂','🍷','🍸','🍹','🧊'],
  'Спорт': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤸','🤼','🤽','🤾','🤺','🧗','🏄','🚣','🏊','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🎗️','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🕹️','🧩'],
  'Путешествия': ['🚗','🚕','🚙','🏎️','🚌','🚎','🚐','🚑','🚒','🚓','🚔','🚍','🚘','🚖','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🛞','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🛶','🚤','🛳️','⛴️','🛥️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸'],
  'Объекты': ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧲','🔫','💣','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','🩻','💊','💉','🩸','🧬','🦠','🧫','🧪'],
  'Символы': ['❤️','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶','🔷','🔸','🔹','❇️','✳️','❌','⭕','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','❗','❕','❓','❔','‼️','⁉️','💤','♻️','✅','🆗','🆕','🆓','🔝','🔜','🆘','🔰','⬛','⬜','◼️','◻️','▪️','▫️','🔲','🔳','🟥','🟧','🟨','🟩','🟦','🟪','⬆️','↗️','➡️','↘️','⬇️','↙️','⬅️','↖️','↕️','↔️','↩️','↪️','⤴️','⤵️','🔃','🔄','🔙','🔚','🔛','🔜','🔝'],
};

const CAT_NAMES = Object.keys(CATEGORIES);
const CAT_ICONS = ['😀','👋','❤️','🐶','🍏','⚽','🚗','💡','❤️'];

export default function EmojiPicker({ onSelect, onClose }) {
  const [catIdx, setCatIdx] = useState(0);
  const [search, setSearch] = useState('');
  
  const currentEmojis = search
    ? Object.values(CATEGORIES).flat().filter(e => e.includes(search))
    : CATEGORIES[CAT_NAMES[catIdx]] || [];

  const renderEmoji = useCallback(({ item }) => (
    <TouchableOpacity style={es.emojiBtn} onPress={() => onSelect(item)} activeOpacity={0.6}>
      <Text style={es.emoji}>{item}</Text>
    </TouchableOpacity>
  ), [onSelect]);

  return (
    <View style={[es.container, {backgroundColor: colors.surface}]}>
      <View style={es.searchRow}>
        <TextInput
          style={[es.searchInput, {backgroundColor: colors.surfaceLight, color: colors.text}]}
          placeholder="Поиск..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity onPress={onClose} style={es.closeBtn}>
          <Text style={{color: colors.textSecondary, fontSize: 16}}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={es.tabs}>
        {CAT_NAMES.map((name, i) => (
          <TouchableOpacity key={name} onPress={() => { setCatIdx(i); setSearch(''); }}
            style={[es.tab, catIdx === i && !search && {backgroundColor: colors.purple+'30'}]}>
            <Text style={es.tabIcon}>{CAT_ICONS[i]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!search && <Text style={[es.catLabel, {color: colors.textSecondary}]}>{CAT_NAMES[catIdx]}</Text>}
      <FlatList
        data={currentEmojis}
        numColumns={COLS}
        keyExtractor={(item, i) => item + i}
        renderItem={renderEmoji}
        style={es.grid}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({length: ESIZE, offset: ESIZE * Math.floor(index / COLS), index})}
      />
    </View>
  );
}

const es = StyleSheet.create({
  container: { maxHeight: 320, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 },
  searchInput: { flex: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14 },
  closeBtn: { padding: 8 },
  tabs: { flexDirection: 'row', paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  tabIcon: { fontSize: 18 },
  catLabel: { fontSize: 12, fontWeight: '600', marginLeft: 12, marginTop: 4, marginBottom: 2 },
  grid: { paddingHorizontal: 4 },
  emojiBtn: { width: ESIZE, height: ESIZE, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 26 },
});
