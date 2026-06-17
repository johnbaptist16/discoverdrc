import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Business, addFavorite, removeFavorite } from '../services/api';
import { useAuthStore } from './auth';

interface FavoritesState {
  businesses: Business[];
  isFavorite: (id: string) => boolean;
  toggle: (business: Business) => void;
  mergeFromServer: (serverBusinesses: Business[]) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      businesses: [],

      isFavorite: (id) => get().businesses.some(b => b.id === id),

      toggle: (business) => {
        const existing = get().businesses.some(b => b.id === business.id);
        // Optimistic local update — instant UI feedback
        set({
          businesses: existing
            ? get().businesses.filter(b => b.id !== business.id)
            : [business, ...get().businesses],
        });
        // Fire-and-forget server sync when logged in
        const token = useAuthStore.getState().token;
        if (token) {
          (existing ? removeFavorite(business.id) : addFavorite(business.id)).catch(() => {});
        }
      },

      // Called on login: merges server list into local store (dedup by id)
      mergeFromServer: (serverBusinesses) => {
        const local = get().businesses;
        const serverIds = new Set(serverBusinesses.map(b => b.id));
        const localIds = new Set(local.map(b => b.id));
        // Upload any local-only favorites (added while logged out) to server
        local.forEach(b => {
          if (!serverIds.has(b.id)) addFavorite(b.id).catch(() => {});
        });
        // Prepend server businesses not yet in local store
        const toAdd = serverBusinesses.filter(b => !localIds.has(b.id));
        if (toAdd.length) {
          set({ businesses: [...toAdd, ...local] });
        }
      },
    }),
    {
      name: 'discoverdrc-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
