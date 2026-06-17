import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Business } from '../services/api';
import { WhatsAppButton } from './WhatsAppButton';
import { useFavoritesStore } from '../store/favorites';

export function BusinessCard({ business }: { business: Business }) {
  const router = useRouter();
  const { isFavorite, toggle } = useFavoritesStore();
  const saved = isFavorite(business.id);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => router.push(`/business/${business.id}`)}
        activeOpacity={0.85}
      >
        {business.cover_url ? (
          <Image source={{ uri: business.cover_url }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverPlaceholderText}>{business.category_name}</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
            <View style={styles.badges}>
              {business.is_verified && (
                <Text style={styles.verified}>✓ Vérifié</Text>
              )}
              <TouchableOpacity
                onPress={() => toggle(business)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.heart}>{saved ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.meta}>📍 {business.commune} · {business.category_name}</Text>
          {business.review_count > 0 ? (
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>
                {[1,2,3,4,5].map(i => i <= Math.round(business.avg_rating ?? 0) ? '★' : '☆').join('')}
              </Text>
              <Text style={styles.ratingText}>
                {Number(business.avg_rating).toFixed(1)} ({business.review_count})
              </Text>
            </View>
          ) : null}
          {business.description ? (
            <Text style={styles.description} numberOfLines={2}>{business.description}</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={styles.footer}>
        <WhatsAppButton businessId={business.id} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },
  verified: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '600',
  },
  heart: {
    fontSize: 18,
  },
  meta: {
    fontSize: 13,
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    fontSize: 13,
    color: '#f59e0b',
    letterSpacing: 1,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});
