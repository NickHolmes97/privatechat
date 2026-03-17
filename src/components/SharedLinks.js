import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function SharedLinks({ visible, links, onClose }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide">
      <View style={[s.container, {backgroundColor: colors.bg}]}>
        <View style={[s.header, {backgroundColor: colors.surface}]}>
          <TouchableOpacity onPress={onClose}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
          <Text style={[s.title, {color: colors.text}]}>Ссылки ({links.length})</Text>
          <View style={{width: 24}} />
        </View>
        {links.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="link-outline" size={48} color={colors.textSecondary} />
            <Text style={[s.emptyText, {color: colors.textSecondary}]}>Нет ссылок</Text>
          </View>
        ) : (
          <FlatList
            data={links}
            keyExtractor={(_, i) => String(i)}
            renderItem={({item}) => {
              let domain = '';
              try { domain = new URL(item.url).hostname; } catch(e) {}
              return (
                <TouchableOpacity style={[s.item, {borderBottomColor: colors.glassBorder}]}
                  onPress={() => Linking.openURL(item.url)}>
                  <View style={[s.icon, {backgroundColor: colors.purple + '20'}]}>
                    <Ionicons name="globe-outline" size={20} color={colors.purple} />
                  </View>
                  <View style={s.info}>
                    <Text style={[s.url, {color: colors.purple}]} numberOfLines={1}>{item.url}</Text>
                    <Text style={[s.domain, {color: colors.textSecondary}]}>{domain}</Text>
                    <Text style={[s.sender, {color: colors.textSecondary}]}>{item.senderName} · {new Date(item.ts).toLocaleDateString('ru')}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, marginTop: 12 },
  item: { flexDirection: 'row', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12, alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  url: { fontSize: 14, fontWeight: '500' },
  domain: { fontSize: 12, marginTop: 2 },
  sender: { fontSize: 11, marginTop: 2 },
});
