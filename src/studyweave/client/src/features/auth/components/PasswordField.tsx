import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { IconButton, InputAdornment } from '@mui/material';
import { useState } from 'react';
import type { HTMLInputAutoCompleteAttribute, ReactElement, Ref } from 'react';
import { useTranslate } from '../../../shared/localization/useTranslate';
import { SwTextField } from '../../../shared/ui/SwTextField';

/**
 * Configure a password field controlled by React Hook Form.
 *
 * @property name - Form field name forwarded to the input.
 * @property value - Current password value owned by React Hook Form.
 * @property onChange - Report a new password value to React Hook Form.
 * @property onBlur - Mark the password field as touched.
 * @property inputRef - Connect the input element for focus management.
 * @property errorMessage - Localized validation text. Defaults to absent.
 * @property isDisabled - Disable editing and visibility changes. Defaults to `false`.
 * @example
 * const props: PasswordFieldProps = {
 *   label: 'Password',
 *   autoComplete: 'current-password',
 *   name: 'password',
 *   value: '',
 *   onChange: setPassword,
 *   onBlur: markPasswordTouched,
 *   inputRef,
 * };
 */
export interface PasswordFieldProps {
  readonly label: string;
  readonly autoComplete: HTMLInputAutoCompleteAttribute;
  readonly name: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
  readonly inputRef: Ref<HTMLInputElement>;
  readonly errorMessage?: string;
  readonly isDisabled?: boolean;
}

/**
 * Render an accessible password input with a localized visibility control.
 *
 * @param props - Label, autocomplete mode, controlled form field, and visual state.
 * @returns A full-width MUI password field.
 * @example
 * <PasswordField
 *   label={label}
 *   autoComplete="current-password"
 *   name={field.name}
 *   value={field.value}
 *   onChange={field.onChange}
 *   onBlur={field.onBlur}
 *   inputRef={field.ref}
 * />
 */
export const PasswordField = ({
  label,
  autoComplete,
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  errorMessage,
  isDisabled = false,
}: PasswordFieldProps): ReactElement => {
  const { translate } = useTranslate();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const visibilityLabel = translate(
    isPasswordVisible ? 'form.actions.hidePassword' : 'form.actions.showPassword',
  );

  return (
    <SwTextField
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      inputRef={inputRef}
      label={label}
      type={isPasswordVisible ? 'text' : 'password'}
      autoComplete={autoComplete}
      error={errorMessage !== undefined}
      helperText={errorMessage}
      disabled={isDisabled}
      required
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visibilityLabel}
                aria-pressed={isPasswordVisible}
                edge="end"
                disabled={isDisabled}
                onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                onMouseDown={(event) => event.preventDefault()}
              >
                {isPasswordVisible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
