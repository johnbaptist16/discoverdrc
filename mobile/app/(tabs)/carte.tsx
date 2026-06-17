import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchBusinesses, fetchCategories, Business } from '../../services/api';

// ─── Conditional MapView import (web fallback) ────────────────────────────────

let MapView: any, Marker: any, Callout: any, PROVIDER_DEFAULT: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView        = maps.default;
  Marker         = maps.Marker;
  Callout        = maps.Callout;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KIN_REGION = {
  latitude: -4.325, longitude: 15.322,
  latitudeDelta: 0.12, longitudeDelta: 0.12,
};
const G = '#25D366';

// ─── Bottom card ──────────────────────────────────────────────────────────────

function BusinessCard({ business, onClose }: { business: Business; onClose: () => void }) {
  const router = useRouter();
  const stars = business.review_count > 0
    ? [1,2,3,4,5].map(i => i <= Math.round(business.avg_rating ?? 0) ? '★' : '☆').join('')
    : null;

  return (
    <View style={card.wrap}>
      <TouchableOpacity style={card.close} onPress={onClose} hitSlop={10}>
        <Text style={card.closeText}>×</Text>
      </TouchableOpacity>
      <Text style={card.name} numberOfLines={2}>{business.name}</Text>
      <Text style={card.meta}>
        {business.category_name}  ·  📍 {business.commune}
      </Text>
      {stars && (
        <Text style={card.stars}>
          {stars}
          <Text style={card.ratingText}>  {Number(business.avg_rating).toFixed(1)} ({business.review_count})</Text>
        </Text>
      )}
      <View style={card.actions}>
        {business.whatsapp_number ? (
          <TouchableOpacity
            style={card.waBtn}
            onPress={() => router.push(`/business/${business.id}`)}
          >
            <Text style={card.waBtnText}>📞 WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={card.detailBtn}
          onPress={() => router.push(`/business/${business.id}`)}
        >
          <Text style={card.detailBtnText}>Voir les détails →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20 },
  close:         { position: 'absolute', top: 14, right: 16, width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  closeText:     { fontSize: 22, color: '#666', lineHeight: 28 },
  name:          { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 4, paddingRight: 36 },
  meta:          { fontSize: 13, color: '#666', marginBottom: 6 },
  stars:         { fontSize: 15, color: '#f59e0b', marginBottom: 12 },
  ratingText:    { fontSize: 12, color: '#888' },
  actions:       { flexDirection: 'row', gap: 10 },
  waBtn:         { flex: 1, backgroundColor: G, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  waBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  detailBtn:     { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  detailBtnText: { color: '#111', fontWeight: '700', fontSize: 14 },
});

// ─── Web fallback ─────────────────────────────────────────────────────────────

function WebFallback({ count }: { count: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🗺</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8 }}>
        Carte disponible sur mobile
      </Text>
      <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>
        Ouvrez l'application Android ou iOS pour voir les {count} commerces sur la carte.
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CarteScreen() {
  const [category, setCategory]       = useState('');
  const [selected, setSelected]       = useState<Business | null>(null);
  const mapRef = useRef<any>(null);

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

  const businesses = data?.businesses ?? [];
  const mapped = businesses.filter(b => b.latitude && b.longitude);

  const onMarkerPress = useCallback((b: Business) => setSelected(b), []);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.pills}
        contentContainerStyle={s.pillsContent}
      >
        <TouchableOpacity
          style={[s.pill, category === '' && s.pillActive]}
          onPress={() => { setCategory(''); setSelected(null); }}
        >
          <Text style={[s.pillText, category === '' && s.pillTextActive]}>🗺 Tout</Text>
        </TouchableOpacity>
        {(categories ?? []).map(cat => (
          <TouchableOpacity
            key={cat.slug}
            style={[s.pill, category === cat.slug && s.pillActive]}
            onPress={() => { setCategory(cat.slug); setSelected(null); }}
          >
            <Text style={[s.pillText, category === cat.slug && s.pillTextActive]}>
              {cat.name_fr}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Counter */}
      <View style={s.counter}>
        <Text style={s.counterText}>
          {isLoading ? 'Chargement…' : `${mapped.length} commerce${mapped.length !== 1 ? 's' : ''} localisé${mapped.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Map */}
      <View style={s.mapWrap}>
        {isLoading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={G} />
          </View>
        ) : Platform.OS === 'web' ? (
          <WebFallback count={mapped.length} />
        ) : (
          <MapView
            ref={mapRef}
            style={s.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={KIN_REGION}
            showsUserLocation
            showsMyLocationButton
            onPress={() => setSelected(null)}
          >
            {mapped.map(b => (
              <Marker
                key={b.id}
                coordinate={{ latitude: Number(b.latitude), longitude: Number(b.longitude) }}
                pinColor={selected?.id === b.id ? '#f59e0b' : G}
                onPress={() => onMarkerPress(b)}
              />
            ))}
          </MapView>
        )}

        {/* Bottom card for selected pin */}
        {selected && (
          <BusinessCard business={selected} onClose={() => setSelected(null)} />
        )}
      </View>
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
  counter:      { paddingHorizontal: 16, paddingVertical: 4 },
  counterText:  { fontSize: 12, color: '#999' },
  mapWrap:      { flex: 1 },
  map:          { flex: 1 },
  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
