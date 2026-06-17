import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'DiscoverDRC',
  slug: 'discoverdrc',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'discoverdrc',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.discoverdrc.app',
  },
  android: {
    package: 'com.discoverdrc.app',
    adaptiveIcon: {
      backgroundColor: '#25D366',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#25D366',
      },
    ],
    'expo-video',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#25D366',
        defaultChannel: 'default',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      // Register at https://expo.dev and run `eas init` to get your project ID
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
  },
});
