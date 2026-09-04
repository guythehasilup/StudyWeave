import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import type { ReactElement } from 'react';

/**
 * Configure the shared MUI text field.
 *
 * This remains a type alias because MUI exposes `TextFieldProps` as a
 * conditional type, which TypeScript interfaces cannot extend.
 */
export type SwTextFieldProps = TextFieldProps;

/**
 * Render the application text field with shared defaults.
 *
 * @param props - Standard MUI text-field props.
 * @param props.fullWidth - Fill the available width. Defaults to `true`.
 * @returns A consistently configured MUI text field.
 * @example
 * <SwTextField label="Username" autoComplete="username" />
 */
export const SwTextField = ({ fullWidth = true, ...props }: SwTextFieldProps): ReactElement => (
  <TextField {...props} fullWidth={fullWidth} />
);
