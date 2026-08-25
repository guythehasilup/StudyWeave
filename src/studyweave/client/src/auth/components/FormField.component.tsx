import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { useState } from 'react';
import { he } from '../../common/resources/he.resource';
import type { FormFieldProps } from '../types/form-field.type';

export const FormField = ({
  id,
  label,
  type,
  value,
  autoComplete,
  onChange,
  error,
  disabled = false,
}: FormFieldProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && isPasswordVisible ? 'text' : type;
  const visibilityLabel = isPasswordVisible ? he.form.hidePassword : he.form.showPassword;

  return (
    <TextField
      id={id}
      name={id}
      label={label}
      type={inputType}
      value={value}
      autoComplete={autoComplete}
      onChange={onChange}
      error={Boolean(error)}
      helperText={error}
      disabled={disabled}
      required
      fullWidth
      slotProps={{
        input: isPasswordField
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={visibilityLabel}
                    aria-pressed={isPasswordVisible}
                    edge="end"
                    disabled={disabled}
                    onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {isPasswordVisible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : undefined,
      }}
    />
  );
};
