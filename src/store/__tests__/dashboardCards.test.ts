import { DEFAULT_SUMMARY_CARDS, useDashboardCardsStore } from '../dashboardCards';

describe('useDashboardCardsStore', () => {
  beforeEach(() => {
    useDashboardCardsStore.getState().resetCards();
  });

  it('starts with all default cards visible', () => {
    const cards = useDashboardCardsStore.getState().cards;
    expect(cards).toEqual(DEFAULT_SUMMARY_CARDS);
    expect(cards.every((c) => c.visible)).toBe(true);
  });

  it('toggles visibility of a card', () => {
    useDashboardCardsStore.getState().toggleCard('today');
    const todayCard = useDashboardCardsStore.getState().cards.find((c) => c.id === 'today');
    expect(todayCard?.visible).toBe(false);

    useDashboardCardsStore.getState().toggleCard('today');
    const todayCardAgain = useDashboardCardsStore.getState().cards.find((c) => c.id === 'today');
    expect(todayCardAgain?.visible).toBe(true);
  });

  it('prevents hiding the last visible card', () => {
    useDashboardCardsStore.getState().toggleCard('today');
    useDashboardCardsStore.getState().toggleCard('balance');
    useDashboardCardsStore.getState().toggleCard('savings');

    const visibleBefore = useDashboardCardsStore.getState().cards.filter((c) => c.visible);
    expect(visibleBefore.length).toBe(1);
    expect(visibleBefore[0].id).toBe('income');

    // Attempt to toggle the last remaining visible card off
    useDashboardCardsStore.getState().toggleCard('income');
    const visibleAfter = useDashboardCardsStore.getState().cards.filter((c) => c.visible);
    expect(visibleAfter.length).toBe(1);
    expect(visibleAfter[0].id).toBe('income');
  });

  it('reorders cards with moveCard', () => {
    // Initially [today, balance, savings, income]
    useDashboardCardsStore.getState().moveCard(0, 1);
    const order = useDashboardCardsStore.getState().cards.map((c) => c.id);
    expect(order).toEqual(['balance', 'today', 'savings', 'income']);
  });

  it('resets cards to default', () => {
    useDashboardCardsStore.getState().toggleCard('today');
    useDashboardCardsStore.getState().moveCard(0, 2);
    useDashboardCardsStore.getState().resetCards();

    expect(useDashboardCardsStore.getState().cards).toEqual(DEFAULT_SUMMARY_CARDS);
  });
});
