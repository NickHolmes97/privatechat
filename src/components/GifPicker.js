import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { colors } from '../utils/theme';

const { width: SW } = Dimensions.get('window');
const COLS = 2;
const GAP = 4;
const TILE_W = (SW - 24 - GAP) / COLS;

const TRENDING = ['funny','cat','dog','love','sad','dance','wow','hello','bye','ok','yes','no','think','celebrate','angry'];

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { searchGifs('trending'); }, []);

  const searchGifs = async (q) => {
    setLoading(true);
    try {
      // Use Tenor v2 API with default key
      const endpoint = q === 'trending'
        ? 'https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=30&media_filter=tinygif'
        : `https://tenor.googleapis.com/v2/search?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&q=${encodeURIComponent(q)}&limit=30&media_filter=tinygif`;
      const r = await fetch(endpoint);
      const data = await r.json();
      const results = (data.results || []).map(g => ({
        id: g.id,
        preview: g.media_formats?.tinygif?.url || g.media_formats?.gif?.url || '',
        url: g.media_formats?.gif?.url || g.media_formats?.tinygif?.url || '',
        title: g.title || '',
      }));
      setGifs(results);
    } catch(e) {
      console.log('GIF search error:', e);
      setGifs([]);
    }
    setLoading(false);
  };

  const onSearch = (text) => {
    setQuery(text);
    if (text.length > 2) {
      searchGifs(text);
    } else if (text.length === 0) {
      searchGifs('trending');
    }
  };

  return (
    <View style={[s.container, {backgroundColor: colors.surface}]}>
      <View style={s.header}>
        <TextInput
          style={[s.searchInput, {backgroundColor: colors.surfaceLight, color: colors.text}]}
          placeholder="🔍 Поиск GIF..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={onSearch}
        />
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Text style={{color: colors.textSecondary, fontSize: 16}}>✕</Text>
        </TouchableOpacity>
      </View>
      {!query && (
        <FlatList
          data={TRENDING}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          renderItem={({item}) => (
            <TouchableOpacity style={[s.tag, {backgroundColor: colors.surfaceLight}]} onPress={() => { setQuery(item); searchGifs(item); }}>
              <Text style={{color: colors.textSecondary, fontSize: 12}}>{item}</Text>
            </TouchableOpacity>
          )}
          style={s.tagRow}
        />
      )}
      {loading ? (
        <ActivityIndicator color={colors.purple} style={{padding: 20}} />
      ) : (
        <FlatList
          data={gifs}
          numColumns={COLS}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => onSelect(item)} activeOpacity={0.7}>
              <Image source={{uri: item.preview}} style={s.gif} />
            </TouchableOpacity>
          )}
          style={s.grid}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{gap: GAP}}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { maxHeight: 350, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 },
  searchInput: { flex: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14 },
  closeBtn: { padding: 8 },
  tagRow: { paddingHorizontal: 8, maxHeight: 36, marginBottom: 4 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 6 },
  grid: { paddingHorizontal: 8 },
  gif: { width: TILE_W, height: TILE_W * 0.75, borderRadius: 8, marginBottom: GAP, backgroundColor: '#1a1a1a' },
});
