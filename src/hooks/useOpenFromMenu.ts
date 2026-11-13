import { useNavigation, useRouter, type Href } from 'expo-router';
import { CommonActions } from 'expo-router/react-navigation';

/** The two tab branches whose screens the menu opens. */
export type MenuBranch = '(dashboard)' | '(profile)';

/**
 * Reset an existing branch before opening the complete href. Home destinations
 * keep the dashboard underneath; profile destinations stand alone so Back
 * returns to the previous tab instead of another menu destination.
 */
export function useOpenFromMenu() {
  const navigation = useNavigation('/');
  const router = useRouter();
  return (branch: MenuBranch, screen: string) => {
    const tabsState = navigation.getState()?.routes.find((route) => route.name === '(app)')?.state;
    const branchState = tabsState?.routes.find((route) => route.name === branch)?.state;
    if (branchState) {
      const routes = branch === '(dashboard)' ? [{ name: 'index' }, { name: screen }] : [{ name: screen }];
      // Apply this reset before the href navigation reads the branch's state.
      navigation.dispatchSync({
        ...CommonActions.reset({ ...branchState, index: routes.length - 1, routes }),
        target: branchState.key,
      });
    }
    const path = screen.replace(/\/index$/, '');
    router.navigate(`/(app)/${branch}/${path}` as Href, { withAnchor: branch === '(dashboard)' });
  };
}
