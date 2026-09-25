import { useLocalSearchParams } from "expo-router";

import { FormScreen, useLeaveForm } from "@/components/FormScreen";
import { ExpenseForm } from "@/forms/ExpenseForm";
import { useExpense } from "@/hooks/expenses";
import { useT } from "@/i18n";

/** `/expense-form` adds an expense; `/expense-form?uuid=…` edits one. */
export default function ExpenseFormScreen() {
  const t = useT();
  const leave = useLeaveForm();
  const { uuid = "" } = useLocalSearchParams<{ uuid?: string }>();
  const query = useExpense(uuid);
  const title = uuid ? t("Edit expense") : t("Add expense");

  // The form reads the row once, when it mounts, so it waits here for the row
  // to arrive rather than starting on an empty one and filling in underneath.
  if (uuid && query.isPending) return <FormScreen title={title} loading />;
  if (uuid && query.error)
    return (
      <FormScreen
        title={title}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );

  return (
    <ExpenseForm
      key={uuid || "new"}
      title={title}
      expense={query.data ?? null}
      onDone={leave}
    />
  );
}
