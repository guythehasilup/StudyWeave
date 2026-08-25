import type { ChangeEventHandler, HTMLInputAutoCompleteAttribute } from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  type: 'text' | 'password';
  value: string;
  autoComplete: HTMLInputAutoCompleteAttribute;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: string;
  disabled?: boolean;
}
