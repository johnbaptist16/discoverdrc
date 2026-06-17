import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  hasOnboarded: boolean;
  preferredCommune: string | null;
  _hasHydrated: boolean;
  setOnboarded: (commune: string | null) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      preferredCommune: null,
      _hasHydrated: false,
      setOnboarded: (commune) => set({ hasOnboarded: true, preferredCommune: commune }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'discoverdrc-app',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
