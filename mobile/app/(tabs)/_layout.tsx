import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAppStore } from '../../store/app';

export default function TabLayout() {
  const router = useRouter();
  const { hasOnboarded, _hasHydrated } = useAppStore();

  useEffect(() => {
    if (_hasHydrated && !hasOnboarded) {
      router.replace('/onboarding');
    }
  }, [_hasHydrated, hasOnboarded]);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#25D366',
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Explorer',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🔍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="carte"
        options={{
          title: 'Carte',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🗺</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="economie"
        options={{
          title: 'Économie',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📈</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: 'Compte',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
