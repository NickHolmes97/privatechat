import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { colors } from '../utils/theme';

const cache = {};

export default function LinkPreview({ url }) {
  const [data, setData] = useState(cache[url] || null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cache[url] || failed) return;
    (async () => {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await r.text();
        const getTag = (name) => {
          const m = html.match(new RegExp('<meta[^>]*property=["\'"]og:' + name + '["\'"\s][^>]*content=["\'"]([^"\'"]*)', 'i'));
          return m ? m[1] : null;
        };
        const title = getTag('title') || html.match(/<title[^>]*>([^<]*)/i)?.[1] || '';
        const desc = getTag('description') || '';
        const image = getTag('image') || '';
        const domain = new URL(url).hostname;
        const d = { title: title.slice(0, 80), desc: desc.slice(0, 120), image, domain };
        cache[url] = d;
        setData(d);
      } catch(e) { setFailed(true); }
    })();
  }, [url]);

  if (!data) return null;

  return (
    <TouchableOpacity style={[s.card, {backgroundColor: colors.surfaceLight, borderColor: colors.glassBorder}]}
      onPress={() => Linking.openURL(url)} activeOpacity={0.7}>
      {data.image ? <Image source={{uri: data.image}} style={s.image} /> : null}
      <View style={s.body}>
        <Text style={[s.domain, {color: colors.textSecondary}]}>{data.domain}</Text>
        {data.title ? <Text style={[s.title, {color: colors.text}]} numberOfLines={2}>{data.title}</Text> : null}
        {data.desc ? <Text style={[s.desc, {color: colors.textSecondary}]} numberOfLines={2}>{data.desc}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginTop: 6, maxWidth: 260 },
  image: { width: '100%', height: 120, backgroundColor: '#1a1a2e' },
  body: { padding: 10 },
  domain: { fontSize: 11, marginBottom: 2 },
  title: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  desc: { fontSize: 12 },
});
