import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

const cache = {};

export default function TranslateButton({ text, msgId }) {
  const [translated, setTranslated] = useState(cache[msgId] || null);
  const [loading, setLoading] = useState(false);

  const doTranslate = async () => {
    if (translated) { setTranslated(null); return; }
    if (cache[msgId]) { setTranslated(cache[msgId]); return; }
    setLoading(true);
    try {
      const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|ru');
      const d = await r.json();
      const t = d.responseData?.translatedText || '';
      if (t && t !== text) {
        cache[msgId] = t;
        setTranslated(t);
      }
    } catch(e) {}
    setLoading(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={doTranslate} style={s.btn}>
        {loading ? <ActivityIndicator size="small" color={colors.purple} /> :
          <Ionicons name="language-outline" size={14} color={colors.purple} />}
      </TouchableOpacity>
      {translated && (
        <View style={[s.box, {backgroundColor: colors.purple + '10', borderColor: colors.purple + '30'}]}>
          <Text style={[s.label, {color: colors.purple}]}>Перевод:</Text>
          <Text style={[s.text, {color: colors.text}]}>{translated}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  btn: { paddingHorizontal: 6, paddingVertical: 2 },
  box: { borderRadius: 8, padding: 8, marginTop: 4, borderWidth: 1 },
  label: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  text: { fontSize: 13 },
});
