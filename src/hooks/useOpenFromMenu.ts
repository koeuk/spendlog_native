import { useNavigation } from 'expo-router';

/** The two tab branches whose screens the menu opens. */
export type MenuBranch = '(dashboard)' | '(profile)';

interface Navigator {
  navigate: (name: string, params: object) => void;
}

/**
 * Opens a menu destination on a fresh stack. A plain push lands on top of
 * whatever that branch last showed, so Back from Settings could walk into
 * Users. Handing the branch a `state` resets it instead: a Home screen sits
 * over the dashboard, a Menu screen stands alone, and Back from it returns
 * to the tab the menu was opened from.
 */
export function useOpenFromMenu() {
  const navigation = useNavigation() as unknown as Navigator;
  return (branch: MenuBranch, screen: string) => {
    const routes = branch === '(dashboard)' ? [{ name: 'index' }, { name: screen }] : [{ name: screen }];
    navigation.navigate('(app)', { screen: branch, params: { state: { index: routes.length - 1, routes } } });
  };
}
