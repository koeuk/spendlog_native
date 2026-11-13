import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { usePathname } from 'expo-router';
import type { Tabs } from 'expo-router/js-tabs';
import { ChartNoAxesColumn, House, Menu, PiggyBank, ReceiptText, type LucideIcon } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { rgba } from '@/utils/color';

import { Txt } from './Txt';

// Optional expo-haptics integration with graceful runtime fallback
interface HapticsModule {
  selectionAsync?: () => Promise<void>;
  impactAsync?: (style: unknown) => Promise<void>;
  ImpactFeedbackStyle?: { Light: unknown; Medium: unknown; Heavy: unknown };
}

let Haptics: HapticsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics') as HapticsModule;
} catch {
  // Graceful fallback when expo-haptics is not available
}

function triggerHaptic() {
  try {
    if (Haptics?.selectionAsync) {
      void Haptics.selectionAsync();
    } else if (Haptics?.impactAsync && Haptics.ImpactFeedbackStyle?.Light) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Ignore on unsupported platforms (e.g. web)
  }
}

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

interface Destination {
  name: string;
  label: string;
  icon: LucideIcon;
}

interface TabLayout {
  x: number;
  width: number;
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

/** Spring configuration: damping 18, stiffness 220 */
const SPRING_CONFIG = { damping: 18, stiffness: 220 };

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
 * A floating liquid glass tab bar with a single sliding pill indicator.
 *
 * - Measures each tab item with onLayout
 * - Animates the single pill indicator's translateX and width with spring physics
 * - Slight horizontal stretch (scaleX up to 1.08) while moving, returning to 1
 * - Press-and-drag via PanGesture with finger tracking and nearest-item snapping
 * - Haptic feedback when the pill lands on or crosses a new item
 */
export function TabBar({ state, emitter, navigateToTab, onMenu }: Props) {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const focused = state.routes[state.index];
  const pathname = usePathname();
  const onMenuScreen = MENU_SCREENS.some((name) => pathname === `/${name}` || pathname.startsWith(`/${name}/`));
  const activeName = onMenuScreen ? MENU_ROUTE : focused?.name;
  const activeSlot = activeName === MENU_ROUTE ? SLOTS - 1 : Math.max(0, DESTINATIONS.findIndex((d) => d.name === activeName));

  /** Stored measurements for each tab slot */
  const layoutsRef = useRef<Record<number, TabLayout>>({});
  const tabLayouts = useSharedValue<Record<number, TabLayout>>({});
  const hasInitialized = useSharedValue(false);

  /** Active slot under finger while dragging */
  const [hovered, setHovered] = useState<number | null>(null);

  /** Pill animation shared values */
  const translateX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const scaleX = useSharedValue(1);

  /** Drag tracking shared values */
  const dragStartX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const currentNearest = useSharedValue(activeSlot);
  const dropped = useSharedValue(-1);

  /** Gentle swell when touching or hovering over the whole bar */
  const touch = useSharedValue(0);
  const hover = useSharedValue(0);

  /**
   * Handle layout measurement of an item.
   * When the active item is measured for the first time, positions the pill immediately.
   */
  const handleItemLayout = useCallback(
    (slot: number, x: number, width: number) => {
      layoutsRef.current[slot] = { x, width };
      tabLayouts.set({ ...layoutsRef.current });

      if (slot === activeSlot && !hasInitialized.get()) {
        translateX.set(x);
        pillWidth.set(width);
        pillOpacity.set(withTiming(1, { duration: 150 }));
        hasInitialized.set(true);
      }
    },
    [activeSlot, hasInitialized, pillOpacity, pillWidth, tabLayouts, translateX],
  );

  /** Animate the pill to a target slot with spring and slight stretch */
  const animatePillToSlot = useCallback(
    (slot: number) => {
      const layoutData = layoutsRef.current[slot];
      if (!layoutData) return;

      // Slight stretch while moving: scaleX up to 1.08, then spring back to 1
      scaleX.set(
        withSequence(
          withSpring(1.08, { damping: 12, stiffness: 280 }),
          withSpring(1, SPRING_CONFIG),
        ),
      );

      translateX.set(withSpring(layoutData.x, SPRING_CONFIG));
      pillWidth.set(withSpring(layoutData.width, SPRING_CONFIG));
    },
    [pillWidth, scaleX, translateX],
  );

  /** Update pill position when activeSlot changes programmatically or via navigation */
  useEffect(() => {
    animatePillToSlot(activeSlot);
  }, [activeSlot, animatePillToSlot]);

  /** Select a tab slot and navigate or open menu */
  const select = useCallback(
    (slot: number) => {
      setHovered(null);
      triggerHaptic();

      if (slot === SLOTS - 1) {
        // Menu opens a sheet; pill returns to the active tab
        animatePillToSlot(activeSlot);
        onMenu();
        return;
      }

      const destination = DESTINATIONS[slot];
      const route = state.routes.find((candidate) => candidate.name === destination?.name);
      if (!route) {
        animatePillToSlot(activeSlot);
        return;
      }

      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (event.defaultPrevented) {
        animatePillToSlot(activeSlot);
        return;
      }

      if (route.key !== focused?.key) {
        navigateToTab(route.key);
      }

      animatePillToSlot(slot);
    },
    [activeSlot, animatePillToSlot, emitter, focused?.key, navigateToTab, onMenu, state.routes],
  );

  /** Reaction for drop landing from gesture worklet */
  useAnimatedReaction(
    () => dropped.get(),
    (slot) => {
      if (slot < 0) return;
      dropped.set(-1);
      scheduleOnRN(select, slot);
    },
    [select],
  );

  /** Pan gesture: move the pill with finger, detect nearest slot, snap on release */
  const panGesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .onBegin(() => {
      touch.set(withSpring(1, SPRING_CONFIG));
    })
    .onStart(() => {
      isDragging.set(true);
      dragStartX.set(translateX.get());
      scaleX.set(withSpring(1.08, { damping: 14, stiffness: 260 }));
    })
    .onUpdate((event) => {
      const layouts = tabLayouts.get();
      const keys = Object.keys(layouts).map(Number);
      if (keys.length === 0) return;

      const minX = layouts[0]?.x ?? 0;
      const maxKey = Math.max(...keys);
      const maxX = layouts[maxKey]?.x ?? 0;

      // Follow finger with clamping
      const nextX = Math.min(maxX, Math.max(minX, dragStartX.get() + event.translationX));
      translateX.set(nextX);

      // Find nearest item slot by comparing centers
      const pillCenter = nextX + pillWidth.get() / 2;
      let nearestSlot = 0;
      let minDistance = Infinity;

      for (const key of keys) {
        const item = layouts[key];
        if (!item) continue;
        const itemCenter = item.x + item.width / 2;
        const dist = Math.abs(pillCenter - itemCenter);
        if (dist < minDistance) {
          minDistance = dist;
          nearestSlot = key;
        }
      }

      const previousNearest = currentNearest.get();
      if (nearestSlot !== previousNearest) {
        currentNearest.set(nearestSlot);
        // Haptic feedback as finger crosses into a new item
        scheduleOnRN(triggerHaptic);
        scheduleOnRN(setHovered, nearestSlot);

        // Adjust width to match hovered item
        const hoveredLayout = layouts[nearestSlot];
        if (hoveredLayout) {
          pillWidth.set(withSpring(hoveredLayout.width, SPRING_CONFIG));
        }
      }
    })
    .onFinalize(() => {
      touch.set(withSpring(0, SPRING_CONFIG));
      if (!isDragging.get()) return;
      isDragging.set(false);

      const layouts = tabLayouts.get();
      const nearest = currentNearest.get();
      const targetLayout = layouts[nearest];

      if (targetLayout) {
        translateX.set(withSpring(targetLayout.x, SPRING_CONFIG));
        pillWidth.set(withSpring(targetLayout.width, SPRING_CONFIG));
      }
      scaleX.set(withSpring(1, SPRING_CONFIG));

      // Haptic feedback on pill landing
      scheduleOnRN(triggerHaptic);
      dropped.set(nearest);
    });

  const hoverGesture = Gesture.Hover()
    .onBegin(() => {
      hover.set(withSpring(1, SPRING_CONFIG));
    })
    .onFinalize(() => {
      hover.set(withSpring(0, SPRING_CONFIG));
    });

  const gestures = Gesture.Simultaneous(panGesture, hoverGesture);

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.max(touch.get(), hover.get() * 0.5) * 0.03 }],
  }));

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { scaleX: scaleX.get() }],
    width: pillWidth.get(),
    opacity: pillOpacity.get(),
  }));

  const Pane = GLASS ? GlassView : View;
  const scheme = theme.isDark ? ('dark' as const) : ('light' as const);
  const lit = hovered ?? activeSlot;

  return (
    <View style={[styles.host, { bottom: barOffset(insets.bottom), pointerEvents: 'box-none' }]}>
      <GestureDetector gesture={gestures}>
        <Animated.View style={zoomStyle}>
          <Pane
            {...(GLASS ? { glassEffectStyle: 'regular' as const, colorScheme: scheme } : {})}
            style={[
              styles.bar,
              !GLASS && {
                backgroundColor: rgba(theme.surface, Platform.OS === 'android' ? 0.96 : theme.isDark ? 0.82 : 0.78),
                borderColor: theme.isDark ? rgba('#FFFFFF', 0.12) : rgba('#FFFFFF', 0.85),
              },
              GLASS && styles.glass,
            ]}>
            {/* The single sliding pill indicator behind the items */}
            <Animated.View style={[styles.pill, pillAnimatedStyle]}>
              {GLASS ? (
                <GlassView glassEffectStyle="clear" isInteractive colorScheme={scheme} style={styles.pillGlass} />
              ) : (
                <View
                  style={[
                    styles.pillGlass,
                    styles.pillFallback,
                    {
                      backgroundColor: theme.isDark ? rgba('#FFFFFF', 0.14) : rgba('#FFFFFF', 0.85),
                      borderColor: theme.isDark ? rgba('#FFFFFF', 0.22) : rgba('#FFFFFF', 0.95),
                    },
                  ]}
                />
              )}
            </Animated.View>

            {/* Destination tab items */}
            {DESTINATIONS.map((destination, slot) => (
              <TabItem
                key={destination.name}
                destination={destination}
                label={t(destination.label)}
                active={lit === slot}
                slot={slot}
                onLayout={handleItemLayout}
                onPress={() => select(slot)}
              />
            ))}

            {/* Menu item */}
            <TabItem
              destination={{ name: MENU_ROUTE, label: 'Menu', icon: Menu }}
              label={t('Menu')}
              active={lit === SLOTS - 1}
              slot={SLOTS - 1}
              onLayout={handleItemLayout}
              onPress={() => select(SLOTS - 1)}
            />
          </Pane>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

interface TabItemProps {
  destination: Destination;
  label: string;
  active: boolean;
  slot: number;
  onLayout: (slot: number, x: number, width: number) => void;
  onPress: () => void;
}

/**
 * One tab item. Measures its layout on mount and resize, and displays the icon and label.
 */
function TabItem({ destination, label, active, slot, onLayout, onPress }: TabItemProps) {
  const theme = useTheme();
  const color = active ? theme.accent : theme.faint(0.55);
  const Icon = destination.icon;
  const press = useSharedValue(0);
  const hover = useSharedValue(0);

  const magnify = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + press.get() * 0.12 + hover.get() * 0.05 }],
  }));

  return (
    <View
      style={styles.item}
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout;
        onLayout(slot, x, width);
      }}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        onPress={onPress}
        onPressIn={() => press.set(withSpring(1, { damping: 14, stiffness: 320 }))}
        onPressOut={() => press.set(withSpring(0, SPRING_CONFIG))}
        onHoverIn={() => hover.set(withSpring(1, SPRING_CONFIG))}
        onHoverOut={() => hover.set(withSpring(0, SPRING_CONFIG))}
        style={styles.itemPressable}>
        <Animated.View style={[styles.itemInner, magnify]}>
          <Icon size={22} color={color} strokeWidth={active ? 2.4 : 2} />
          <Txt variant="caption" weight={active ? 'semibold' : 'medium'} color={color} numberOfLines={1}>
            {label}
          </Txt>
        </Animated.View>
      </Pressable>
    </View>
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
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(24px) saturate(180%)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      },
    }),
  },
  glass: { borderWidth: 0 },
  pill: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: 0,
    zIndex: 0,
  },
  pillGlass: {
    flex: 1,
    borderRadius: (layout.tabBarHeight - PADDING * 2) / 2,
  },
  pillFallback: {
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
    }),
  },
  item: { flex: 1, zIndex: 1 },
  itemPressable: { flex: 1 },
  itemInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
