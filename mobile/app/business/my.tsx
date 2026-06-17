import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyBusinesses, updateBusiness, MyBusiness } from '../../services/api';

const G = '#25D366';
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'] as const;
const DAY_FR: Record<string, string> = { mon:'Lun', tue:'Mar', wed:'Mer', thu:'Jeu', fri:'Ven', sat:'Sam', sun:'Dim' };

// ─── Stat card ────────────────────────────────────────────────────────────────

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Edit sheet ───────────────────────────────────────────────────────────────

type EditFields = {
  name: string;
  description: string;
  address: string;
  commune: string;
  whatsapp_number: string;
  phone_number: string;
  cover_url: string;
  logo_url: string;
  hours: Record<string, string>;
};

function EditSheet({ business, onClose }: { business: MyBusiness; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<EditFields>({
    name:             business.name,
    description:      business.description ?? '',
    address:          business.address,
    commune:          business.commune,
    whatsapp_number:  business.whatsapp_number,
    phone_number:     business.phone_number ?? '',
    cover_url:        business.cover_url ?? '',
    logo_url:         business.logo_url ?? '',
    hours:            (business.opening_hours as Record<string, string>) ?? {},
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => updateBusiness(business.id, {
      name:            fields.name.trim(),
      description:     fields.description.trim() || undefined,
      address:         fields.address.trim(),
      commune:         fields.commune.trim(),
      whatsapp_number: fields.whatsapp_number.trim(),
      phone_number:    fields.phone_number.trim() || undefined,
      cover_url:       fields.cover_url.trim() || undefined,
      logo_url:        fields.logo_url.trim() || undefined,
      opening_hours:   fields.hours,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business', business.id] });
      Alert.alert('Enregistré', 'Votre fiche a bien été mise à jour.');
      onClose();
    },
    onError: () => Alert.alert('Erreur', 'Impossible de mettre à jour. Réessayez.'),
  });

  function set(k: keyof Omit<EditFields, 'hours'>, v: string) {
    setFields(prev => ({ ...prev, [k]: v }));
  }

  function setHour(day: string, v: string) {
    setFields(prev => ({ ...prev, hours: { ...prev.hours, [day]: v } }));
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={es.root} edges={['top', 'bottom']}>
        <View style={es.header}>
          <TouchableOpacity onPress={onClose} style={es.cancelBtn}>
            <Text style={es.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={es.headerTitle}>Modifier la fiche</Text>
          <TouchableOpacity
            onPress={() => mutate()}
            disabled={isPending}
            style={[es.saveBtn, isPending && { opacity: 0.6 }]}
          >
            {isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={es.saveText}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={es.body} keyboardShouldPersistTaps="handled">

            <Text style={es.section}>INFORMATIONS GÉNÉRALES</Text>
            <Text style={es.label}>Nom du commerce</Text>
            <TextInput style={es.input} value={fields.name} onChangeText={v => set('name', v)} />

            <Text style={es.label}>Description</Text>
            <TextInput
              style={[es.input, es.textarea]}
              value={fields.description}
              onChangeText={v => set('description', v)}
              multiline numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={es.section}>CONTACT</Text>
            <Text style={es.label}>Numéro WhatsApp</Text>
            <TextInput style={es.input} value={fields.whatsapp_number} onChangeText={v => set('whatsapp_number', v)} keyboardType="phone-pad" />

            <Text style={es.label}>Téléphone (optionnel)</Text>
            <TextInput style={es.input} value={fields.phone_number} onChangeText={v => set('phone_number', v)} keyboardType="phone-pad" />

            <Text style={es.section}>LOCALISATION</Text>
            <Text style={es.label}>Adresse</Text>
            <TextInput style={es.input} value={fields.address} onChangeText={v => set('address', v)} />

            <Text style={es.label}>Commune</Text>
            <TextInput style={es.input} value={fields.commune} onChangeText={v => set('commune', v)} />

            <Text style={es.section}>PHOTOS</Text>
            <Text style={es.hint}>Collez l'URL d'une image (Google Photos, Imgur, WhatsApp…)</Text>
            <Text style={es.label}>Photo de couverture</Text>
            <TextInput
              style={es.input}
              value={fields.cover_url}
              onChangeText={v => set('cover_url', v)}
              placeholder="https://…"
              placeholderTextColor="#bbb"
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={es.label}>Logo / photo de profil</Text>
            <TextInput
              style={es.input}
              value={fields.logo_url}
              onChangeText={v => set('logo_url', v)}
              placeholder="https://…"
              placeholderTextColor="#bbb"
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={es.section}>HORAIRES D'OUVERTURE</Text>
            <Text style={es.hint}>Format : « 08h–20h » ou « fermé »</Text>
            {DAYS.map(day => (
              <View key={day} style={es.hourRow}>
                <Text style={es.dayLabel}>{DAY_FR[day]}</Text>
                <TextInput
                  style={[es.input, es.hourInput]}
                  value={fields.hours[day] ?? ''}
                  onChangeText={v => setHour(day, v)}
                  placeholder="08h–20h"
                  placeholderTextColor="#bbb"
                />
              </View>
            ))}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const es = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f7f7f7' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  cancelBtn:   { paddingHorizontal: 4 },
  cancelText:  { fontSize: 16, color: '#666' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111' },
  saveBtn:     { backgroundColor: G, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveText:    { color: '#fff', fontWeight: '800', fontSize: 14 },
  body:        { padding: 16, paddingBottom: 40 },
  section:     { fontSize: 11, fontWeight: '800', color: '#999', letterSpacing: 0.8, marginTop: 24, marginBottom: 10 },
  label:       { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  hint:        { fontSize: 12, color: '#aaa', marginBottom: 10 },
  input:       { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111', marginBottom: 12 },
  textarea:    { height: 100, paddingTop: 11 },
  hourRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  dayLabel:    { width: 32, fontSize: 13, fontWeight: '700', color: '#555' },
  hourInput:   { flex: 1, marginBottom: 0 },
});

// ─── Business card ────────────────────────────────────────────────────────────

function BusinessRow({ business }: { business: MyBusiness }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const stars = business.review_count > 0
    ? [1,2,3,4,5].map(i => i <= Math.round(business.avg_rating ?? 0) ? '★' : '☆').join('')
    : null;

  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardName} numberOfLines={1}>{business.name}</Text>
          <Text style={s.cardMeta}>{business.category_name}  ·  {business.commune}</Text>
        </View>
        {business.is_verified && (
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedText}>✓ Vérifié</Text>
          </View>
        )}
      </View>

      <View style={s.statsRow}>
        <Stat icon="👁" value={String(business.view_count)} label="Vues" />
        <Stat icon="📱" value={String(business.whatsapp_clicks)} label="Clics WA" />
        <Stat icon="⭐" value={business.avg_rating ? Number(business.avg_rating).toFixed(1) : '—'} label="Note" />
        <Stat icon="💬" value={String(business.review_count)} label="Avis" />
      </View>

      {stars && <Text style={s.starsRow}>{stars}</Text>}

      <View style={s.actions}>
        <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)}>
          <Text style={s.editBtnText}>✏️  Modifier la fiche</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.viewBtn}
          onPress={() => router.push(`/business/${business.id}`)}
        >
          <Text style={s.viewBtnText}>Voir →</Text>
        </TouchableOpacity>
      </View>

      {editing && <EditSheet business={business} onClose={() => setEditing(false)} />}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyBusinessScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: fetchMyBusinesses,
  });

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mes commerces</Text>
        <TouchableOpacity onPress={() => router.push('/business/add')} style={s.addBtn}>
          <Text style={s.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={G} />
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onStartShouldSetResponder={() => false}
          refreshControl={undefined}
        >
          {(data ?? []).length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🏪</Text>
              <Text style={s.emptyTitle}>Aucun commerce enregistré</Text>
              <Text style={s.emptySub}>Ajoutez votre commerce gratuitement pour apparaître dans l'annuaire.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/business/add')}>
                <Text style={s.emptyBtnText}>Ajouter mon commerce</Text>
              </TouchableOpacity>
            </View>
          ) : (
            (data ?? []).map(b => <BusinessRow key={b.id} business={b} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#f7f7f7' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f7f7f7' },
  backBtn:       { paddingRight: 8 },
  backText:      { fontSize: 16, color: G, fontWeight: '600' },
  headerTitle:   { fontSize: 18, fontWeight: '800', color: '#111' },
  addBtn:        { backgroundColor: G, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText:    { color: '#fff', fontWeight: '800', fontSize: 13 },
  list:          { padding: 16, paddingBottom: 48 },

  card:          { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHead:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  cardName:      { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 3 },
  cardMeta:      { fontSize: 13, color: '#888' },
  verifiedBadge: { backgroundColor: '#ecfdf5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  verifiedText:  { fontSize: 11, fontWeight: '700', color: '#059669' },

  statsRow:      { flexDirection: 'row', borderRadius: 10, backgroundColor: '#f9f9f9', padding: 12, marginBottom: 12, gap: 4 },
  stat:          { flex: 1, alignItems: 'center' },
  statIcon:      { fontSize: 18, marginBottom: 3 },
  statValue:     { fontSize: 17, fontWeight: '800', color: '#111' },
  statLabel:     { fontSize: 11, color: '#999', marginTop: 1 },

  starsRow:      { fontSize: 16, color: '#f59e0b', marginBottom: 12, letterSpacing: 1 },

  actions:       { flexDirection: 'row', gap: 10 },
  editBtn:       { flex: 1, backgroundColor: '#f0f9f4', borderWidth: 1.5, borderColor: G, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  editBtnText:   { color: G, fontWeight: '700', fontSize: 14 },
  viewBtn:       { backgroundColor: '#F5F5F5', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 18, alignItems: 'center' },
  viewBtnText:   { color: '#444', fontWeight: '700', fontSize: 14 },

  empty:         { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon:     { fontSize: 56, marginBottom: 16 },
  emptyTitle:    { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8, textAlign: 'center' },
  emptySub:      { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyBtn:      { backgroundColor: G, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
