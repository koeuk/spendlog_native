import { useState } from 'react';

import { apiErrorMessage, fieldErrors } from '@/api/client';
import { t } from '@/i18n';
import { toast } from '@/store/toast';

export type FormErrors = Record<string, string | undefined>;

/**
 * Just enough form state for a sheet: values, per-field errors, and a submit
 * that maps a `422` onto the fields and anything else onto a toast.
 */
export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof T>(key: K, value: T[K]): void {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key as string] ? { ...current, [key as string]: undefined } : current));
  }

  function reset(next: T = initial): void {
    setValues(next);
    setErrors({});
  }

  /** Returns true when the action completed. Local `validate` runs first. */
  async function submit(action: () => Promise<void>, validate?: () => FormErrors): Promise<boolean> {
    const local = validate?.() ?? {};
    const failed = Object.fromEntries(Object.entries(local).filter(([, message]) => message));
    if (Object.keys(failed).length > 0) {
      setErrors(failed);
      return false;
    }
    setSubmitting(true);
    try {
      await action();
      return true;
    } catch (error) {
      const fields = fieldErrors(error);
      if (Object.keys(fields).length > 0) setErrors(fields);
      else toast(t(apiErrorMessage(error)), 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return { values, set, errors, setErrors, submitting, submit, reset };
}
