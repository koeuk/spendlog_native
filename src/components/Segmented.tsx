import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { rgba } from '@/utils/color';

import { Txt } from './Txt';

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

const PADDING = 4;
const SPRING = { damping: 18, stiffness: 180, mass: 0.8 };
/** Snappier on the way in, so a tap's pop lands before the finger lifts. */
const PRESS_SPRING = { damping: 14, stiffness: 320, mass: 0.6 };
const GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/**
 * The tab bar in miniature: a frosted track with a glass lens under the chosen
 * option. Tap an option, or grab the lens and drag it; it swells on the way,
 * magnifies what it passes, and settles on the option it is let go on. Like
 * the tab bar, the track swells under a finger or a pointer and the option
 * pressed pops.
 */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const slotWidth = width > 0 ? (width - PADDING * 2) / options.length : 0;
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  /** The option under the finger while dragging, lit before it is chosen. */
  const [hovered, setHovered] = useState<number | null>(null);

  const x = useSharedValue(0);
  const lift = useSharedValue(0);
  const origin = useSharedValue(0);
  const dragging = useSharedValue(false);
  /** A finger on the track (0–1), and a pointer over it on the web or an iPad. */
  const touch = useSharedValue(0);
  const hover = useSharedValue(0);
  useEffect(() => {
    x.set(withSpring(index * slotWidth, SPRING));
  }, [index, slotWidth, x]);

  const select = (slot: number) => {
    setHovered(null);
    const option = options[slot];
    if (!option) return;
    if (option.value !== value) onChange(option.value);
    x.set(withSpring(slot * slotWidth, SPRING));
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

  const max = slotWidth * (options.length - 1);
  const drag = Gesture.Pan()
    .enabled(slotWidth > 0)
    .activeOffsetX([-6, 6])
    // A vertical swipe belongs to whatever scrolls around the control.
    .failOffsetY([-10, 10])
    // Touch-down, before a drag is recognised: a tap swells the track too.
    .onBegin(() => {
      touch.set(withSpring(1, SPRING));
    })
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
      touch.set(withSpring(0, SPRING));
      // A tap never starts the pan; its Pressable handles it.
      if (!dragging.get()) return;
      dragging.set(false);
      lift.set(withSpring(0, SPRING));
      dropped.set(Math.round(x.get() / slotWidth));
    });

  const pointer = Gesture.Hover()
    .onBegin(() => {
      hover.set(withSpring(1, SPRING));
    })
    .onFinalize(() => {
      hover.set(withSpring(0, SPRING));
    });
  const gestures = Gesture.Simultaneous(drag, pointer);

  // A wider control than the tab bar, so a smaller swell reads the same.
  const zoom = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.max(touch.get(), hover.get() * 0.5) * 0.03 }],
  }));
  const lens = useAnimatedStyle(() => {
    const swell = Math.max(lift.get(), touch.get() * 0.4);
    return { transform: [{ translateX: x.get() }, { scaleX: 1 + swell * 0.1 }, { scaleY: 1 + swell * 0.2 }] };
  });

  const Track = GLASS ? GlassView : View;
  const scheme = theme.isDark ? ('dark' as const) : ('light' as const);
  const lit = hovered ?? index;

  return (
    <GestureDetector gesture={gestures}>
      <Animated.View style={zoom}>
        <Track
          {...(GLASS ? { glassEffectStyle: 'regular' as const, colorScheme: scheme } : {})}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={[
            styles.track,
            !GLASS && { backgroundColor: theme.faint(theme.isDark ? 0.08 : 0.05), borderColor: theme.faint(0.06) },
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
                      backgroundColor: theme.isDark ? rgba('#FFFFFF', 0.14) : rgba('#FFFFFF', 0.95),
                      borderColor: theme.isDark ? rgba('#FFFFFF', 0.22) : rgba('#FFFFFF', 1),
                    },
                  ]}
                />
              )}
            </Animated.View>
          )}
          {options.map((option, slot) => (
            <Option
              key={option.value}
              label={option.label}
              active={lit === slot}
              slot={slot}
              slotWidth={slotWidth}
              x={x}
              lift={lift}
              onPress={() => select(slot)}
            />
          ))}
        </Track>
      </Animated.View>
    </GestureDetector>
  );
}

interface OptionProps {
  label: string;
  active: boolean;
  slot: number;
  slotWidth: number;
  x: SharedValue<number>;
  lift: SharedValue<number>;
  onPress: () => void;
}

/** One option: it pops while pressed, grows under a pointer, and swells under the dragged lens. */
function Option({ label, active, slot, slotWidth, x, lift, onPress }: OptionProps) {
  const theme = useTheme();
  const press = useSharedValue(0);
  const hover = useSharedValue(0);
  const magnify = useAnimatedStyle(() => {
    const near = slotWidth === 0 ? 0 : interpolate(Math.abs(x.get() - slot * slotWidth), [0, slotWidth], [1, 0], 'clamp');
    return { transform: [{ scale: 1 + near * lift.get() * 0.12 + press.get() * 0.16 + hover.get() * 0.06 }] };
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onPressIn={() => press.set(withSpring(1, PRESS_SPRING))}
      onPressOut={() => press.set(withSpring(0, SPRING))}
      onHoverIn={() => hover.set(withSpring(1, SPRING))}
      onHoverOut={() => hover.set(withSpring(0, SPRING))}
      style={styles.option}>
      <Animated.View style={magnify}>
        <Txt variant="label" weight="semibold" color={active ? theme.accent : theme.faint(0.55)} numberOfLines={1}>
          {label}
        </Txt>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.chip, padding: PADDING, borderWidth: StyleSheet.hairlineWidth },
  glass: { borderWidth: 0 },
  lens: { position: 'absolute', top: PADDING, bottom: PADDING, left: PADDING },
  lensFill: { flex: 1, borderRadius: radius.chip },
  lensRim: {
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)' },
      default: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    }),
  },
  option: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 8 },
});
