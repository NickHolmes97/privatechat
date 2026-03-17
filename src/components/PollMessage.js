import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

export default function PollMessage({ poll, votes, myVote, totalVotes, onVote }) {
  if (!poll) return null;
  const q = poll.question?.text || 'Опрос';
  const answers = poll.answers || [];

  return (
    <View style={[s.card, {backgroundColor: colors.surfaceLight, borderColor: colors.glassBorder}]}>
      <Text style={[s.question, {color: colors.text}]}>📊 {q}</Text>
      {answers.map(a => {
        const count = votes[a.id]?.count || 0;
        const pct = totalVotes > 0 ? Math.round(count / totalVotes * 100) : 0;
        const isMyVote = myVote && myVote.includes(a.id);
        return (
          <TouchableOpacity key={a.id} onPress={() => onVote(a.id)}
            style={[s.option, isMyVote && {borderColor: colors.purple, backgroundColor: colors.purple + '15'}]}
            activeOpacity={0.7}>
            <View style={[s.optionBg, {backgroundColor: colors.purple, width: `${pct}%`}]} />
            <View style={s.optionContent}>
              <Text style={[s.optionLabel, {color: colors.text}]}>{a.text}</Text>
              {totalVotes > 0 && <Text style={[s.optionPct, {color: colors.textSecondary}]}>{pct}%</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
      <Text style={[s.total, {color: colors.textSecondary}]}>{totalVotes} голос(ов)</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 12, padding: 12, borderWidth: 1, marginVertical: 2 },
  question: { fontWeight: '700', fontSize: 15, marginBottom: 10 },
  option: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 6, overflow: 'hidden', position: 'relative' },
  optionBg: { position: 'absolute', top: 0, left: 0, bottom: 0, opacity: 0.15 },
  optionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, zIndex: 1 },
  optionLabel: { fontSize: 14, flex: 1 },
  optionPct: { fontSize: 12, fontWeight: '600', marginLeft: 8 },
  total: { fontSize: 12, marginTop: 4 },
});
