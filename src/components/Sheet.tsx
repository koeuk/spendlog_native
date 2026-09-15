import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Txt } from './Txt';

export type SheetRef = RefObject<BottomSheetModal | null>;

/** A handle for presenting and dismissing one sheet. */
export function useSheet() {
  const ref = useRef<BottomSheetModal>(null);
  return {
    ref,
    present: () => ref.current?.present(),
    dismiss: () => ref.current?.dismiss(),
  };
}

interface SheetProps {
  sheetRef: SheetRef;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
}

function Backdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.32} pressBehavior="close" />;
}

/**
 * The app's modal bottom sheet: rounded at the top, sized to its content,
 * scrolling once it would pass most of the screen, lifted by the keyboard.
 */
export function Sheet({ sheetRef, title, children, onDismiss }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onDismiss}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.9}
      enablePanDownToClose
      backdropComponent={Backdrop}
      backgroundStyle={{ backgroundColor: theme.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet }}
      handleIndicatorStyle={{ backgroundColor: theme.faint(0.18), width: 36 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: layout.pageInset, paddingTop: 4, paddingBottom: insets.bottom + 20, gap: 14 }}>
        {title ? (
          <Txt variant="title" style={{ marginBottom: 2 }}>
            {title}
          </Txt>
        ) : null}
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
