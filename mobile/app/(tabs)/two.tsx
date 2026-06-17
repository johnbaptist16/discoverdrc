import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchBusinesses, Business } from '../../services/api';
import { useAppStore } from '../../store/app';
import { BusinessCard } from '../../components/BusinessCard';
import { MapResults } from '../../components/MapResults';

// ─── Colors ───────────────────────────────────────────────────────────────────

const G = '#00A86B';
const GL = '#F0FBF5';
const GOLD = '#F5A623';
const DARK = '#111';
const MID = '#555';
const MUTED = '#999';
const BORDER = '#E8E8E8';
const SURF = '#F5F7F5';

const BCOLORS: Record<string, string> = {
  experiences: '#C8E8D8',
  restaurants: '#FFE0B2',
  delivery: '#F8BBD0',
  marche: '#BBDEFB',
  annuaire: '#E1BEE7',
  immobilier: '#C5CAE9',
};

// ─── Config data ──────────────────────────────────────────────────────────────

const SCOPES = [
  { id: 'all',         icon: '🔍', fr: 'Tout' },
  { id: 'experiences', icon: '🌍', fr: 'Expériences' },
  { id: 'restaurants', icon: '🍽',  fr: 'Restos' },
  { id: 'delivery',    icon: '🛵', fr: 'Livraison' },
  { id: 'marche',      icon: '🛒', fr: 'Marché' },
  { id: 'annuaire',    icon: '📋', fr: 'Annuaire' },
  { id: 'immobilier',  icon: '🏠', fr: 'Immobilier' },
] as const;

type ScopeId = typeof SCOPES[number]['id'];

// Scopes with real backend data (category slug or null = no filter = all businesses)
// 'MOCK' = no matching data yet → show coming-soon empty state
const SCOPE_CATEGORY: Record<string, string | null | 'MOCK'> = {
  all:         null,
  restaurants: 'restaurant',
  delivery:    'livraison',
  marche:      'marche',
  annuaire:    null,
  experiences: 'experiences',
  immobilier:  'immobilier',
};

function isMockScope(scope: string) {
  return SCOPE_CATEGORY[scope] === 'MOCK';
}

type FilterDef = {
  id: string;
  label: string;
  type: 'toggle' | 'single' | 'multi';
  opts?: string[];
};

const FILTERS: Record<string, FilterDef[]> = {
  all:         [{ id:'rating', label:'Note 4+',            type:'toggle' }, { id:'open', label:'Ouvert', type:'toggle' }],
  experiences: [{ id:'cat',   label:'Catégorie',           type:'multi',  opts:['Trek','Croisière','Rumba','Sport','Nature'] }, { id:'dur', label:'Durée', type:'single', opts:['½ journée','Journée','Multi-jours'] }, { id:'lang', label:'Langue', type:'multi', opts:['Français','Lingála','English'] }],
  restaurants: [{ id:'cui',   label:'Cuisine',             type:'multi',  opts:['Congolaise','Rwandaise','Libanaise','Fast Food','Grill','Végétarien'] }, { id:'price', label:'Prix', type:'single', opts:['$','$$','$$$'] }, { id:'open', label:'Ouvert', type:'toggle' }],
  delivery:    [{ id:'cui',   label:'Cuisine',             type:'multi',  opts:['Congolaise','Pizza','Burger','Poulet','Chinois'] }, { id:'free', label:'Livraison gratuite', type:'toggle' }, { id:'time', label:'Temps max', type:'single', opts:['30 min','45 min','60 min'] }],
  marche:      [{ id:'cat',   label:'Catégorie',           type:'multi',  opts:['Légumes','Poisson','Viande','Céréales','Épices','Minéraux'] }, { id:'mkt', label:'Marché', type:'single', opts:['Gombe','Central Kin','Marché Goma','Wenze'] }, { id:'trend', label:'Tendance', type:'single', opts:['Hausse ↑','Baisse ↓','Stable'] }],
  annuaire:    [{ id:'sec',   label:'Secteur',             type:'multi',  opts:['Santé','Éducation','Juridique','Finance','Transport','Commerce'] }, { id:'cty', label:'Ville', type:'single', opts:['Kinshasa','Goma','Lubumbashi','Matadi'] }, { id:'ver', label:'Vérifié ✓', type:'toggle' }],
  immobilier:  [{ id:'tx',    label:'Type',                type:'single', opts:['Location','Vente'] }, { id:'kind', label:'Bien', type:'multi', opts:['Appartement','Villa','Bureau','Terrain'] }, { id:'rms', label:'Chambres', type:'single', opts:['1+','2+','3+','4+'] }],
};

const SORTS: Record<string, string[]> = {
  all:         ['Recommandé','Note','Distance'],
  experiences: ['Populaire','Prix ↑','Prix ↓','Durée','Note'],
  restaurants: ['Recommandé','Note','Distance','Prix'],
  delivery:    ['Recommandé','Temps livraison','Frais livraison'],
  marche:      ['Pertinence','Prix ↑','Prix ↓','Mis à jour'],
  annuaire:    ['Recommandé','Note','Distance','Nom A–Z'],
  immobilier:  ['Prix ↑','Prix ↓','Surface','Récent'],
};

const PHOLDS: Record<string, string> = {
  all:         'Restaurants, hôtels, expériences…',
  experiences: 'Trek gorilles, croisière, rumba…',
  restaurants: 'Restaurant ou type de cuisine…',
  delivery:    'Restaurant ou plat à livrer…',
  marche:      'Tilapia, fufu, coltan, prix…',
  annuaire:    'Entreprise, secteur, service…',
  immobilier:  'Appartement, villa, bureau…',
};

const EMPTY_MSG: Record<string, string> = {
  all:         'Aucun résultat. Essayez un autre terme ou élargissez vos filtres.',
  experiences: 'Les expériences arrivent bientôt. Revenez dans quelques semaines !',
  restaurants: 'Aucun restaurant trouvé ici. Essayez une autre ville.',
  delivery:    'Aucun restaurant ne livre à cette adresse pour l\'instant.',
  marche:      'Ce produit n\'est pas encore listé. Aidez-nous à l\'ajouter !',
  annuaire:    'Aucune entreprise trouvée dans ce secteur.',
  immobilier:  'Les annonces immobilières arrivent bientôt sur DiscoverDRC.',
};

// ─── Mock data ────────────────────────────────────────────────────────────────

type Item = {
  title: string; sub: string; price: string | null;
  rating: number | null; reviews: number | null;
  badge: string | null; promoted: boolean;
  emoji: string; extra?: string; _scope?: string;
};

const MOCK_DATA: Record<string, Item[]> = {
  experiences: [
    { title:'Trek Gorilles – Virunga',  sub:'3 jours · Goma',        price:'$280/pers', rating:4.8, reviews:124, badge:'Bestseller',   promoted:false, emoji:'🦍' },
    { title:'Croisière Congo River',     sub:'Journée · Kinshasa',    price:'$45/pers',  rating:4.6, reviews:89,  badge:null,           promoted:true,  emoji:'🚢' },
    { title:'Nuit Rumba à Kin',          sub:'Soirée · Matonge',      price:'$15/pers',  rating:4.9, reviews:312, badge:'Top choix',    promoted:false, emoji:'🎵' },
    { title:'Safari Okapi – Épulu',      sub:'2 jours · Orientale',   price:'$190/pers', rating:4.7, reviews:56,  badge:null,           promoted:false, emoji:'🦌' },
  ],
  restaurants: [
    { title:'Matonge Palace',            sub:'Congolaise · $$ · 1.2 km', price:'$$',    rating:4.5, reviews:89,  badge:null,           promoted:true,  emoji:'🍽',  extra:'Ouvert · Ferme à 22h' },
    { title:'Chez Mama Weza',            sub:'Congolaise · $ · 0.4 km',  price:'$',     rating:4.8, reviews:203, badge:'Favori local', promoted:false, emoji:'🫕',  extra:'Ouvert · Ferme à 21h' },
    { title:'Le Liban à Gombe',          sub:'Libanaise · $$$ · 2.1 km', price:'$$$',   rating:4.3, reviews:41,  badge:null,           promoted:false, emoji:'🥙',  extra:'Ferme à 23h' },
  ],
  delivery: [
    { title:'Chez Mama Mwana',           sub:'Congolaise · 35–45 min', price:'Livraison: 1500 CDF', rating:4.7, reviews:180, badge:'20% OFF',     promoted:false, emoji:'🛵', extra:'Min: 3000 CDF' },
    { title:'KinPizza Express',          sub:'Pizza · 20–30 min',       price:'Livraison: Gratuite', rating:4.4, reviews:95,  badge:null,           promoted:true,  emoji:'🍕', extra:'Min: 5000 CDF' },
    { title:'Poulet Doré 24h',           sub:'Poulet · 25–35 min',      price:'Livraison: 1000 CDF', rating:4.6, reviews:220, badge:'⚡ Rapide',   promoted:false, emoji:'🍗', extra:'Min: 2000 CDF' },
  ],
  marche: [
    { title:'Tilapia fumé',              sub:'Marché de Gombe',        price:'2800 CDF/kg', rating:null, reviews:null, badge:'↑ +5%',  promoted:false, emoji:'🐟', extra:'Mis à jour: 09h00' },
    { title:'Fufu de manioc',            sub:'Marché Central Kin',     price:'800 CDF/kg',  rating:null, reviews:null, badge:'Stable', promoted:false, emoji:'🌾', extra:'Mis à jour: hier 14h' },
    { title:'Coltan brut',               sub:'Marché de Goma',         price:'$12.50/kg',   rating:null, reviews:null, badge:'↓ -2%',  promoted:true,  emoji:'⛏', extra:'Mis à jour: 07h00' },
  ],
  annuaire: [
    { title:'Cabinet Lukusa Avocats',    sub:'Juridique · Gombe',      price:null, rating:4.2, reviews:28,  badge:'✓ Vérifié', promoted:false, emoji:'⚖️', extra:'Ouvert jusqu\'à 18h' },
    { title:'Clinique Sainte-Marie',     sub:'Santé · Lingwala',       price:null, rating:4.7, reviews:112, badge:'✓ Vérifié', promoted:true,  emoji:'🏥', extra:'Ouvert 24h/24' },
    { title:'BTP Congo Construction',    sub:'Construction · Kinshasa', price:null, rating:4.0, reviews:19,  badge:null,        promoted:false, emoji:'🏗', extra:'Ouvert jusqu\'à 17h' },
  ],
  immobilier: [
    { title:'Appt 3ch – Gombe',          sub:'Appartement · Kinshasa', price:'1200 USD/mois', rating:null, reviews:null, badge:'Disponible', promoted:false, emoji:'🏢', extra:'120 m² · Wifi inclus' },
    { title:'Villa 5ch – Ngaliema',      sub:'Villa · Kinshasa',       price:'2500 USD/mois', rating:null, reviews:null, badge:'Promu',      promoted:true,  emoji:'🏡', extra:'350 m² · Piscine' },
    { title:'Bureau 80m² – Limete',      sub:'Bureau · Kinshasa',      price:'800 USD/mois',  rating:null, reviews:null, badge:null,         promoted:false, emoji:'🏢', extra:'80 m² · Parking' },
  ],
};

function getResults(scope: string): Item[] {
  if (scope === 'all') {
    return Object.entries(MOCK_DATA).flatMap(([k, items]) =>
      items.slice(0, 2).map(item => ({ ...item, _scope: k }))
    );
  }
  return MOCK_DATA[scope] ?? [];
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ResultCard({ item, scope }: { item: Item; scope: string }) {
  const s = item._scope ?? scope;
  const scopeInfo = ((item._scope && item._scope !== scope) || scope === 'all')
    ? SCOPES.find(x => x.id === s)
    : null;

  return (
    <View style={card.wrap}>
      <View style={[card.img, { backgroundColor: BCOLORS[s] ?? '#E8E8E8' }]}>
        <Text style={card.emoji}>{item.emoji}</Text>
        {item.promoted && (
          <View style={card.promoBadge}><Text style={card.promoBadgeText}>PROMU</Text></View>
        )}
        {scopeInfo && (
          <View style={card.scopeBadge}><Text style={card.scopeBadgeText}>{scopeInfo.icon} {scopeInfo.fr}</Text></View>
        )}
        {item.badge && !item.promoted && (
          <View style={card.itemBadge}><Text style={card.itemBadgeText}>{item.badge}</Text></View>
        )}
      </View>
      <View style={card.body}>
        <Text style={card.title} numberOfLines={1}>{item.title}</Text>
        <Text style={card.sub} numberOfLines={1}>{item.sub}</Text>
        <View style={card.footer}>
          <View style={card.meta}>
            {item.rating !== null && <Text style={card.rating}>★{item.rating}</Text>}
            {item.reviews !== null && <Text style={card.reviews}>({item.reviews})</Text>}
            {item.extra && <Text style={card.extra} numberOfLines={1}>{item.extra}</Text>}
          </View>
          {item.price && <Text style={card.price} numberOfLines={1}>{item.price}</Text>}
        </View>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap:          { backgroundColor:'#fff', borderRadius:14, marginBottom:10, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:6, elevation:3 },
  img:           { height:130, alignItems:'center', justifyContent:'center' },
  emoji:         { fontSize:52 },
  promoBadge:    { position:'absolute', top:10, left:10, backgroundColor:GOLD, borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  promoBadgeText:{ color:'#fff', fontSize:10, fontWeight:'700' },
  scopeBadge:    { position:'absolute', top:10, right:10, backgroundColor:'rgba(0,0,0,0.55)', borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  scopeBadgeText:{ color:'#fff', fontSize:10, fontWeight:'600' },
  itemBadge:     { position:'absolute', bottom:10, left:10, backgroundColor:'rgba(0,0,0,0.65)', borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  itemBadgeText: { color:'#fff', fontSize:10, fontWeight:'700' },
  body:          { padding:12 },
  title:         { fontSize:15, fontWeight:'700', color:DARK, marginBottom:3 },
  sub:           { fontSize:13, color:MID, marginBottom:6 },
  footer:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  meta:          { flexDirection:'row', alignItems:'center', gap:6, flex:1, marginRight:8 },
  rating:        { fontSize:13, color:'#E6A817', fontWeight:'700' },
  reviews:       { fontSize:12, color:MUTED },
  extra:         { fontSize:12, color:MUTED, flex:1 },
  price:         { fontSize:13, fontWeight:'700', color:G },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ scope, query, onClear }: { scope: string; query: string; onClear: () => void }) {
  return (
    <View style={empty.wrap}>
      <Text style={empty.icon}>🔍</Text>
      {!!query && <Text style={empty.query}>« {query} »</Text>}
      <Text style={empty.msg}>{EMPTY_MSG[scope] ?? EMPTY_MSG.all}</Text>
      <TouchableOpacity style={empty.btn} onPress={onClear}>
        <Text style={empty.btnText}>Effacer la recherche</Text>
      </TouchableOpacity>
    </View>
  );
}

const empty = StyleSheet.create({
  wrap:    { alignItems:'center', paddingVertical:48, paddingHorizontal:32 },
  icon:    { fontSize:52, marginBottom:16 },
  query:   { fontSize:13, color:MUTED, marginBottom:8 },
  msg:     { fontSize:15, color:MID, lineHeight:22, marginBottom:24, textAlign:'center' },
  btn:     { backgroundColor:G, borderRadius:24, paddingHorizontal:28, paddingVertical:12 },
  btnText: { color:'#fff', fontSize:14, fontWeight:'700' },
});

// ─── Filter bottom sheet ──────────────────────────────────────────────────────

type FilterState = Record<string, string | string[] | boolean | null>;

function FilterSheet({
  scope, active, onChange, onClearAll, onClose,
}: {
  scope: string; active: FilterState;
  onChange: (id: string, val: string | string[] | boolean | null) => void;
  onClearAll: () => void; onClose: () => void;
}) {
  const cfg = FILTERS[scope] ?? FILTERS.all;
  const count = Object.keys(active).filter(k => {
    const v = active[k];
    return v !== null && v !== false && !(Array.isArray(v) && v.length === 0);
  }).length;

  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <View style={fs.backdrop} />
      </Pressable>
      <View style={fs.sheet}>
        <View style={fs.handle} />
        <View style={fs.sheetHead}>
          <Text style={fs.sheetTitle}>Filtres</Text>
          <View style={fs.sheetActions}>
            {count > 0 && (
              <TouchableOpacity onPress={onClearAll}>
                <Text style={fs.clearAll}>Tout effacer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={fs.closeBtn} onPress={onClose}>
              <Text style={fs.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={fs.scrollContent}>
          {cfg.map(f => {
            const val = active[f.id];
            return (
              <View key={f.id} style={fs.group}>
                <Text style={fs.groupLabel}>{f.label.toUpperCase()}</Text>
                {f.type === 'toggle' ? (
                  <TouchableOpacity
                    style={[fs.toggle, val === true && fs.toggleOn]}
                    onPress={() => onChange(f.id, !val)}
                  >
                    <Text style={[fs.toggleText, val === true && fs.toggleTextOn]}>
                      {val ? 'Activé ✓' : 'Désactivé'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={fs.optRow}>
                    {(f.opts ?? []).map(opt => {
                      const on = f.type === 'multi'
                        ? Array.isArray(val) && val.includes(opt)
                        : val === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[fs.opt, on && fs.optOn]}
                          onPress={() => {
                            if (f.type === 'multi') {
                              const cur = Array.isArray(val) ? val : [];
                              const next = on ? cur.filter(v => v !== opt) : [...cur, opt];
                              onChange(f.id, next.length ? next : null);
                            } else {
                              onChange(f.id, on ? null : opt);
                            }
                          }}
                        >
                          <Text style={[fs.optText, on && fs.optTextOn]}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const fs = StyleSheet.create({
  backdrop:      { ...StyleSheet.absoluteFill, backgroundColor:'rgba(0,0,0,0.45)' },
  sheet:         { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, maxHeight:'72%', paddingBottom:32, shadowColor:'#000', shadowOffset:{width:0,height:-4}, shadowOpacity:0.12, shadowRadius:16, elevation:20 },
  handle:        { width:40, height:4, borderRadius:2, backgroundColor:'#DDD', alignSelf:'center', marginTop:12, marginBottom:6 },
  sheetHead:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:10, borderBottomWidth:1, borderBottomColor:BORDER },
  sheetTitle:    { fontSize:17, fontWeight:'800', color:DARK },
  sheetActions:  { flexDirection:'row', alignItems:'center', gap:14 },
  clearAll:      { color:G, fontSize:14, fontWeight:'700' },
  closeBtn:      { width:30, height:30, borderRadius:15, backgroundColor:'#F0F0F0', alignItems:'center', justifyContent:'center' },
  closeBtnText:  { fontSize:22, color:MUTED, lineHeight:28 },
  scrollContent: { padding:20 },
  group:         { marginBottom:22 },
  groupLabel:    { fontSize:11, fontWeight:'800', color:MUTED, letterSpacing:0.8, marginBottom:10 },
  toggle:        { borderWidth:1, borderColor:BORDER, borderRadius:20, paddingHorizontal:20, paddingVertical:8, alignSelf:'flex-start' },
  toggleOn:      { backgroundColor:G, borderColor:G },
  toggleText:    { fontSize:14, fontWeight:'600', color:DARK },
  toggleTextOn:  { color:'#fff' },
  optRow:        { flexDirection:'row', flexWrap:'wrap', gap:8 },
  opt:           { borderWidth:1, borderColor:BORDER, borderRadius:20, paddingHorizontal:16, paddingVertical:8 },
  optOn:         { backgroundColor:G, borderColor:G },
  optText:       { fontSize:13, color:DARK },
  optTextOn:     { color:'#fff', fontWeight:'700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExplorerScreen() {
  const { preferredCommune } = useAppStore();
  const [query,      setQuery]      = useState('');
  const [scope,      setScope]      = useState<ScopeId>('all');
  const [active,     setActive]     = useState<FilterState>({});
  const [sort,       setSort]       = useState('Recommandé');
  const [showFilter, setShowFilter] = useState(false);
  const [showScope,  setShowScope]  = useState(false);
  const [showSort,   setShowSort]   = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [locMode,    setLocMode]    = useState<'drc' | 'diaspora'>('drc');
  const [city,       setCity]       = useState('Kinshasa');
  const [recent,     setRecent]     = useState(['Tilapia fumé', 'Matonge Palace', 'Trek Virunga']);
  const [viewMode,   setViewMode]   = useState<'list' | 'map'>('list');
  const inputRef = useRef<TextInput>(null);
  const mapRef   = useRef(null);

  useEffect(() => {
    setSort(SORTS[scope]?.[0] ?? 'Recommandé');
    setActive({});
    setSearched(false);
    setQuery('');
  }, [scope]);

  const categoryFilter = SCOPE_CATEGORY[scope];
  const communeFilter = (active['commune'] as string | undefined) ?? preferredCommune ?? undefined;
  const { data: realData, isFetching: realLoading } = useQuery({
    queryKey: ['explorer', scope, query, communeFilter],
    queryFn: () => fetchBusinesses({
      category: categoryFilter === null ? undefined : (categoryFilter as string),
      search: query.trim() || undefined,
      commune: communeFilter,
    }),
    enabled: searched && !isMockScope(scope),
    staleTime: 30_000,
  });

  const cur     = SCOPES.find(s => s.id === scope) ?? SCOPES[0];
  const aCount  = Object.keys(active).filter(k => {
    const v = active[k];
    return v !== null && v !== false && !(Array.isArray(v) && v.length === 0);
  }).length;
  const sortOpts = SORTS[scope] ?? SORTS.all;
  const results  = searched ? getResults(scope) : [];
  const locLabel = locMode === 'drc' ? `📍 ${city} · CDF` : `🌐 ${city} · Diaspora`;
  const sugg     = query.length >= 2 && !searched ? [
    { icon:'🍽',  type:'RESTO',    text:'Matonge Palace – Kinshasa' },
    { icon:'🌍',  type:'EXPÉR.',   text:'Trek Gorilles – Virunga' },
    { icon:'🛒',  type:'MARCHÉ',   text:'Tilapia – Marché de Gombe' },
    { icon:'🏠',  type:'IMMO.',    text:'Appt Gombe – 1200$/mois' },
    { icon:'📋',  type:'ANNUAIRE', text:'Cabinet Lukusa – Juridique' },
  ] : [];

  function doSearch(q: string) {
    if (!q.trim()) return;
    setSearched(true);
    setQuery(q);
    setRecent(prev => [q, ...prev.filter(r => r !== q)].slice(0, 5));
  }

  function clear() {
    setQuery('');
    setSearched(false);
    setActive({});
    inputRef.current?.focus();
  }

  function setFilter(id: string, val: string | string[] | boolean | null) {
    setActive(prev => {
      const next = { ...prev };
      if (val === null || val === false || (Array.isArray(val) && val.length === 0)) {
        delete next[id];
      } else {
        next[id] = val;
      }
      return next;
    });
  }

  function activeChipLabel(id: string): string {
    const v = active[id];
    const fc = (FILTERS[scope] ?? []).find(f => f.id === id);
    if (Array.isArray(v)) return v.join(', ');
    if (v === true) return fc?.label ?? id;
    return String(v);
  }

  const showChipBar = searched || query.length > 0;

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── Scope dropdown modal ── */}
      <Modal visible={showScope} transparent animationType="fade" onRequestClose={() => setShowScope(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowScope(false)}>
          <View style={s.dropOverlay} />
        </Pressable>
        <View style={s.scopeDrop}>
          <ScrollView bounces={false}>
            {SCOPES.map(sc => (
              <TouchableOpacity
                key={sc.id}
                style={[s.dropItem, scope === sc.id && s.dropItemActive]}
                onPress={() => { setScope(sc.id as ScopeId); setShowScope(false); }}
              >
                <Text style={[s.dropItemText, scope === sc.id && s.dropItemTextActive]}>
                  {sc.icon}  {sc.fr}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Sort dropdown modal ── */}
      <Modal visible={showSort} transparent animationType="fade" onRequestClose={() => setShowSort(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSort(false)}>
          <View style={s.dropOverlay} />
        </Pressable>
        <View style={s.sortDrop}>
          {sortOpts.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[s.dropItem, sort === opt && s.dropItemActive]}
              onPress={() => { setSort(opt); setShowSort(false); }}
            >
              <Text style={[s.dropItemText, sort === opt && s.dropItemTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* ── Filter sheet ── */}
      {showFilter && (
        <FilterSheet
          scope={scope}
          active={active}
          onChange={setFilter}
          onClearAll={() => setActive({})}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.searchRow}>
          <TouchableOpacity
            style={s.scopeBtn}
            onPress={() => { setShowScope(!showScope); setShowSort(false); }}
          >
            <Text style={s.scopeBtnText} numberOfLines={1}>{cur.icon} {cur.fr} ▾</Text>
          </TouchableOpacity>

          <View style={[s.inputWrap, query.length > 0 && s.inputWrapActive]}>
            <Text style={s.searchIco}>🔍</Text>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={t => { setQuery(t); if (searched) setSearched(false); }}
              onSubmitEditing={() => doSearch(query)}
              placeholder={PHOLDS[scope] ?? 'Chercher…'}
              placeholderTextColor={MUTED}
              returnKeyType="search"
              style={s.input}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clear} hitSlop={8}>
                <Text style={s.clearX}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={s.locRow}
          onPress={() => {
            const next = locMode === 'drc' ? 'diaspora' : 'drc';
            setLocMode(next);
            setCity(next === 'drc' ? 'Kinshasa' : 'Paris');
          }}
        >
          <Text style={s.locLabel}>{locLabel}</Text>
        </TouchableOpacity>

        {showChipBar && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipsBar}
            contentContainerStyle={s.chipsContent}
          >
            <TouchableOpacity
              style={[s.chip, aCount > 0 && s.chipOn]}
              onPress={() => { setShowFilter(true); setShowScope(false); setShowSort(false); }}
            >
              <Text style={[s.chipText, aCount > 0 && s.chipTextOn]} numberOfLines={1}>
                ⚙ Filtres{aCount > 0 ? ` (${aCount})` : ''}
              </Text>
            </TouchableOpacity>

            {Object.keys(active).map(id => (
              <TouchableOpacity
                key={id}
                style={[s.chip, s.chipOn]}
                onPress={() => setFilter(id, null)}
              >
                <Text style={[s.chipText, s.chipTextOn]} numberOfLines={1}>
                  {activeChipLabel(id)} ×
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={s.chip}
              onPress={() => { setShowSort(!showSort); setShowScope(false); }}
            >
              <Text style={s.chipText} numberOfLines={1}>↕ {sort} ▾</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ── Map view (outside ScrollView) ── */}
      {searched && !isMockScope(scope) && !realLoading && viewMode === 'map' && realData?.businesses.length ? (
        <MapResults businesses={realData.businesses} mapRef={mapRef} />
      ) : null}

      {/* ── Body ── */}
      <ScrollView
        style={[s.body, searched && !isMockScope(scope) && !realLoading && viewMode === 'map' && realData?.businesses.length ? { display: 'none' } : {}]}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Autocomplete suggestions */}
        {sugg.length > 0 && (
          <View style={s.suggBox}>
            {sugg.map((sg, i) => (
              <TouchableOpacity
                key={i}
                style={[s.suggItem, i < sugg.length - 1 && s.suggBorder]}
                onPress={() => doSearch(sg.text)}
              >
                <Text style={s.suggIcon}>{sg.icon}</Text>
                <View>
                  <Text style={s.suggType}>{sg.type}</Text>
                  <Text style={s.suggText}>{sg.text}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pre-search: recents + scope chips */}
        {!searched && query.length < 2 && (
          <>
            {recent.length > 0 && (
              <View style={s.recentBox}>
                <Text style={s.sectionLabel}>RÉCENTS</Text>
                {recent.map((r, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.recentItem, i < recent.length - 1 && s.recentBorder]}
                    onPress={() => doSearch(r)}
                  >
                    <Text style={s.recentClock}>🕐</Text>
                    <Text style={s.recentText}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={s.exploreWrap}>
              <Text style={s.sectionLabel}>EXPLORER PAR TYPE</Text>
              <View style={s.exploreChips}>
                {SCOPES.filter(sc => sc.id !== 'all').map(sc => (
                  <TouchableOpacity
                    key={sc.id}
                    style={[s.exploreChip, scope === sc.id && s.exploreChipOn]}
                    onPress={() => setScope(sc.id as ScopeId)}
                  >
                    <Text style={[s.exploreChipText, scope === sc.id && s.exploreChipTextOn]}>
                      {sc.icon} {sc.fr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Results */}
        {searched && (
          isMockScope(scope) ? (
            <EmptyState scope={scope} query={query} onClear={clear} />
          ) : realLoading ? (
            <ActivityIndicator color={G} size="large" style={{ marginTop: 48 }} />
          ) : realData?.businesses.length ? (
            <>
              {/* List / Map toggle */}
              <View style={s.viewToggleRow}>
                <Text style={s.resultCount}>
                  {realData.businesses.length} résultat{realData.businesses.length > 1 ? 's' : ''}
                </Text>
                <View style={s.viewToggle}>
                  <TouchableOpacity
                    style={[s.viewToggleBtn, viewMode === 'list' && s.viewToggleBtnOn]}
                    onPress={() => setViewMode('list')}
                  >
                    <Text style={[s.viewToggleText, viewMode === 'list' && s.viewToggleTextOn]}>☰ Liste</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.viewToggleBtn, viewMode === 'map' && s.viewToggleBtnOn]}
                    onPress={() => setViewMode('map')}
                  >
                    <Text style={[s.viewToggleText, viewMode === 'map' && s.viewToggleTextOn]}>🗺 Carte</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {viewMode === 'list' ? (
                realData.businesses.map(b => (
                  <BusinessCard key={b.id} business={b} />
                ))
              ) : null}
            </>
          ) : (
            <EmptyState scope={scope} query={query} onClear={clear} />
          )
        )}
      </ScrollView>

      {/* Floating search button */}
      {query.length > 0 && !searched && (
        <View style={s.floatWrap} pointerEvents="box-none">
          <TouchableOpacity style={s.floatBtn} onPress={() => doSearch(query)}>
            <Text style={s.floatBtnText}>Rechercher</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:SURF },

  // Header
  header:          { backgroundColor:'#fff', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:6, elevation:6 },
  searchRow:       { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:14, paddingTop:10, paddingBottom:6 },
  scopeBtn:        { backgroundColor:GL, borderWidth:1.5, borderColor:G, borderRadius:22, paddingHorizontal:12, paddingVertical:8 },
  scopeBtnText:    { fontSize:13, fontWeight:'700', color:G },
  inputWrap:       { flex:1, flexDirection:'row', alignItems:'center', backgroundColor:SURF, borderRadius:12, borderWidth:1.5, borderColor:BORDER, paddingHorizontal:10, height:44 },
  inputWrapActive: { borderColor:G },
  searchIco:       { fontSize:14, marginRight:6 },
  input:           { flex:1, fontSize:15, color:DARK, paddingVertical:0 },
  clearX:          { fontSize:22, color:MUTED, lineHeight:26, paddingLeft:4 },

  locRow:  { paddingLeft:60, paddingBottom:8 },
  locLabel:{ fontSize:11, color:MUTED, textDecorationLine:'underline' },

  chipsBar:     { maxHeight:48 },
  chipsContent: { paddingHorizontal:14, paddingBottom:10, paddingTop:2, gap:8, alignItems:'center' },
  chip:         { backgroundColor:'#fff', borderWidth:1.5, borderColor:BORDER, borderRadius:20, paddingHorizontal:14, paddingVertical:7 },
  chipOn:       { backgroundColor:G, borderColor:G },
  chipText:     { fontSize:13, fontWeight:'700', color:DARK },
  chipTextOn:   { color:'#fff' },

  // Body
  body:        { flex:1 },
  bodyContent: { padding:14, paddingBottom:40 },

  // Autocomplete
  suggBox:   { backgroundColor:'#fff', borderRadius:14, overflow:'hidden', marginBottom:10, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:6, elevation:3 },
  suggItem:  { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:13 },
  suggBorder:{ borderBottomWidth:1, borderBottomColor:BORDER },
  suggIcon:  { fontSize:18 },
  suggType:  { fontSize:10, color:MUTED, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:1 },
  suggText:  { fontSize:14, color:DARK },

  // Recents
  recentBox:   { backgroundColor:'#fff', borderRadius:14, overflow:'hidden', marginBottom:10, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:6, elevation:3 },
  sectionLabel:{ fontSize:11, fontWeight:'800', color:MUTED, letterSpacing:0.8, paddingHorizontal:16, paddingTop:12, paddingBottom:6 },
  recentItem:  { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:11 },
  recentBorder:{ borderBottomWidth:1, borderBottomColor:BORDER },
  recentClock: { fontSize:16, color:'#CCC' },
  recentText:  { fontSize:14, color:DARK },

  // Explore chips
  exploreWrap:      { marginBottom:10 },
  exploreChips:     { flexDirection:'row', flexWrap:'wrap', gap:8, paddingTop:8 },
  exploreChip:      { backgroundColor:'#fff', borderWidth:1.5, borderColor:BORDER, borderRadius:22, paddingHorizontal:16, paddingVertical:9 },
  exploreChipOn:    { backgroundColor:G, borderColor:G },
  exploreChipText:  { fontSize:13, color:DARK },
  exploreChipTextOn:{ color:'#fff', fontWeight:'700' },

  // Results
  viewToggleRow:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  resultCount:      { fontSize:12, color:MUTED, fontWeight:'600' },
  viewToggle:       { flexDirection:'row', backgroundColor:'#f0f0f0', borderRadius:10, overflow:'hidden' },
  viewToggleBtn:    { paddingHorizontal:12, paddingVertical:6 },
  viewToggleBtnOn:  { backgroundColor:G },
  viewToggleText:   { fontSize:12, fontWeight:'600', color:MUTED },
  viewToggleTextOn: { color:'#fff' },

  // Floating button
  floatWrap: { position:'absolute', bottom:24, left:0, right:0, alignItems:'center' },
  floatBtn:  { backgroundColor:G, borderRadius:28, paddingHorizontal:40, paddingVertical:14, shadowColor:G, shadowOffset:{width:0,height:4}, shadowOpacity:0.45, shadowRadius:12, elevation:8 },
  floatBtnText: { color:'#fff', fontSize:16, fontWeight:'800' },

  // Dropdown modals
  dropOverlay:      { ...StyleSheet.absoluteFill, backgroundColor:'rgba(0,0,0,0.25)' },
  scopeDrop:        { position:'absolute', top:104, left:14, backgroundColor:'#fff', borderRadius:14, minWidth:195, maxHeight:380, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:6}, shadowOpacity:0.15, shadowRadius:16, elevation:20 },
  sortDrop:         { position:'absolute', top:104, right:14, backgroundColor:'#fff', borderRadius:12, minWidth:195, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:6}, shadowOpacity:0.12, shadowRadius:16, elevation:20 },
  dropItem:         { paddingHorizontal:18, paddingVertical:13, borderBottomWidth:1, borderBottomColor:BORDER },
  dropItemActive:   { backgroundColor:GL },
  dropItemText:     { fontSize:14, color:DARK },
  dropItemTextActive:{ color:G, fontWeight:'700' },
});
