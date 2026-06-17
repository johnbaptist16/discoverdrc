import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchEconomyRates, fetchEconomyNews } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExchangeRate {
  code: string;
  name: string;
  bccRate: number | null;
  parallelRate: number;
  changePct: number;
  updatedAt: string;
}

interface MineralPrice {
  name: string;
  price: number;
  unit: string;
  changePct: number;
  region: string;
  certification: string;
  market: string;
}

interface NewsItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
}

interface FuelPrice {
  type: string;
  unit: string;
  prices: Record<string, number>;
}

interface KeyIndicator {
  label: string;
  value: string;
  unit: string;
  period: string;
  source: string;
  trend: 'up' | 'down' | 'stable';
}

// ─── Mock data (Phase 1 — remplacer par APIs en Phase 2) ──────────────────────

const RATES: ExchangeRate[] = [
  { code: 'USD', name: 'Dollar américain', bccRate: 2785, parallelRate: 3150, changePct: 0.48, updatedAt: '14h32' },
  { code: 'EUR', name: 'Euro', bccRate: 3020, parallelRate: 3410, changePct: -0.23, updatedAt: '14h32' },
  { code: 'GBP', name: 'Livre sterling', bccRate: 3540, parallelRate: 3980, changePct: 0.56, updatedAt: '14h32' },
  { code: 'CAD', name: 'Dollar canadien', bccRate: 2040, parallelRate: 2290, changePct: -0.22, updatedAt: '14h32' },
  { code: 'CNY', name: 'Yuan chinois', bccRate: 383, parallelRate: 432, changePct: 0.47, updatedAt: '14h32' },
  { code: 'ZAR', name: 'Rand sud-africain', bccRate: 152, parallelRate: 171, changePct: -0.58, updatedAt: '14h32' },
  { code: 'XAF', name: 'Franc CFA', bccRate: 4.6, parallelRate: 5.2, changePct: 1.96, updatedAt: '14h32' },
];

const MINERALS: MineralPrice[] = [
  { name: 'Coltan', price: 105, unit: 'kg', changePct: 2.94, region: 'Sud-Kivu · Nord-Kivu', certification: 'ITSCI requis', market: 'Fastmarkets' },
  { name: 'Cobalt', price: 26500, unit: 'tonne', changePct: -0.56, region: 'Haut-Katanga · Lualaba', certification: 'Négociant agréé', market: 'Fastmarkets' },
  { name: 'Cuivre LME', price: 9840, unit: 'tonne', changePct: 1.24, region: 'Lualaba · Haut-Katanga', certification: 'Non requis', market: 'LME London' },
  { name: 'Or alluvial', price: 92, unit: 'gramme', changePct: 0.55, region: 'Ituri · Maniema', certification: 'LBMA / ASM', market: 'LBMA' },
  { name: 'Cassitérite', price: 18, unit: 'kg', changePct: -1.64, region: 'Sud-Kivu · Maniema', certification: 'ITSCI requis', market: 'LME Tin' },
  { name: 'Wolframite', price: 32, unit: 'kg', changePct: 0, region: 'Sud-Kivu', certification: 'ITSCI requis', market: 'Fastmarkets' },
  { name: 'Lithium', price: 12800, unit: 'tonne', changePct: -1.54, region: 'Manono · Lualaba', certification: 'En développement', market: 'Fastmarkets' },
  { name: 'Diamant', price: 1200, unit: 'carat', changePct: 0.84, region: 'Kasaï · Mbuji-Mayi', certification: 'Processus Kimberley', market: 'AWDC / Rapaport' },
];

const NEWS: NewsItem[] = [
  {
    id: '1',
    category: 'BCC',
    title: 'La BCC maintient son taux directeur à 25% pour contenir l\'inflation',
    summary: 'La Banque Centrale du Congo a décidé de maintenir son taux directeur à 25% lors de son comité de juin 2026. Cette décision vise à stabiliser le franc congolais face aux pressions inflationnistes persistantes.',
    source: 'Radio Okapi',
    url: 'https://radiookapi.net',
    publishedAt: '15h00 · 16/06/2026',
  },
  {
    id: '2',
    category: 'Mines',
    title: 'Glencore signe un accord de 2 milliards USD pour l\'extension de Mutanda',
    summary: 'Le géant minier suisse Glencore a annoncé un investissement de 2 milliards USD pour étendre la mine de Mutanda dans la province de Lualaba. La production de cobalt devrait doubler d\'ici 2028.',
    source: 'Mining.com',
    url: 'https://www.mining.com',
    publishedAt: '10h45 · 16/06/2026',
  },
  {
    id: '3',
    category: 'Diaspora',
    title: 'Les transferts de la diaspora atteignent 2,4 milliards USD en 2025',
    summary: 'Selon la Banque Mondiale, les envois de fonds de la diaspora congolaise ont atteint un niveau record de 2,4 milliards USD en 2025, représentant près de 4% du PIB national.',
    source: 'Banque Mondiale',
    url: 'https://www.worldbank.org',
    publishedAt: '09h20 · 16/06/2026',
  },
  {
    id: '4',
    category: 'Commerce',
    title: 'DRC-Chine : hausse de 18% des exportations minières au T1 2026',
    summary: 'Les exportations congolaises vers la Chine ont progressé de 18% au premier trimestre 2026, tirées par la demande en cobalt et cuivre pour les batteries électriques.',
    source: 'OCHA / Trade Map',
    url: 'https://trademap.org',
    publishedAt: '08h15 · 16/06/2026',
  },
  {
    id: '5',
    category: 'Alimentation',
    title: 'Prix du manioc en hausse de 22% à Kinshasa depuis janvier',
    summary: 'Le prix du manioc, aliment de base pour 80% des Kinois, a augmenté de 22% depuis le début de l\'année. La sécheresse dans le Bandundu et les difficultés logistiques sur la RN1 sont les causes principales.',
    source: 'FAO / Radio Okapi',
    url: 'https://radiookapi.net',
    publishedAt: '07h30 · 16/06/2026',
  },
];

const FUELS: FuelPrice[] = [
  { type: 'Essence', unit: 'litre', prices: { Kinshasa: 3850, Goma: 4200, Lubumbashi: 3950, Bukavu: 4350 } },
  { type: 'Gasoil', unit: 'litre', prices: { Kinshasa: 3650, Goma: 4050, Lubumbashi: 3800, Bukavu: 4150 } },
  { type: 'Gaz 12kg', unit: 'bouteille', prices: { Kinshasa: 48000, Goma: 55000, Lubumbashi: 51000, Bukavu: 57000 } },
];

const INDICATORS: KeyIndicator[] = [
  { label: 'Inflation annuelle', value: '23.4', unit: '%', period: 'Mai 2026', source: 'BCC', trend: 'down' },
  { label: 'Croissance PIB', value: '6.2', unit: '%', period: 'Prévision 2026', source: 'FMI', trend: 'up' },
  { label: 'Réserves BCC', value: '4.1', unit: 'mrd USD', period: 'Avril 2026', source: 'BCC', trend: 'stable' },
  { label: 'Exportations minières', value: '18.7', unit: 'mrd USD', period: '2025', source: 'Banque Mondiale', trend: 'up' },
  { label: 'Transferts diaspora', value: '2.4', unit: 'mrd USD', period: '2025', source: 'Banque Mondiale', trend: 'up' },
];

const CITIES = ['Kinshasa', 'Goma', 'Lubumbashi', 'Bukavu'];

const NEWS_BADGE_COLORS: Record<string, string> = {
  BCC: '#1d4ed8',
  Mines: '#92400e',
  Diaspora: '#5b21b6',
  Commerce: '#065f46',
  Alimentation: '#9f1239',
};

const DISCLAIMER = 'Pour toute transaction importante, consultez votre banque ou un bureau de change agréé.';
const STALE_NOTE = 'Données indicatives · Mis à jour: 16/06/2026 à 14h32';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('fr-FR');
}

function changeColor(pct: number): string {
  if (pct > 0) return '#16a34a';
  if (pct < 0) return '#dc2626';
  return '#6b7280';
}

function changeArrow(pct: number): string {
  if (pct > 0) return '▲';
  if (pct < 0) return '▼';
  return '—';
}

function trendIcon(t: KeyIndicator['trend']): string {
  return t === 'up' ? '▲' : t === 'down' ? '▼' : '—';
}

function trendColor(t: KeyIndicator['trend']): string {
  return t === 'up' ? '#16a34a' : t === 'down' ? '#dc2626' : '#6b7280';
}

// ─── Shared components ────────────────────────────────────────────────────────

function SectionHeader({ title, note }: { title: string; note: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionNote}>{note}</Text>
    </View>
  );
}

function Disclaimer({ text = DISCLAIMER }: { text?: string }) {
  return (
    <View style={s.disclaimer}>
      <Text style={s.disclaimerText}>⚠ {text}</Text>
    </View>
  );
}

// ─── Devises tab ──────────────────────────────────────────────────────────────

const CURRENCY_NAMES: Record<string, string> = {
  EUR: 'Euro', GBP: 'Livre sterling', CAD: 'Dollar canadien',
  CNY: 'Yuan chinois', ZAR: 'Rand sud-africain', XAF: 'Franc CFA',
};

function DevisesTab() {
  const { data: live, isLoading, isError } = useQuery({
    queryKey: ['eco-rates'],
    queryFn: fetchEconomyRates,
    staleTime: 3_600_000,
    retry: 1,
  });

  // Derive CDF per currency: cdf_per_X = cdf_per_usd / rates.X
  const cdfPerUsd = live?.cdf_per_usd ?? RATES[0].parallelRate;
  const parallelUsd = Math.round(cdfPerUsd * 1.13);
  const updatedLabel = live
    ? new Date(live.updated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : RATES[0].updatedAt;

  function cdfFor(code: string): number {
    if (!live) {
      const fallback = RATES.find(r => r.code === code);
      return fallback?.parallelRate ?? 0;
    }
    const crossRate = live.rates[code];
    return crossRate ? Math.round(cdfPerUsd / crossRate) : 0;
  }

  const noteText = isLoading
    ? 'Chargement…'
    : isError
    ? 'Données hors ligne · ' + STALE_NOTE
    : 'Taux de marché international · Mis à jour ' + updatedLabel;

  return (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Taux de change vs CDF" note={noteText} />

      {isLoading && <ActivityIndicator color={ACCENT} style={{ marginVertical: 24 }} />}

      {/* USD featured card */}
      {!isLoading && (
        <View style={s.usdCard}>
          <View style={s.usdTopRow}>
            <Text style={s.usdPair}>USD / CDF</Text>
            <View style={s.gapBadge}>
              <Text style={s.gapBadgeText}>Parallèle +13%</Text>
            </View>
          </View>
          <View style={s.usdRateRow}>
            <View style={s.usdRateCol}>
              <Text style={s.usdRateLabel}>Marché</Text>
              <Text style={s.usdRateOfficial}>{fmt(Math.round(cdfPerUsd))} FC</Text>
            </View>
            <View style={s.usdSeparator} />
            <View style={s.usdRateCol}>
              <Text style={s.usdRateLabel}>Parallèle (estimé)</Text>
              <Text style={s.usdRateParallel}>{fmt(parallelUsd)} FC</Text>
            </View>
          </View>
          <Text style={s.usdMeta}>
            {isError ? '⚠ Données hors ligne' : '🟢 Données en direct'}
            {'  ·  mis à jour ' + updatedLabel}
          </Text>
        </View>
      )}

      {/* Other currencies */}
      {!isLoading && Object.keys(CURRENCY_NAMES).map((code) => {
        const cdf = cdfFor(code);
        return (
          <View key={code} style={s.rateRow}>
            <View>
              <Text style={s.rateCode}>{code}</Text>
              <Text style={s.rateName}>{CURRENCY_NAMES[code]}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.rateParallel}>{fmt(cdf)} FC</Text>
              <Text style={s.rateChange}>par 1 {code}</Text>
            </View>
          </View>
        );
      })}

      <Disclaimer />
    </ScrollView>
  );
}

// ─── Mines tab ────────────────────────────────────────────────────────────────

function MinesTab() {
  return (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Prix des minerais" note={STALE_NOTE} />

      {MINERALS.map((m) => (
        <View key={m.name} style={s.mineralCard}>
          <View style={s.mineralTopRow}>
            <Text style={s.mineralName}>{m.name}</Text>
            <View style={[s.changePill, { backgroundColor: m.changePct > 0 ? '#dcfce7' : m.changePct < 0 ? '#fee2e2' : '#f3f4f6' }]}>
              <Text style={[s.changePillText, { color: changeColor(m.changePct) }]}>
                {changeArrow(m.changePct)} {Math.abs(m.changePct)}%
              </Text>
            </View>
          </View>

          <View style={s.mineralPriceRow}>
            <Text style={s.mineralPrice}>USD {fmt(m.price)}</Text>
            <Text style={s.mineralUnit}> / {m.unit}</Text>
          </View>

          <Text style={s.mineralMeta}>📍 {m.region}</Text>
          <Text style={s.mineralMeta}>📊 {m.market}</Text>
          <Text style={[s.mineralMeta, { color: '#b45309' }]}>📋 {m.certification}</Text>
        </View>
      ))}

      <Disclaimer text="Prix indicatifs. Pour vendre vos minerais, contactez un négociant agréé ou une coopérative minière certifiée." />
    </ScrollView>
  );
}

// ─── Actualités tab ───────────────────────────────────────────────────────────

function fmtPubDate(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return raw;
  }
}

function ActualitesTab() {
  const { data: liveNews, isLoading, isError } = useQuery({
    queryKey: ['eco-news'],
    queryFn: fetchEconomyNews,
    staleTime: 900_000,
    retry: 1,
  });

  const items = liveNews?.items ?? NEWS;
  const noteText = isLoading
    ? 'Chargement Radio Okapi…'
    : isError
    ? 'Données hors ligne · Affichage de la dernière mise à jour'
    : 'Radio Okapi · ' + (liveNews ? new Date(liveNews.fetched_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');

  return (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Actualités économiques" note={noteText} />

      {isLoading && <ActivityIndicator color={ACCENT} style={{ marginVertical: 24 }} />}

      {items.map((item, idx) => {
        const id = 'id' in item ? (item as { id: string }).id : String(idx);
        const source = 'source' in item ? (item as { source: string }).source : liveNews?.source ?? 'Radio Okapi';
        const pubLabel = fmtPubDate(item.publishedAt);
        return (
          <TouchableOpacity
            key={id}
            style={s.newsCard}
            onPress={() => item.url ? Linking.openURL(item.url) : undefined}
            activeOpacity={0.82}
          >
            <View style={s.newsTopRow}>
              <View style={[s.newsBadge, { backgroundColor: NEWS_BADGE_COLORS[item.category] ?? '#374151' }]}>
                <Text style={s.newsBadgeText}>{item.category}</Text>
              </View>
              <Text style={s.newsDate}>{pubLabel}</Text>
            </View>
            <Text style={s.newsTitle}>{item.title}</Text>
            {item.summary ? <Text style={s.newsSummary} numberOfLines={3}>{item.summary}</Text> : null}
            <View style={s.newsFooterRow}>
              <Text style={s.newsSource}>{source}</Text>
              <Text style={s.newsRead}>Lire →</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Carburant tab ────────────────────────────────────────────────────────────

function CarburantTab() {
  const [city, setCity] = useState('Kinshasa');

  return (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Prix carburants" note="Prix relevés à la pompe · 16/06/2026" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.cityRow}
        style={{ marginBottom: 12 }}
      >
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[s.cityChip, city === c && s.cityChipActive]}
            onPress={() => setCity(c)}
          >
            <Text style={[s.cityChipText, city === c && s.cityChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {FUELS.map((f) => (
        <View key={f.type} style={s.fuelRow}>
          <View>
            <Text style={s.fuelType}>{f.type}</Text>
            <Text style={s.fuelUnit}>par {f.unit}</Text>
          </View>
          <Text style={s.fuelPrice}>{fmt(f.prices[city])} FC</Text>
        </View>
      ))}

      <View style={s.fuelNote}>
        <Text style={s.fuelNoteText}>
          Prix indicatifs relevés à la pompe. En cas de pénurie, le prix du marché peut être supérieur. Peut varier selon la station.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Indicateurs tab ──────────────────────────────────────────────────────────

function IndicateursTab() {
  return (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Indicateurs macroéconomiques" note="FMI · Banque Mondiale · BCC" />

      {INDICATORS.map((ind) => (
        <View key={ind.label} style={s.kpiRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.kpiLabel}>{ind.label}</Text>
            <Text style={s.kpiPeriod}>{ind.period} · Source: {ind.source}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.kpiValue}>{ind.value} <Text style={s.kpiUnit}>{ind.unit}</Text></Text>
            <Text style={[s.kpiTrend, { color: trendColor(ind.trend) }]}>{trendIcon(ind.trend)}</Text>
          </View>
        </View>
      ))}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          Données issues de sources officielles. Pour les décisions d'investissement, consultez un conseiller financier agréé.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

const TABS = [
  { key: 'devises', label: 'Devises' },
  { key: 'mines', label: 'Mines' },
  { key: 'actualites', label: 'Actualités' },
  { key: 'carburant', label: 'Carburant' },
  { key: 'indicateurs', label: 'Indicateurs' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function EconomieScreen() {
  const [active, setActive] = useState<TabKey>('devises');

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Économie · RDC</Text>
        <Text style={s.headerSub}>Hub Intelligence Économique</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabBar}
        contentContainerStyle={s.tabBarContent}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabItem, active === t.key && s.tabItemActive]}
            onPress={() => setActive(t.key)}
          >
            <Text style={[s.tabItemLabel, active === t.key && s.tabItemLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {active === 'devises' && <DevisesTab />}
      {active === 'mines' && <MinesTab />}
      {active === 'actualites' && <ActualitesTab />}
      {active === 'carburant' && <CarburantTab />}
      {active === 'indicateurs' && <IndicateursTab />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT = '#25D366';
const BG = '#f4f4f4';
const CARD = '#ffffff';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },

  tabBar: { maxHeight: 46, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tabBarContent: { paddingHorizontal: 12, alignItems: 'center' },
  tabItem: { paddingHorizontal: 14, paddingVertical: 13 },
  tabItemActive: { borderBottomWidth: 2.5, borderBottomColor: ACCENT },
  tabItemLabel: { fontSize: 14, fontWeight: '500', color: '#888' },
  tabItemLabelActive: { color: ACCENT, fontWeight: '700' },

  tabContent: { padding: 16, paddingBottom: 48, gap: 10 },

  sectionHeader: { marginBottom: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  sectionNote: { fontSize: 11, color: '#aaa', marginTop: 2 },

  // USD featured card
  usdCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  usdTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  usdPair: { fontSize: 17, fontWeight: '800', color: '#111' },
  gapBadge: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  gapBadgeText: { fontSize: 12, fontWeight: '700', color: '#b45309' },
  usdRateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  usdRateCol: { flex: 1, alignItems: 'center' },
  usdRateLabel: { fontSize: 11, color: '#aaa', marginBottom: 4 },
  usdRateOfficial: { fontSize: 16, fontWeight: '500', color: '#888' },
  usdRateParallel: { fontSize: 24, fontWeight: '900', color: '#111' },
  usdSeparator: { width: 1, height: 44, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  usdMeta: { fontSize: 12, color: '#aaa', textAlign: 'center' },

  // Other rate rows
  rateRow: {
    backgroundColor: CARD,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateCode: { fontSize: 15, fontWeight: '700', color: '#111' },
  rateName: { fontSize: 11, color: '#aaa', marginTop: 1 },
  rateBcc: { fontSize: 12, color: '#bbb', textDecorationLine: 'line-through' },
  rateParallel: { fontSize: 16, fontWeight: '700', color: '#111' },
  rateChange: { fontSize: 11, marginTop: 2 },

  // Mineral cards
  mineralCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
  },
  mineralTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  mineralName: { fontSize: 16, fontWeight: '700', color: '#111' },
  changePill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  changePillText: { fontSize: 12, fontWeight: '700' },
  mineralPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  mineralPrice: { fontSize: 22, fontWeight: '800', color: '#111' },
  mineralUnit: { fontSize: 13, color: '#888' },
  mineralMeta: { fontSize: 12, color: '#666', marginTop: 2 },

  // News cards
  newsCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
  },
  newsTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  newsBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  newsBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.4 },
  newsDate: { fontSize: 11, color: '#aaa' },
  newsTitle: { fontSize: 15, fontWeight: '700', color: '#111', lineHeight: 21, marginBottom: 6 },
  newsSummary: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 10 },
  newsFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsSource: { fontSize: 11, color: '#aaa' },
  newsRead: { fontSize: 13, fontWeight: '700', color: ACCENT },

  // Carburant
  cityRow: { paddingHorizontal: 0, gap: 8 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: CARD, borderWidth: 1, borderColor: '#e0e0e0' },
  cityChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  cityChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  cityChipTextActive: { color: '#fff', fontWeight: '700' },
  fuelRow: {
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fuelType: { fontSize: 16, fontWeight: '700', color: '#111' },
  fuelUnit: { fontSize: 12, color: '#aaa', marginTop: 2 },
  fuelPrice: { fontSize: 22, fontWeight: '800', color: '#111' },
  fuelNote: { backgroundColor: '#fef9c3', borderRadius: 10, padding: 12 },
  fuelNoteText: { fontSize: 12, color: '#92400e', lineHeight: 18 },

  // KPI
  kpiRow: {
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: { fontSize: 15, fontWeight: '600', color: '#111' },
  kpiPeriod: { fontSize: 11, color: '#aaa', marginTop: 3 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#111' },
  kpiUnit: { fontSize: 13, fontWeight: '400', color: '#888' },
  kpiTrend: { fontSize: 14, marginTop: 2 },

  // Disclaimer
  disclaimer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    marginTop: 4,
  },
  disclaimerText: { fontSize: 12, color: '#166534', lineHeight: 18 },
});
