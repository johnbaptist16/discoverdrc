import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import { useFavoritesStore } from '../../store/favorites';
import { loginUser, registerUser } from '../../services/api';

const G = '#25D366';

// ─── Logged-in profile view ───────────────────────────────────────────────────

function ProfileView() {
  const { user, logout } = useAuthStore();
  const { businesses: favs } = useFavoritesStore();
  const router = useRouter();

  function handleLogout() {
    Alert.alert(
      'Se déconnecter',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: logout },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={p.container}>
      <View style={p.avatar}>
        <Text style={p.avatarText}>{user?.display_name?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <Text style={p.name}>{user?.display_name}</Text>
      <Text style={p.phone}>{user?.phone}</Text>

      {user?.role === 'admin' && (
        <View style={p.roleBadge}>
          <Text style={p.roleBadgeText}>Administrateur</Text>
        </View>
      )}

      <View style={p.divider} />

      <TouchableOpacity style={p.actionRow} onPress={() => router.push('/business/my')}>
        <Text style={p.actionIcon}>🏪</Text>
        <View style={p.actionText}>
          <Text style={p.actionLabel}>Mes commerces</Text>
          <Text style={p.actionSub}>Gérer vos listings DiscoverDRC</Text>
        </View>
        <Text style={p.actionChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={p.actionRow} onPress={() => router.push('/business/add')}>
        <Text style={p.actionIcon}>➕</Text>
        <View style={p.actionText}>
          <Text style={p.actionLabel}>Ajouter mon commerce</Text>
          <Text style={p.actionSub}>Rejoindre l'annuaire gratuitement</Text>
        </View>
        <Text style={p.actionChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={p.actionRow} onPress={() => router.push('/favorites')}>
        <Text style={p.actionIcon}>⭐</Text>
        <View style={p.actionText}>
          <Text style={p.actionLabel}>Favoris</Text>
          <Text style={p.actionSub}>
            {favs.length > 0
              ? `${favs.length} commerce${favs.length > 1 ? 's' : ''} sauvegardé${favs.length > 1 ? 's' : ''}`
              : 'Vos commerces sauvegardés'}
          </Text>
        </View>
        {favs.length > 0 && (
          <View style={p.badge}>
            <Text style={p.badgeText}>{favs.length}</Text>
          </View>
        )}
        <Text style={p.actionChevron}>›</Text>
      </TouchableOpacity>

      <View style={p.divider} />

      <TouchableOpacity style={p.logoutBtn} onPress={handleLogout}>
        <Text style={p.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const p = StyleSheet.create({
  container:     { alignItems: 'center', padding: 24, paddingBottom: 48 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: G, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 12 },
  avatarText:    { fontSize: 36, fontWeight: '800', color: '#fff' },
  name:          { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  phone:         { fontSize: 15, color: '#888', marginBottom: 8 },
  roleBadge:     { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: '#b45309' },
  divider:       { width: '100%', height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  actionRow:     { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  actionIcon:    { fontSize: 22, width: 36 },
  actionText:    { flex: 1 },
  actionLabel:   { fontSize: 15, fontWeight: '600', color: '#111' },
  actionSub:     { fontSize: 12, color: '#888', marginTop: 2 },
  actionChevron: { fontSize: 20, color: '#ccc' },
  badge:         { backgroundColor: '#25D366', borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginRight: 6 },
  badgeText:     { color: '#fff', fontSize: 12, fontWeight: '800' },
  logoutBtn:     { marginTop: 8, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10, borderWidth: 1.5, borderColor: '#dc2626' },
  logoutText:    { color: '#dc2626', fontSize: 15, fontWeight: '700' },
});

// ─── Auth form (login / register) ────────────────────────────────────────────

type AuthMode = 'login' | 'register';

function AuthForm() {
  const { setAuth } = useAuthStore();
  const [mode, setMode]               = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);

  function reset() {
    setDisplayName(''); setPhone(''); setPassword(''); setConfirmPwd('');
  }

  function switchMode(next: AuthMode) {
    reset();
    setMode(next);
  }

  async function handleSubmit() {
    const trimPhone = phone.trim();
    const trimPwd   = password.trim();

    if (!trimPhone || !trimPwd) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        Alert.alert('Champs requis', 'Veuillez entrer votre nom.');
        return;
      }
      if (trimPwd.length < 6) {
        Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.');
        return;
      }
      if (trimPwd !== confirmPwd.trim()) {
        Alert.alert('Mots de passe différents', 'Les deux mots de passe ne correspondent pas.');
        return;
      }
    }

    setLoading(true);
    try {
      const data = mode === 'login'
        ? await loginUser(trimPhone, trimPwd)
        : await registerUser(trimPhone, displayName.trim(), trimPwd);
      setAuth(data.token, data.user);
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (msg === 'Invalid phone or password') {
        Alert.alert('Échec de connexion', 'Numéro ou mot de passe incorrect.');
      } else if (msg === 'Phone number already registered') {
        Alert.alert('Déjà inscrit', 'Ce numéro est déjà associé à un compte. Connectez-vous.');
        switchMode('login');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={f.container} keyboardShouldPersistTaps="handled">

        <Text style={f.logo}>📍</Text>
        <Text style={f.title}>DiscoverDRC</Text>
        <Text style={f.subtitle}>
          {isLogin
            ? 'Connectez-vous pour gérer votre commerce'
            : 'Créez votre compte gratuitement'}
        </Text>

        <View style={f.form}>
          {!isLogin && (
            <View style={f.field}>
              <Text style={f.label}>Votre nom</Text>
              <TextInput
                style={f.input}
                placeholder="Ex: Jean-Baptiste Mbokolo"
                placeholderTextColor="#bbb"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          <View style={f.field}>
            <Text style={f.label}>Numéro de téléphone</Text>
            <TextInput
              style={f.input}
              placeholder="+243 8XX XXX XXX"
              placeholderTextColor="#bbb"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
            />
          </View>

          <View style={f.field}>
            <Text style={f.label}>Mot de passe</Text>
            <View style={f.pwdWrap}>
              <TextInput
                style={[f.input, { flex: 1, borderWidth: 0 }]}
                placeholder="Minimum 6 caractères"
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                returnKeyType={isLogin ? 'done' : 'next'}
                onSubmitEditing={isLogin ? handleSubmit : undefined}
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={f.eyeBtn}>
                <Text style={f.eyeText}>{showPwd ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isLogin && (
            <View style={f.field}>
              <Text style={f.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={f.input}
                placeholder="Répétez votre mot de passe"
                placeholderTextColor="#bbb"
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          )}

          <TouchableOpacity
            style={[f.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={f.submitText}>
                  {isLogin ? 'Se connecter' : 'Créer mon compte'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        <View style={f.switchRow}>
          <Text style={f.switchText}>
            {isLogin ? 'Pas encore de compte ?' : 'Déjà inscrit ?'}
          </Text>
          <TouchableOpacity onPress={() => switchMode(isLogin ? 'register' : 'login')}>
            <Text style={f.switchLink}>
              {isLogin ? '  Créer un compte' : '  Se connecter'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={f.legalNote}>
          En vous inscrivant, vous acceptez que vos données soient utilisées
          pour l'annuaire DiscoverDRC. Aucune donnée n'est partagée avec des tiers.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const f = StyleSheet.create({
  container:  { flexGrow: 1, padding: 24, paddingBottom: 48 },
  logo:       { fontSize: 48, textAlign: 'center', marginTop: 24, marginBottom: 8 },
  title:      { fontSize: 28, fontWeight: '900', color: '#111', textAlign: 'center', marginBottom: 4 },
  subtitle:   { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  form:       { gap: 16 },
  field:      { gap: 6 },
  label:      { fontSize: 13, fontWeight: '700', color: '#444' },
  input:      { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#111' },
  pwdWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14 },
  eyeBtn:     { paddingVertical: 13, paddingLeft: 8 },
  eyeText:    { fontSize: 18 },
  submitBtn:  { backgroundColor: G, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' },
  switchText: { fontSize: 14, color: '#888' },
  switchLink: { fontSize: 14, color: G, fontWeight: '700' },
  legalNote:  { fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 32, lineHeight: 16 },
});

// ─── Root screen ──────────────────────────────────────────────────────────────

export default function CompteScreen() {
  const { isLoggedIn } = useAuthStore();
  const { businesses: favs } = useFavoritesStore();
  const router = useRouter();

  return (
    <SafeAreaView style={root.container} edges={['top']}>
      <View style={root.header}>
        <Text style={root.headerTitle}>Mon Compte</Text>
        {favs.length > 0 && (
          <TouchableOpacity style={root.favShortcut} onPress={() => router.push('/favorites')}>
            <Text style={root.favShortcutText}>⭐ {favs.length}</Text>
          </TouchableOpacity>
        )}
      </View>
      {isLoggedIn ? <ProfileView /> : <AuthForm />}
    </SafeAreaView>
  );
}

const root = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f7f7f7' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#f7f7f7' },
  headerTitle:      { fontSize: 22, fontWeight: '800', color: '#111' },
  favShortcut:      { backgroundColor: '#f0faf4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  favShortcutText:  { fontSize: 14, fontWeight: '700', color: '#25D366' },
});
