import { TouchableOpacity, Text, StyleSheet, Linking, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { trackWhatsAppClick } from '../services/api';

export function WhatsAppButton({ businessId }: { businessId: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePress() {
    setLoading(true);
    try {
      const url = await trackWhatsAppClick(businessId);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // WhatsApp not installed — extract number and offer alternatives
        const match = url.match(/wa\.me\/(\d+)/);
        const number = match ? `+${match[1]}` : null;
        Alert.alert(
          'WhatsApp non disponible',
          number
            ? `Appelez ou envoyez un SMS au ${number}`
            : 'Impossible d\'ouvrir WhatsApp sur cet appareil.',
          [
            number ? { text: `Appeler ${number}`, onPress: () => Linking.openURL(`tel:${number}`) } : null,
            { text: 'OK', style: 'cancel' },
          ].filter(Boolean) as any,
        );
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de contacter ce commerce. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} disabled={loading}>
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={styles.label}>💬 Contacter sur WhatsApp</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
