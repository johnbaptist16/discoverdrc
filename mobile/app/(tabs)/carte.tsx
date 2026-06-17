import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchBusinesses, fetchCategories, Business } from '../../services/api';

const G = '#25D366';

export default function CarteScreen() {
  const [category, setCategory] = useState('');
  const router = useRouter();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: Infinity,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['businesses-map', category],
    queryFn: () => fetchBusinesses({
      category: category || undefined,
      limit: '100',
    } as any),
  });

  const businesses = (data?.businesses ?? []).filter(b => b.latitude && b.longitude);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.pills}
        contentContainerStyle={s.pillsContent}
      >
        <TouchableOpacity
          style={[s.pill, category === '' && s.pillActive]}
          onPress={() => setCategory('')}
        >
          <Text style={[s.pillText, category === '' && s.pillTextActive]}>🗺 Tout</Text>
        </TouchableOpacity>
        {(categories ?? []).map(cat => (
          <TouchableOpacity
            key={cat.slug}
            style={[s.pill, category === cat.slug && s.pillActive]}
            onPress={() => setCategory(cat.slug)}
          >
            <Text style={[s.pillText, category === cat.slug && s.pillTextActive]}>
              {cat.name_fr}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.banner}>
        <Text style={s.bannerEmoji}>🗺️</Text>
        <Text style={s.bannerTitle}>Carte bientôt disponible</Text>
        <Text style={s.bannerSub}>
          {isLoading ? 'Chargement…' : `${businesses.length} commerce${businesses.length !== 1 ? 's' : ''} localisé${businesses.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {isLoading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={G} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {businesses.map((b: Business) => (
            <TouchableOpacity
              key={b.id}
              style={s.row}
              onPress={() => router.push(`/business/${b.id}`)}
            >
              <View style={s.pin}>
                <Text style={s.pinText}>📍</Text>
              </View>
              <View style={s.info}>
                <Text style={s.name} numberOfLines={1}>{b.name}</Text>
                <Text style={s.meta}>{b.category_name} · {b.commune}</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#fff' },
  pills:        { maxHeight: 48, flexGrow: 0 },
  pillsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  pill:         { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
  pillActive:   { backgroundColor: G, borderColor: G },
  pillText:     { fontSize: 13, color: '#555', fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  banner:       { alignItems: 'center', paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  bannerEmoji:  { fontSize: 40, marginBottom: 8 },
  bannerTitle:  { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  bannerSub:    { fontSize: 13, color: '#888' },
  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:         { padding: 12, gap: 8 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 12, padding: 14, gap: 12 },
  pin:          { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F8EF', alignItems: 'center', justifyContent: 'center' },
  pinText:      { fontSize: 18 },
  info:         { flex: 1 },
  name:         { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 2 },
  meta:         { fontSize: 12, color: '#888' },
  arrow:        { fontSize: 22, color: '#CCC', fontWeight: '300' },
});
