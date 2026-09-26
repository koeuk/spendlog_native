import { useRouter } from 'expo-router';
import { ChartNoAxesColumn, PiggyBank, ReceiptText, Wallet, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop, Glass } from '@/components/Glass';
import { PillButton } from '@/components/PillButton';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { LOCALES, useLocaleStore } from '@/store/locale';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  { icon: ReceiptText, title: 'Log every expense', body: 'Jot down what you spend in seconds, in dollars or riel.' },
  { icon: PiggyBank, title: 'Budgets that keep you on track', body: 'Set a limit for each category and see what is left at a glance.' },
  { icon: ChartNoAxesColumn, title: 'See where your money goes', body: 'Weekly, monthly and yearly reports, ready to export.' },
  { icon: Wallet, title: 'All your money in one place', body: 'Savings, income and borrowing sit beside your spending.' },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Slide>);

/**
 * Four slides that open the app for anyone not signed in: what SpendLog
 * does, before being asked for an account. Skip, or the last slide's button,
 * goes on to sign in; the page is replaced so Back does not return to it.
 */
export default function WelcomeScreen() {
  const t = useT();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const list = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const x = useSharedValue(0);
  const last = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((event) => {
    x.set(event.contentOffset.x);
  });
  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  const next = () => {
    if (last) return router.replace('/login');
    list.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(index + 1);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <Backdrop />
      <View style={styles.top}>
        <View style={styles.language}>
          <Segmented options={LOCALES.map((option) => ({ value: option.code, label: option.label }))} value={locale} onChange={setLocale} />
        </View>
        {last ? null : (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.replace('/login')}>
            <Txt weight="semibold" color={theme.faint(0.6)}>
              {t('Skip')}
            </Txt>
          </Pressable>
        )}
      </View>

      <AnimatedFlatList
        ref={list}
        data={SLIDES}
        keyExtractor={(slide) => slide.title}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={settle}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => <SlideView slide={item} index={i} width={width} x={x} />}
        style={styles.pager}
      />

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <Dot key={slide.title} index={i} width={width} x={x} />
        ))}
      </View>

      <View style={styles.actions}>
        <PillButton label={last ? t('Get started') : t('Next')} onPress={next} block />
        {last ? <PillButton label={t('Create account')} variant="ghost" onPress={() => router.replace('/register')} block /> : null}
      </View>
    </View>
  );
}

/** One slide: a glass disc carrying the icon, then the headline and a line under it. */
function SlideView({ slide, index, width, x }: { slide: Slide; index: number; width: number; x: SharedValue<number> }) {
  const t = useT();
  const theme = useTheme();
  const Icon = slide.icon;
  // The disc drifts and shrinks as its slide leaves, so the swipe has depth.
  const disc = useAnimatedStyle(() => {
    const offset = x.get() / width - index;
    return {
      opacity: interpolate(Math.abs(offset), [0, 1], [1, 0.3], 'clamp'),
      transform: [{ translateX: offset * -60 }, { scale: interpolate(Math.abs(offset), [0, 1], [1, 0.8], 'clamp') }],
    };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={disc}>
        <Glass style={styles.disc}>
          <Icon size={72} color={theme.accent} strokeWidth={1.6} />
        </Glass>
      </Animated.View>
      <View style={styles.copy}>
        <Txt variant="xl" weight="bold" align="center">
          {t(slide.title)}
        </Txt>
        <Txt faint={0.6} align="center">
          {t(slide.body)}
        </Txt>
      </View>
    </View>
  );
}

/** A page dot that stretches into a pill while its slide is showing. */
function Dot({ index, width, x }: { index: number; width: number; x: SharedValue<number> }) {
  const theme = useTheme();
  const style = useAnimatedStyle(() => {
    const near = interpolate(Math.abs(x.get() / width - index), [0, 1], [1, 0], 'clamp');
    return { width: 8 + near * 16, opacity: 0.35 + near * 0.65 };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: theme.accent }, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.pageInset, minHeight: 44 },
  language: { width: 164 },
  pager: { flexGrow: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 36 },
  disc: { width: 168, height: 168, borderRadius: 84, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: 10, maxWidth: 340 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },
  actions: { paddingHorizontal: layout.pageInset, gap: 6 },
});
