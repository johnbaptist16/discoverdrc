import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from '@/components/useColorScheme';
import { usePushToken } from '../hooks/usePushToken';
import { useAuthStore } from '../store/auth';
import { useFavoritesStore } from '../store/favorites';
import { fetchFavorites } from '../services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // show cached data for 5 min before background refetch
      gcTime: 24 * 60 * 60 * 1000,    // keep unused cache for 24 h (offline fallback)
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
      networkMode: 'offlineFirst',     // serve cache immediately, fetch when able
    },
  },
});

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={eb.container}>
      <Text style={eb.emoji}>⚠️</Text>
      <Text style={eb.title}>Quelque chose s'est mal passé</Text>
      <Text style={eb.message}>{error.message}</Text>
      <TouchableOpacity style={eb.btn} onPress={retry}>
        <Text style={eb.btnText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const eb = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  emoji:     { fontSize: 48, marginBottom: 16 },
  title:     { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  message:   { fontSize: 13, color: '#666', marginBottom: 32, textAlign: 'center' },
  btn:       { backgroundColor: '#25D366', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function PushTokenRegistrar() {
  usePushToken();
  return null;
}

function FavoritesSyncer() {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  const mergeFromServer = useFavoritesStore(s => s.mergeFromServer);
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchFavorites().then(mergeFromServer).catch(() => {});
  }, [isLoggedIn]);
  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <PushTokenRegistrar />
      <FavoritesSyncer />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="business/[id]" options={{ title: 'Commerce', headerBackTitle: 'Retour' }} />
          <Stack.Screen name="business/add" options={{ title: 'Ajouter mon commerce', headerBackTitle: 'Retour' }} />
          <Stack.Screen name="business/my" options={{ headerShown: false }} />
          <Stack.Screen name="favorites/index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
