import { StyleSheet, View } from "react-native";

import { PillButton } from "./PillButton";

interface FormActionsProps {
  saveLabel: string;
  onSave: () => void;
  saving?: boolean;
  /** Omit both to leave the row with nothing but Save. */
  deleteLabel?: string;
  onDelete?: () => void;
  deleting?: boolean;
}

/**
 * The action bar a form page pins to its footer: the destructive choice on the
 * left, the one you came for on the right, weighted wider so the eye lands on
 * it first. Either button disables while the other is working, so a row cannot
 * be saved and deleted at once.
 */
export function FormActions({
  saveLabel,
  onSave,
  saving = false,
  deleteLabel,
  onDelete,
  deleting = false,
}: FormActionsProps) {
  const canDelete = !!onDelete && !!deleteLabel;
  return (
    <View style={styles.row}>
      {canDelete && (
        <PillButton
          label={deleteLabel}
          onPress={onDelete}
          loading={deleting}
          disabled={saving}
          variant="danger"
          block
          style={styles.delete}
        />
      )}
      <PillButton
        label={saveLabel}
        onPress={onSave}
        loading={saving}
        disabled={deleting}
        block
        style={canDelete ? styles.save : styles.saveAlone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, marginBottom: -28 },
  delete: { flex: 1 },
  save: { flex: 1.6 },
  saveAlone: { flex: 1 },
});
