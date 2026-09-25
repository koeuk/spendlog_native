import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { Tabs } from 'expo-router';
import { ChartNoAxesColumn, House, Menu, PiggyBank, ReceiptText, type LucideIcon } from 'lucide-react-native';
import { createContext, useContext, useEffect, useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { rgba } from '@/utils/color';

import { Txt } from './Txt';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

interface Destination {
  name: string;
  label: string;
  icon: LucideIcon;
}

const DESTINATIONS: Destination[] = [
  { name: '(dashboard)', label: 'Home', icon: House },
  { name: 'expenses', label: 'Expenses', icon: ReceiptText },
  { name: 'budgets', label: 'Budgets', icon: PiggyBank },
  { name: 'reports', label: 'Reports', icon: ChartNoAxesColumn },
];

/** The route whose branch the Menu tab lights up for; it is only entered from the menu sheet. */
const MENU_ROUTE = '(profile)';

/**
 * Menu entries whose screens live in the Home stack, so the dashboard cards can
 * push them in place. Showing one of them lights the Menu tab, not Home.
 */
const MENU_SCREENS = ['savings', 'income', 'recurring', 'borrowings'];

const SLOTS = DESTINATIONS.length + 1;
const PADDING = 5;
const SPRING = { damping: 28, stiffness: 180, mass: 0.8 };
const GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/** How far the pill floats above the bottom edge. */
function barOffset(bottomInset: number) {
  return Math.max(bottomInset - 8, 12);
}

/** Room content has to leave at its bottom so its last row clears the floating bar. */
export function useTabBarClearance() {
  const insets = useSafeAreaInsets();
  return barOffset(insets.bottom) + layout.tabBarHeight + 8;
}

/** Zero outside the tab shell, so forms and auth screens are left alone. */
export const TabBarInsetContext = createContext(0);

export function useTabBarInset() {
  return useContext(TabBarInsetContext);
}

interface Props extends TabBarProps {
  onMenu: () => void;
}

/**
 * A frosted pill that floats over the content, four tabs and a Menu inside.
 * Liquid glass on iOS 26, a translucent pane everywhere else. A glass lens
 * sits under the active tab; grab it and drag along the bar and it swells,
 * magnifies whatever it passes over, then settles on the tab it is let go on.
 */
export function TabBar({ state, navigation, onMenu }: Props) {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const focused = state.routes[state.index];
  const screen = focused?.state?.routes[focused.state.index ?? 0]?.name ?? '';
  const onMenuScreen = MENU_SCREENS.some((name) => screen === name || screen.startsWith(`${name}/`));
  const activeName = onMenuScreen ? MENU_ROUTE : focused?.name;
  const activeSlot = activeName === MENU_ROUTE ? SLOTS - 1 : Math.max(0, DESTINATIONS.findIndex((d) => d.name === activeName));

  const [width, setWidth] = useState(0);
  const slotWidth = width > 0 ? (width - PADDING * 2) / SLOTS : 0;
  /** The slot under the finger while dragging, so its label lights up before it is chosen. */
  const [hovered, setHovered] = useState<number | null>(null);
  const x = useSharedValue(0);
  const lift = useSharedValue(0);
  const origin = useSharedValue(0);
  const dragging = useSharedValue(false);
  useEffect(() => {
    x.set(withSpring(activeSlot * slotWidth, SPRING));
  }, [activeSlot, slotWidth, x]);

  /** Acts on a chosen slot, then parks the lens wherever the bar ends up lit. */
  const select = (slot: number) => {
    setHovered(null);
    const settle = (at: number) => x.set(withSpring(at * slotWidth, SPRING));
    if (slot === SLOTS - 1) {
      // Menu opens a sheet rather than a tab, so the lens goes back home.
      settle(activeSlot);
      onMenu();
      return;
    }
    const destination = DESTINATIONS[slot];
    const route = state.routes.find((candidate) => candidate.name === destination?.name);
    if (!route) return settle(activeSlot);
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (event.defaultPrevented) return settle(activeSlot);
    // Re-pressing the focused tab is left to its stack, which pops back to its
    // root on tabPress; that is how Home comes back from a Menu screen in its stack.
    if (route.key !== focused?.key) navigation.navigate(route.name, route.params);
    settle(slot);
  };
  // The drag ends on the UI thread and drops its slot here; the reaction is
  // rebuilt with every render, so it always reaches this render's select.
  const dropped = useSharedValue(-1);
  useAnimatedReaction(
    () => dropped.get(),
    (slot) => {
      if (slot < 0) return;
      dropped.set(-1);
      scheduleOnRN(select, slot);
    },
    [select],
  );

  const max = slotWidth * (SLOTS - 1);
  const drag = Gesture.Pan()
    .enabled(slotWidth > 0)
    .activeOffsetX([-6, 6])
    .onStart(() => {
      dragging.set(true);
      origin.set(x.get());
      lift.set(withSpring(1, SPRING));
    })
    .onUpdate((event) => {
      const next = Math.min(max, Math.max(0, origin.get() + event.translationX));
      const before = Math.round(x.get() / slotWidth);
      x.set(next);
      const after = Math.round(next / slotWidth);
      if (after !== before) scheduleOnRN(setHovered, after);
    })
    .onFinalize(() => {
      // A tap never starts the pan; its Pressable handles it.
      if (!dragging.get()) return;
      dragging.set(false);
      lift.set(withSpring(0, SPRING));
      dropped.set(Math.round(x.get() / slotWidth));
    });

  const lens = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { scaleX: 1 + lift.get() * 0.16 }, { scaleY: 1 + lift.get() * 0.22 }],
  }));

  const Pane = GLASS ? GlassView : View;
  const scheme = theme.isDark ? ('dark' as const) : ('light' as const);
  const lit = hovered ?? activeSlot;

  return (
    <View style={[styles.host, { bottom: barOffset(insets.bottom), pointerEvents: 'box-none' }]}>
      <GestureDetector gesture={drag}>
        <Pane
          {...(GLASS ? { glassEffectStyle: 'regular' as const, colorScheme: scheme } : {})}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={[
            styles.bar,
            !GLASS && {
              // No blur behind Android views, so the pane stays nearly opaque there.
              backgroundColor: rgba(theme.surface, Platform.OS === 'android' ? 0.96 : theme.isDark ? 0.82 : 0.78),
              borderColor: theme.isDark ? rgba('#FFFFFF', 0.1) : rgba('#FFFFFF', 0.9),
            },
            GLASS && styles.glass,
          ]}>
          {slotWidth > 0 && (
            <Animated.View style={[styles.lens, { width: slotWidth }, lens]}>
              {GLASS ? (
                <GlassView glassEffectStyle="clear" isInteractive colorScheme={scheme} style={styles.lensFill} />
              ) : (
                <View
                  style={[
                    styles.lensFill,
                    styles.lensRim,
                    {
                      backgroundColor: theme.isDark ? rgba('#FFFFFF', 0.12) : rgba('#FFFFFF', 0.85),
                      borderColor: theme.isDark ? rgba('#FFFFFF', 0.22) : rgba('#FFFFFF', 1),
                    },
                  ]}
                />
              )}
            </Animated.View>
          )}
          {DESTINATIONS.map((destination, slot) => (
            <TabItem
              key={destination.name}
              destination={destination}
              label={t(destination.label)}
              active={lit === slot}
              slot={slot}
              slotWidth={slotWidth}
              x={x}
              lift={lift}
              onPress={() => select(slot)}
            />
          ))}
          <TabItem
            destination={{ name: MENU_ROUTE, label: 'Menu', icon: Menu }}
            label={t('Menu')}
            active={lit === SLOTS - 1}
            slot={SLOTS - 1}
            slotWidth={slotWidth}
            x={x}
            lift={lift}
            onPress={() => select(SLOTS - 1)}
          />
        </Pane>
      </GestureDetector>
    </View>
  );
}

interface TabItemProps {
  destination: Destination;
  label: string;
  active: boolean;
  slot: number;
  slotWidth: number;
  x: SharedValue<number>;
  lift: SharedValue<number>;
  onPress: () => void;
}

/** One tab; it swells as the dragged lens passes over it, like looking through glass. */
function TabItem({ destination, label, active, slot, slotWidth, x, lift, onPress }: TabItemProps) {
  const theme = useTheme();
  const color = active ? theme.accent : theme.faint(0.55);
  const Icon = destination.icon;
  const magnify = useAnimatedStyle(() => {
    if (slotWidth === 0) return {};
    const near = interpolate(Math.abs(x.get() - slot * slotWidth), [0, slotWidth], [1, 0], 'clamp');
    return { transform: [{ scale: 1 + near * lift.get() * 0.14 }] };
  });
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}>
      <Animated.View style={[styles.itemInner, magnify]}>
        <Icon size={22} color={color} strokeWidth={active ? 2.4 : 2} />
        <Txt variant="caption" weight={active ? 'semibold' : 'medium'} color={color} numberOfLines={1}>
          {label}
        </Txt>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: layout.tabBarHeight,
    padding: PADDING,
    borderRadius: layout.tabBarHeight / 2,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)', backdropFilter: 'blur(20px) saturate(180%)' },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
    }),
  },
  glass: { borderWidth: 0 },
  lens: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
  },
  lensFill: { flex: 1, borderRadius: (layout.tabBarHeight - PADDING * 2) / 2 },
  lensRim: {
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0, 0, 0, 0.10)' },
      default: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    }),
  },
  item: { flex: 1 },
  itemInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
