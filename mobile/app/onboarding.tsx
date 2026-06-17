import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/app';

const { width: W } = Dimensions.get('window');
const G = '#25D366';
const DARK = '#111';

const COMMUNES = [
  'Gombe', 'Lingwala', 'Barumbu', 'Kintambo', 'Ngaliema',
  'Kalamu', 'Limete', 'Kinshasa', 'Ndjili', 'Matete',
  'Lemba', 'Ngaba', 'Bandalungwa', 'Bumbu', 'Selembao',
];

// ─── Step dots ────────────────────────────────────────────────────────────────

function Dots({ step, total }: { step: number; total: number }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[s.dot, i === step && s.dotActive]} />
      ))}
    </View>
  );
}

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={s.step}>
      <View style={s.iconWrap}>
        <Text style={s.pinIcon}>📍</Text>
      </View>
      <Text style={s.stepTitle}>Bienvenue sur{'\n'}DiscoverDRC</Text>
      <Text style={s.stepDesc}>
        L'annuaire des meilleurs commerces, restaurants et services de Kinshasa.
        Trouvez, contactez et explorez — tout en un.
      </Text>
      <View style={s.featureList}>
        {[
          ['🔍', 'Cherchez parmi des centaines de commerces'],
          ['💬', 'Contactez directement via WhatsApp'],
          ['⭐', 'Sauvegardez vos favoris'],
          ['📈', 'Suivez les prix et devises'],
        ].map(([icon, text]) => (
          <View key={text} style={s.featureRow}>
            <Text style={s.featureIcon}>{icon}</Text>
            <Text style={s.featureText}>{text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={s.btn} onPress={onNext}>
        <Text style={s.btnText}>Commencer →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 2: Commune picker ───────────────────────────────────────────────────

function StepCommune({ onNext }: { onNext: (commune: string | null) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={s.step}>
      <Text style={s.stepTitle}>Où êtes-vous ?</Text>
      <Text style={s.stepDesc}>
        Choisissez votre commune pour voir les commerces près de chez vous en priorité.
      </Text>

      <ScrollView
        style={s.communeScroll}
        contentContainerStyle={s.communeGrid}
        showsVerticalScrollIndicator={false}
      >
        {COMMUNES.map(c => (
          <TouchableOpacity
            key={c}
            style={[s.communePill, selected === c && s.communePillActive]}
            onPress={() => setSelected(c)}
          >
            <Text style={[s.communeText, selected === c && s.communeTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={s.btn} onPress={() => onNext(selected)}>
        <Text style={s.btnText}>
          {selected ? `Continuer avec ${selected}` : 'Passer cette étape'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 3: Ready ────────────────────────────────────────────────────────────

function StepReady({ commune, onFinish }: { commune: string | null; onFinish: () => void }) {
  return (
    <View style={[s.step, s.stepCentered]}>
      <View style={s.checkWrap}>
        <Text style={s.checkIcon}>✓</Text>
      </View>
      <Text style={s.stepTitle}>Tout est prêt !</Text>
      <Text style={s.stepDesc}>
        {commune
          ? `Vous verrez en priorité les commerces de ${commune}. Vous pouvez changer ça à tout moment dans l'explorateur.`
          : 'Explorez tous les commerces de Kinshasa. Vous pourrez filtrer par commune dans l\'explorateur.'}
      </Text>
      <TouchableOpacity style={s.btn} onPress={onFinish}>
        <Text style={s.btnText}>Explorer DiscoverDRC</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboarded } = useAppStore();
  const [step, setStep] = useState(0);
  const [commune, setCommune] = useState<string | null>(null);

  function handleCommuneNext(c: string | null) {
    setCommune(c);
    setStep(2);
  }

  function handleFinish() {
    setOnboarded(commune);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fdf9" />

      <View style={s.header}>
        <Text style={s.logo}>DiscoverDRC</Text>
        {step < 2 && (
          <TouchableOpacity onPress={() => { setOnboarded(null); router.replace('/(tabs)'); }}>
            <Text style={s.skip}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>

      <Dots step={step} total={3} />

      {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
      {step === 1 && <StepCommune onNext={handleCommuneNext} />}
      {step === 2 && <StepReady commune={commune} onFinish={handleFinish} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f9fdf9' },

  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  logo:    { fontSize: 18, fontWeight: '900', color: G },
  skip:    { fontSize: 15, color: '#aaa', fontWeight: '500' },

  dots:      { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd' },
  dotActive: { width: 24, backgroundColor: G },

  step:        { flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  stepCentered:{ alignItems: 'center', justifyContent: 'center' },

  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e8faf0', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 28, marginTop: 12 },
  pinIcon:  { fontSize: 52 },

  checkWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: G, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  checkIcon: { fontSize: 48, color: '#fff', fontWeight: '900' },

  stepTitle: { fontSize: 30, fontWeight: '900', color: DARK, marginBottom: 14, lineHeight: 36 },
  stepDesc:  { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 28 },

  featureList: { gap: 14, marginBottom: 32 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  featureText: { fontSize: 15, color: '#333', flex: 1, lineHeight: 20 },

  communeScroll: { flex: 1, marginBottom: 16 },
  communeGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  communePill:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff' },
  communePillActive: { backgroundColor: G, borderColor: G },
  communeText:       { fontSize: 14, color: '#444', fontWeight: '500' },
  communeTextActive: { color: '#fff', fontWeight: '700' },

  btn:     { backgroundColor: G, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
