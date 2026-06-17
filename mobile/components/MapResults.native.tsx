import { View, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Business } from '../services/api';

const KIN_REGION = { latitude: -4.3317, longitude: 15.3314, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export function MapResults({ businesses, mapRef }: {
  businesses: Business[];
  mapRef: React.RefObject<MapView | null>;
}) {
  const router = useRouter();
  const mapped = businesses.filter(b => b.latitude && b.longitude);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={KIN_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {mapped.map(b => (
          <Marker
            key={b.id}
            coordinate={{ latitude: Number(b.latitude), longitude: Number(b.longitude) }}
            pinColor="#25D366"
          >
            <Callout onPress={() => router.push(`/business/${b.id}`)}>
              <View style={{ padding: 8, maxWidth: 200 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#111' }}>{b.name}</Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>📍 {b.commune}</Text>
                <Text style={{ fontSize: 12, color: '#25D366', marginTop: 4, fontWeight: '600' }}>
                  Voir les détails →
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {mapped.length < businesses.length && (
        <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 10 }}>
          <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
            {mapped.length} sur {businesses.length} commerces localisés sur la carte
          </Text>
        </View>
      )}
    </View>
  );
}
