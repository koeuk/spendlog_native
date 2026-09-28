import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SummaryCardId = 'today' | 'balance' | 'savings' | 'income';

export interface SummaryCardItem {
  id: SummaryCardId;
  visible: boolean;
}

export const DEFAULT_SUMMARY_CARDS: SummaryCardItem[] = [
  { id: 'today', visible: true },
  { id: 'balance', visible: true },
  { id: 'savings', visible: true },
  { id: 'income', visible: true },
];

interface DashboardCardsState {
  cards: SummaryCardItem[];
  toggleCard: (id: SummaryCardId) => void;
  moveCard: (fromIndex: number, toIndex: number) => void;
  resetCards: () => void;
}

export const useDashboardCardsStore = create<DashboardCardsState>()(
  persist(
    (set) => ({
      cards: DEFAULT_SUMMARY_CARDS,
      toggleCard: (id) =>
        set((state) => {
          // Keep at least one card visible so the section isn't completely empty
          const target = state.cards.find((c) => c.id === id);
          if (target?.visible) {
            const visibleCount = state.cards.filter((c) => c.visible).length;
            if (visibleCount <= 1) {
              return state;
            }
          }
          return {
            cards: state.cards.map((card) => (card.id === id ? { ...card, visible: !card.visible } : card)),
          };
        }),
      moveCard: (fromIndex, toIndex) =>
        set((state) => {
          if (fromIndex < 0 || fromIndex >= state.cards.length || toIndex < 0 || toIndex >= state.cards.length) {
            return state;
          }
          const updated = [...state.cards];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          return { cards: updated };
        }),
      resetCards: () => set({ cards: DEFAULT_SUMMARY_CARDS }),
    }),
    {
      name: 'spendlog.dashboard_cards',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<DashboardCardsState> | undefined;
        if (!persisted || !Array.isArray(persisted.cards)) {
          return currentState;
        }
        const validIds = new Set(DEFAULT_SUMMARY_CARDS.map((c) => c.id));
        const savedCards = persisted.cards.filter((c) => validIds.has(c.id));
        const savedIds = new Set(savedCards.map((c) => c.id));
        const missingCards = DEFAULT_SUMMARY_CARDS.filter((c) => !savedIds.has(c.id));
        return {
          ...currentState,
          cards: [...savedCards, ...missingCards],
        };
      },
    },
  ),
);
