import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../../store/favorites';
import { BusinessCard } from '../../components/BusinessCard';

export default function FavoritesScreen() {
  const router = useRouter();
  const { businesses } = useFavoritesStore();

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Mes favoris</Text>
      </View>

      {businesses.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🤍</Text>
          <Text style={s.emptyTitle}>Aucun favori pour l'instant</Text>
          <Text style={s.emptyDesc}>
            Appuyez sur le cœur d'un commerce pour le sauvegarder ici.
          </Text>
          <TouchableOpacity style={s.exploreBtn} onPress={() => router.push('/(tabs)/two')}>
            <Text style={s.exploreBtnText}>Explorer les commerces</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          <Text style={s.count}>{businesses.length} commerce{businesses.length > 1 ? 's' : ''} sauvegardé{businesses.length > 1 ? 's' : ''}</Text>
          {businesses.map(b => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f7f7f7' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#f7f7f7', gap: 12 },
  backBtn:      { paddingRight: 4 },
  backText:     { fontSize: 17, color: '#25D366', fontWeight: '600' },
  title:        { fontSize: 22, fontWeight: '800', color: '#111' },

  list:         { paddingTop: 8, paddingBottom: 40 },
  count:        { fontSize: 13, color: '#999', marginLeft: 16, marginBottom: 12 },

  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:    { fontSize: 56, marginBottom: 16 },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 8, textAlign: 'center' },
  emptyDesc:    { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  exploreBtn:   { backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  exploreBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
});
