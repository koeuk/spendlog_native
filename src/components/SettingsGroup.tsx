import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from './Card';
import { Txt } from './Txt';

/**
 * One block of a settings page: a quiet label over a card of rows. The label
 * sits outside the card, the way the platform's own settings group things.
 */
export function SettingsGroup({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.group}>
      <Txt variant="label" faint={0.5} style={styles.title}>
        {title}
      </Txt>
      <Card padded={false} style={styles.card}>
        {children}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  title: { marginLeft: 16 },
  card: { paddingHorizontal: 16 },
});
