import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth';
import { registerPushToken, deregisterPushToken } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export function usePushToken() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      // Deregister when user logs out
      if (tokenRef.current) {
        deregisterPushToken(tokenRef.current).catch(() => {});
        tokenRef.current = null;
      }
      return;
    }
    registerAsync().catch(console.error);
  }, [isLoggedIn]);
}

async function registerAsync() {
  if (!Device.isDevice) return; // push tokens not available on simulator

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;
  if (!projectId) {
    console.warn('[push] No EAS projectId found — skipping token registration');
    return;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  await registerPushToken(token, platform);
}
