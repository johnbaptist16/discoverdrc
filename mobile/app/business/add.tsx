import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, createBusiness, createProduct } from '../../services/api';

const G = '#25D366';
const DARK = '#111';
const MUTED = '#999';
const BORDER = '#e0e0e0';

const COMMUNES = ['Gombe', 'Lingwala', 'Barumbu', 'Kintambo', 'Ngaliema', 'Kalamu', 'Limete', 'Kinshasa'];

const DAYS: Array<{ key: string; label: string }> = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mer' },
  { key: 'thu', label: 'Jeu' },
  { key: 'fri', label: 'Ven' },
  { key: 'sat', label: 'Sam' },
  { key: 'sun', label: 'Dim' },
];

// ─── Field component ──────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>
        {label}{required && <Text style={s.required}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

// ─── Pill picker ──────────────────────────────────────────────────────────────

function PillPicker<T extends string | number>({
  options, value, onChange, labelKey,
}: {
  options: Array<{ value: T; label: string }>;
  value: T | null;
  onChange: (v: T) => void;
  labelKey?: never;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={String(opt.value)}
          style={[s.pill, value === opt.value && s.pillActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[s.pillText, value === opt.value && s.pillTextActive]} numberOfLines={1}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Opening hours builder ────────────────────────────────────────────────────

function HoursBuilder({
  value, onChange,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const [sameEveryDay, setSameEveryDay] = useState(true);
  const [globalOpen, setGlobalOpen] = useState('08h');
  const [globalClose, setGlobalClose] = useState('20h');
  const [closedSun, setClosedSun] = useState(false);

  function applyGlobal(open: string, close: string, noSun: boolean) {
    const hours: Record<string, string> = {};
    DAYS.forEach(d => {
      hours[d.key] = d.key === 'sun' && noSun ? 'Fermé' : `${open}–${close}`;
    });
    onChange(hours);
  }

  return (
    <View style={s.hoursWrap}>
      <View style={s.hoursToggleRow}>
        <Text style={s.hoursToggleLabel}>Mêmes horaires tous les jours</Text>
        <Switch
          value={sameEveryDay}
          onValueChange={v => setSameEveryDay(v)}
          trackColor={{ true: G }}
          thumbColor="#fff"
        />
      </View>

      {sameEveryDay ? (
        <View style={s.hoursSimple}>
          <View style={s.hoursTimeRow}>
            <View style={s.hoursTimeCol}>
              <Text style={s.hoursTimeLabel}>Ouverture</Text>
              <TextInput
                style={s.hoursInput}
                value={globalOpen}
                onChangeText={v => {
                  setGlobalOpen(v);
                  applyGlobal(v, globalClose, closedSun);
                }}
                placeholder="07h"
                placeholderTextColor="#bbb"
              />
            </View>
            <Text style={s.hoursDash}>–</Text>
            <View style={s.hoursTimeCol}>
              <Text style={s.hoursTimeLabel}>Fermeture</Text>
              <TextInput
                style={s.hoursInput}
                value={globalClose}
                onChangeText={v => {
                  setGlobalClose(v);
                  applyGlobal(globalOpen, v, closedSun);
                }}
                placeholder="20h"
                placeholderTextColor="#bbb"
              />
            </View>
          </View>
          <TouchableOpacity
            style={s.hoursCheckRow}
            onPress={() => {
              const next = !closedSun;
              setClosedSun(next);
              applyGlobal(globalOpen, globalClose, next);
            }}
          >
            <View style={[s.checkbox, closedSun && s.checkboxOn]}>
              {closedSun && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.hoursCheckLabel}>Fermé le dimanche</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.hoursDayList}>
          {DAYS.map(d => (
            <View key={d.key} style={s.hoursDayRow}>
              <Text style={s.hoursDayLabel}>{d.label}</Text>
              <TextInput
                style={s.hoursDayInput}
                value={value[d.key] ?? ''}
                onChangeText={v => onChange({ ...value, [d.key]: v })}
                placeholder="08h–20h ou Fermé"
                placeholderTextColor="#bbb"
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function AddBusinessScreen() {
  const router = useRouter();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: Infinity,
  });

  const [name, setName]               = useState('');
  const [categoryId, setCategoryId]   = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [commune, setCommune]         = useState<string | null>(null);
  const [address, setAddress]         = useState('');
  const [whatsapp, setWhatsapp]       = useState('');
  const [phone, setPhone]             = useState('');
  const [videoUrl, setVideoUrl]       = useState('');
  const [hours, setHours]             = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(false);

  const categoryOptions = (categories ?? []).map(c => ({ value: c.id, label: c.name_fr }));
  const communeOptions  = COMMUNES.map(c => ({ value: c, label: c }));

  async function handleSubmit() {
    if (!name.trim()) return Alert.alert('Champ requis', 'Le nom de votre commerce est obligatoire.');
    if (!categoryId)  return Alert.alert('Champ requis', 'Veuillez choisir une catégorie.');
    if (!commune)     return Alert.alert('Champ requis', 'Veuillez choisir une commune.');
    if (!address.trim()) return Alert.alert('Champ requis', 'L\'adresse est obligatoire.');
    if (!whatsapp.trim()) return Alert.alert('Champ requis', 'Le numéro WhatsApp est obligatoire.');

    setLoading(true);
    try {
      const biz = await createBusiness({
        name: name.trim(),
        category_id: categoryId,
        description: description.trim() || undefined,
        address: address.trim(),
        commune,
        whatsapp_number: whatsapp.trim(),
        phone_number: phone.trim() || undefined,
        opening_hours: Object.keys(hours).length ? hours : undefined,
      });

      if (videoUrl.trim()) {
        await createProduct(biz.id, {
          name: `Vidéo — ${name.trim()}`,
          video_url: videoUrl.trim(),
        });
      }

      Alert.alert(
        '🎉 Commerce ajouté !',
        'Votre commerce a été soumis. Il sera visible dans l\'annuaire après vérification.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (err?.response?.status === 401) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
      } else {
        Alert.alert('Erreur', msg ?? 'Impossible d\'ajouter le commerce. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.pageTitle}>Ajouter mon commerce</Text>
          <Text style={s.pageSubtitle}>Rejoignez l'annuaire DiscoverDRC gratuitement.</Text>

          {/* ── Infos de base ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📋 Informations de base</Text>

            <Field label="Nom du commerce" required>
              <TextInput
                style={s.input}
                placeholder="Ex: Chez Mama Weza"
                placeholderTextColor="#bbb"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </Field>

            <Field label="Catégorie" required>
              <PillPicker
                options={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
              />
            </Field>

            <Field label="Description">
              <TextInput
                style={[s.input, s.textarea]}
                placeholder="Décrivez vos produits et services… (optionnel)"
                placeholderTextColor="#bbb"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Field>
          </View>

          {/* ── Localisation ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📍 Localisation</Text>

            <Field label="Commune" required>
              <PillPicker
                options={communeOptions}
                value={commune}
                onChange={setCommune}
              />
            </Field>

            <Field label="Adresse" required>
              <TextInput
                style={s.input}
                placeholder="Ex: Avenue Kasa-Vubu 14, Marché de Gombe"
                placeholderTextColor="#bbb"
                value={address}
                onChangeText={setAddress}
              />
            </Field>
          </View>

          {/* ── Contact ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📞 Contact</Text>

            <Field label="Numéro WhatsApp" required>
              <TextInput
                style={s.input}
                placeholder="+243 8XX XXX XXX"
                placeholderTextColor="#bbb"
                value={whatsapp}
                onChangeText={setWhatsapp}
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Téléphone fixe">
              <TextInput
                style={s.input}
                placeholder="+243 8XX XXX XXX (optionnel)"
                placeholderTextColor="#bbb"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Vidéo de présentation">
              <TextInput
                style={s.input}
                placeholder="https://… lien direct vers une vidéo .mp4 (optionnel)"
                placeholderTextColor="#bbb"
                value={videoUrl}
                onChangeText={setVideoUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>
          </View>

          {/* ── Horaires ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🕐 Horaires d'ouverture</Text>
            <Text style={s.sectionNote}>Optionnel — vous pourrez les modifier plus tard.</Text>
            <HoursBuilder value={hours} onChange={setHours} />
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[s.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitText}>Soumettre mon commerce</Text>
            }
          </TouchableOpacity>

          <Text style={s.legalNote}>
            Votre commerce sera examiné par notre équipe avant publication.
            Les informations fausses peuvent entraîner le retrait du listing.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f7f7' },
  content: { padding: 16, paddingBottom: 48 },

  pageTitle:    { fontSize: 24, fontWeight: '900', color: DARK, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: MUTED, marginBottom: 20 },

  section:      { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: DARK },
  sectionNote:  { fontSize: 12, color: MUTED, marginTop: -8 },

  field:    { gap: 8 },
  label:    { fontSize: 13, fontWeight: '700', color: '#444' },
  required: { color: '#dc2626' },

  input:    { backgroundColor: '#f8f8f8', borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: DARK },
  textarea: { minHeight: 90, paddingTop: 12 },

  pillRow:       { gap: 8, paddingVertical: 2 },
  pill:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#fff' },
  pillActive:    { backgroundColor: G, borderColor: G },
  pillText:      { fontSize: 13, color: '#555', fontWeight: '500' },
  pillTextActive:{ color: '#fff', fontWeight: '700' },

  hoursWrap:       { gap: 12 },
  hoursToggleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hoursToggleLabel:{ fontSize: 14, color: DARK, fontWeight: '500' },
  hoursSimple:     { gap: 12 },
  hoursTimeRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  hoursTimeCol:    { flex: 1, gap: 4 },
  hoursTimeLabel:  { fontSize: 12, color: MUTED },
  hoursInput:      { backgroundColor: '#f8f8f8', borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: DARK, textAlign: 'center' },
  hoursDash:       { fontSize: 18, color: MUTED, paddingBottom: 10 },
  hoursCheckRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:        { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  checkboxOn:      { backgroundColor: G, borderColor: G },
  checkmark:       { color: '#fff', fontSize: 13, fontWeight: '800' },
  hoursCheckLabel: { fontSize: 14, color: DARK },
  hoursDayList:    { gap: 8 },
  hoursDayRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hoursDayLabel:   { width: 36, fontSize: 13, fontWeight: '700', color: '#555' },
  hoursDayInput:   { flex: 1, backgroundColor: '#f8f8f8', borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: DARK },

  submitBtn:  { backgroundColor: G, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  legalNote:  { fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 16, lineHeight: 16 },
});
