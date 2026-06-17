import { View, Text, StyleSheet } from 'react-native';
import { Business } from '../services/api';

export function MapResults({ businesses }: {
  businesses: Business[];
  mapRef?: any;
}) {
  const mapped = businesses.filter(b => b.latitude && b.longitude);
  return (
    <View style={s.wrap}>
      <Text style={s.emoji}>🗺️</Text>
      <Text style={s.title}>Carte bientôt disponible</Text>
      <Text style={s.sub}>{mapped.length} commerce{mapped.length !== 1 ? 's' : ''} localisé{mapped.length !== 1 ? 's' : ''}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  sub:   { fontSize: 14, color: '#888', textAlign: 'center' },
});
