import { View, Text } from 'react-native';
import { Business } from '../services/api';

export function MapResults({ businesses }: { businesses: Business[]; mapRef?: unknown }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 32, marginBottom: 12 }}>🗺</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 }}>
        Carte disponible sur mobile
      </Text>
      <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>
        Installez l'application sur Android ou iOS pour voir les {businesses.length} commerces sur la carte.
      </Text>
    </View>
  );
}
