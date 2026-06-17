import {
  View, Text, FlatList, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBusinesses, fetchCategories } from '../../services/api';
import { BusinessCard } from '../../components/BusinessCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/app';

const COMMUNES = [
  'Toutes', 'Gombe', 'Lingwala', 'Barumbu', 'Kintambo', 'Ngaliema',
  'Kalamu', 'Limete', 'Kinshasa', 'Ndjili', 'Matete',
  'Lemba', 'Ngaba', 'Bandalungwa', 'Bumbu', 'Selembao',
];

export default function HomeScreen() {
  const { preferredCommune } = useAppStore();
  const [search, setSearch] = useState('');
  const [commune, setCommune] = useState(preferredCommune ?? '');
  const [category, setCategory] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: Infinity,
  });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['businesses', commune, category, search],
    queryFn: () => fetchBusinesses({
      commune: commune || undefined,
      category: category || undefined,
      search: search.length > 1 ? search : undefined,
    }),
    staleTime: 30_000,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Kinshasa Directory</Text>
        <Text style={styles.subtitle}>Trouvez les meilleurs commerces</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un commerce..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {COMMUNES.map((c) => {
          const val = c === 'Toutes' ? '' : c;
          const active = commune === val;
          return (
            <TouchableOpacity key={c} style={[styles.chip, active && styles.chipActive]} onPress={() => setCommune(val)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.chip, category === '' && styles.chipActive]} onPress={() => setCategory('')}>
          <Text style={[styles.chipText, category === '' && styles.chipTextActive]}>Tous</Text>
        </TouchableOpacity>
        {categories?.map((cat) => (
          <TouchableOpacity key={cat.slug} style={[styles.chip, category === cat.slug && styles.chipActive]} onPress={() => setCategory(cat.slug)}>
            <Text style={[styles.chipText, category === cat.slug && styles.chipTextActive]}>{cat.name_fr}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#25D366" />
      ) : (
        <FlatList
          data={data?.businesses ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BusinessCard business={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#25D366" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun commerce trouvé</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#111',
  },
  filterRow: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: { backgroundColor: '#25D366', borderColor: '#25D366' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingTop: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', fontSize: 15 },
});
