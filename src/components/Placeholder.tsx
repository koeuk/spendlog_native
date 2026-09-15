import { Construction } from 'lucide-react-native';

import { useT } from '@/i18n';

import { Header } from './Header';
import { Screen } from './Screen';
import { EmptyState } from './States';

/** A screen that is on the plan but not built yet. */
export function Placeholder({ title, back = true }: { title: string; back?: boolean }) {
  const t = useT();
  return (
    <Screen header={<Header title={t(title)} back={back} />}>
      <EmptyState icon={Construction} title={t(title)} subtitle={t('Coming soon.')} />
    </Screen>
  );
}
