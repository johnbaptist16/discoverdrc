import {
  View, Text, Image, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, Linking,
  TextInput, Alert, Share,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBusiness, fetchReviews, submitReview, Product } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { WhatsAppButton } from '../../components/WhatsAppButton';
import { VideoCard } from '../../components/VideoCard';

const DAY_LABELS: Record<string, string> = {
  mon: 'Lundi', tue: 'Mardi', wed: 'Mercredi',
  thu: 'Jeudi', fri: 'Vendredi', sat: 'Samedi', sun: 'Dimanche',
};

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InfoRow({ icon, label, value, onPress }: {
  icon: string; label: string; value: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress} disabled={!onPress}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && styles.infoLink]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <Text style={{ color: '#f59e0b', fontSize: size, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (i <= full ? '★' : '☆')).join('')}
    </Text>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} hitSlop={8}>
          <Text style={{ fontSize: 30, color: i <= value ? '#f59e0b' : '#d1d5db' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const isLoggedIn = !!token;

  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: () => fetchBusiness(id),
    enabled: !!id,
  });

  const { data: reviewData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => fetchReviews(id),
    enabled: !!id,
  });

  const { mutate: postReview, isPending: isSubmitting } = useMutation({
    mutationFn: () => submitReview(id, myRating, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['business', id] });
      setMyRating(0);
      setComment('');
      Alert.alert('Merci !', 'Votre avis a été publié.');
    },
    onError: () => Alert.alert('Erreur', 'Impossible de publier votre avis.'),
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#25D366" /></View>;
  }

  if (!data?.business) {
    return <View style={styles.center}><Text style={styles.errorText}>Commerce introuvable</Text></View>;
  }

  const { business, products } = data;

  const openMap = () => {
    const query = encodeURIComponent(`${business.address}, ${business.commune}, Kinshasa`);
    if (business.latitude && business.longitude) {
      Linking.openURL(`https://maps.google.com/?q=${business.latitude},${business.longitude}`);
    } else {
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  };

  const callPhone = () => {
    if (business.phone_number) Linking.openURL(`tel:${business.phone_number}`);
  };

  const sendEmail = () => {
    if (business.email) Linking.openURL(`mailto:${business.email}`);
  };

  const shareBusiness = async () => {
    const deepLink = ExpoLinking.createURL(`business/${business.id}`);
    const desc = business.description
      ? `\n${business.description.slice(0, 120)}${business.description.length > 120 ? '…' : ''}\n`
      : '\n';
    const message =
      `*${business.name}* · ${business.category_name}\n` +
      `📍 ${business.commune}, Kinshasa${desc}\n` +
      `📱 WhatsApp : ${business.whatsapp_number}\n` +
      `👉 Voir sur DiscoverDRC : ${deepLink}`;
    try {
      await Share.share({ message });
    } catch { /* user dismissed */ }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cover */}
      {business.cover_url ? (
        <Image source={{ uri: business.cover_url }} style={styles.cover} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.placeholderText}>{business.category_name}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{business.name}</Text>
          {business.is_verified && <Text style={styles.verified}>✓ Vérifié</Text>}
        </View>
        <Text style={styles.categoryBadge}>{business.category_name}</Text>
        {business.description ? (
          <Text style={styles.description}>{business.description}</Text>
        ) : null}
      </View>

      {/* WhatsApp — primary CTA + share */}
      <View style={styles.section}>
        <WhatsAppButton businessId={business.id} />
        <TouchableOpacity style={styles.shareBtn} onPress={shareBusiness}>
          <Text style={styles.shareBtnText}>🔗  Partager ce commerce</Text>
        </TouchableOpacity>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <SectionTitle title="📋 Contact" />
        {business.phone_number && (
          <InfoRow
            icon="📞" label="Téléphone" value={business.phone_number}
            onPress={callPhone}
          />
        )}
        {business.email && (
          <InfoRow
            icon="✉️" label="Email" value={business.email}
            onPress={sendEmail}
          />
        )}
        <InfoRow
          icon="💬" label="WhatsApp" value={business.whatsapp_number}
        />
      </View>

      {/* Address + Map */}
      <View style={styles.section}>
        <SectionTitle title="📍 Localisation" />
        <InfoRow
          icon="🏘" label="Commune" value={business.commune}
        />
        <InfoRow
          icon="🗺" label="Adresse" value={business.address}
          onPress={openMap}
        />
        <TouchableOpacity style={styles.mapButton} onPress={openMap}>
          <Text style={styles.mapButtonText}>Ouvrir dans Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Opening hours */}
      {business.opening_hours && (
        <View style={styles.section}>
          <SectionTitle title="🕐 Horaires d'ouverture" />
          {Object.entries(business.opening_hours).map(([day, hours]) => (
            <View key={day} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{DAY_LABELS[day] ?? day}</Text>
              <Text style={styles.hoursValue}>{hours}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Video listings */}
      {products.some((p: Product) => p.video_url) && (
        <View style={styles.section}>
          <SectionTitle title="🎬 Vidéos" />
          {products
            .filter((p: Product) => p.video_url)
            .map((p: Product) => (
              <VideoCard
                key={p.id}
                videoUrl={p.video_url!}
                title={p.name}
                description={p.description ?? undefined}
                price={p.price}
                currency={p.currency}
              />
            ))}
        </View>
      )}

      {/* Menu / Products (non-video) */}
      {products.some((p: Product) => !p.video_url) && (
        <View style={styles.section}>
          <SectionTitle title="🍽 Menu & Services" />
          {products
            .filter((p: Product) => !p.video_url)
            .map((p: Product) => (
              <View key={p.id} style={styles.productCard}>
                {p.image_url && (
                  <Image source={{ uri: p.image_url }} style={styles.productImage} />
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{p.name}</Text>
                  {p.description ? (
                    <Text style={styles.productDesc} numberOfLines={2}>{p.description}</Text>
                  ) : null}
                  {p.price ? (
                    <Text style={styles.productPrice}>
                      {Number(p.price).toLocaleString('fr-CD')} {p.currency}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Social links */}
      {business.social_links && Object.keys(business.social_links).length > 0 && (
        <View style={styles.section}>
          <SectionTitle title="🌐 Réseaux sociaux" />
          {Object.entries(business.social_links).map(([platform, url]) => (
            <InfoRow
              key={platform}
              icon="🔗"
              label={platform.charAt(0).toUpperCase() + platform.slice(1)}
              value={url}
              onPress={() => Linking.openURL(url)}
            />
          ))}
        </View>
      )}

      {/* Reviews & Ratings */}
      <View style={styles.section}>
        <View style={styles.reviewHeader}>
          <SectionTitle title="⭐ Avis & Notes" />
          {reviewData && reviewData.review_count > 0 && (
            <View style={styles.avgRow}>
              <Text style={styles.avgNumber}>{reviewData.avg_rating?.toFixed(1)}</Text>
              <StarDisplay rating={reviewData.avg_rating ?? 0} size={16} />
              <Text style={styles.reviewCount}>({reviewData.review_count})</Text>
            </View>
          )}
        </View>

        {isLoggedIn ? (
          <View style={styles.reviewForm}>
            <Text style={styles.formLabel}>Votre note</Text>
            <StarPicker value={myRating} onChange={setMyRating} />
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Partagez votre expérience…"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, (!myRating || isSubmitting) && styles.submitBtnDisabled]}
              onPress={() => postReview()}
              disabled={!myRating || isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Envoi…' : 'Publier mon avis'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.loginHint}>Connectez-vous pour laisser un avis</Text>
        )}

        {reviewData?.reviews.map(r => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewMeta}>
              <Text style={styles.reviewerName}>{r.display_name}</Text>
              <Text style={styles.reviewDate}>
                {new Date(r.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <StarDisplay rating={r.rating} />
            {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
          </View>
        ))}

        {reviewData?.review_count === 0 && (
          <Text style={styles.noReviews}>Aucun avis pour le moment. Soyez le premier !</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  content: { paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#999', fontSize: 16 },

  cover: { width: '100%', height: 220, resizeMode: 'cover' },
  coverPlaceholder: {
    width: '100%', height: 140, backgroundColor: '#e8e8e8',
    alignItems: 'center', justifyContent: 'center',
  },
  placeholderText: { color: '#aaa', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  header: { backgroundColor: '#fff', padding: 16, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 22, fontWeight: '800', color: '#111', flex: 1 },
  verified: { fontSize: 13, color: '#25D366', fontWeight: '700', marginLeft: 8 },
  categoryBadge: {
    alignSelf: 'flex-start', backgroundColor: '#f0faf4', color: '#25D366',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    fontSize: 12, fontWeight: '600',
  },
  description: { fontSize: 15, color: '#444', lineHeight: 22 },

  section: {
    backgroundColor: '#fff', marginTop: 10,
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 2 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 1 },
  infoValue: { fontSize: 15, color: '#222' },
  infoLink: { color: '#1a73e8', textDecorationLine: 'underline' },

  mapButton: {
    backgroundColor: '#f0f6ff', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', marginTop: 4,
  },
  mapButtonText: { color: '#1a73e8', fontWeight: '600', fontSize: 14 },

  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  hoursDay: { fontSize: 14, color: '#444', fontWeight: '500' },
  hoursValue: { fontSize: 14, color: '#222', fontWeight: '600' },

  productCard: {
    flexDirection: 'row', backgroundColor: '#fafafa',
    borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#eee',
  },
  productImage: { width: 80, height: 80, resizeMode: 'cover' },
  productInfo: { flex: 1, padding: 10, gap: 4 },
  productName: { fontSize: 15, fontWeight: '700', color: '#111' },
  productDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#25D366' },

  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avgNumber: { fontSize: 18, fontWeight: '800', color: '#111' },
  reviewCount: { fontSize: 13, color: '#999' },

  reviewForm: { gap: 10, paddingVertical: 8 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#444' },
  commentInput: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 10, fontSize: 14, color: '#111', minHeight: 72,
  },
  submitBtn: {
    backgroundColor: '#25D366', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#a7f3d0' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  loginHint: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 8 },
  noReviews: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 8 },

  reviewCard: {
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 4,
  },
  reviewMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: 14, fontWeight: '700', color: '#111' },
  reviewDate: { fontSize: 12, color: '#94a3b8' },
  reviewComment: { fontSize: 14, color: '#444', lineHeight: 20, marginTop: 2 },

  shareBtn: {
    borderWidth: 1.5, borderColor: '#25D366', borderRadius: 10,
    paddingVertical: 11, alignItems: 'center',
  },
  shareBtnText: { color: '#25D366', fontWeight: '700', fontSize: 14 },
});
