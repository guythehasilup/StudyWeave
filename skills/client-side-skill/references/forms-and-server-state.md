# Forms and server state

## Contents

1. State ownership
2. React Hook Form
3. MUI field integration
4. TanStack Query
5. Mutations and errors

## 1. State ownership

Assign state deliberately:

- TanStack Query: remote data, loading, errors, caching, and refetching;
- React Hook Form: editable form values, dirty/touched state, and validation;
- URL/router: shareable filters, search, page, selection, and navigation state;
- local component state: temporary visual state such as an open menu;
- context/store: genuinely cross-cutting client state such as active language or authenticated user summary.

Do not duplicate the same source of truth across owners.

## 2. React Hook Form

Declare form values and all defaults. Avoid uncontrolled transitions and scattered field state.

```ts
/**
 * Represent editable login field values.
 *
 * @example
 * const values: LoginFormValues = { username: '', password: '' };
 */
type LoginFormValues = Readonly<{
  username: string;
  password: string;
}>;

const LOGIN_FORM_DEFAULT_VALUES: LoginFormValues = {
  username: '',
  password: '',
};

/**
 * Create and configure the login form state.
 *
 * @returns React Hook Form methods with empty username and password defaults.
 * @example
 * const form = useLoginForm();
 */
export const useLoginForm = (): UseFormReturn<LoginFormValues> =>
  useForm<LoginFormValues>({
    defaultValues: LOGIN_FORM_DEFAULT_VALUES,
    mode: 'onBlur',
  });
```

Prefer schema validation when the project already has a validation library and the rules are shared or complex. Keep backend validation authoritative even when the frontend validates first.

## 3. MUI field integration

Use `Controller` for controlled MUI inputs such as `Autocomplete`, `Select`, pickers, and custom controlled fields. It is also acceptable as the team's consistent `TextField` integration.

```tsx
<Controller
  control={control}
  name="username"
  rules={{ required: 'validation.required' }}
  render={({ field, fieldState }) => (
    <TextField
      {...field}
      autoComplete="username"
      error={fieldState.invalid}
      helperText={
        fieldState.error
          ? translate(fieldState.error.message as ResourceKey)
          : undefined
      }
      label={translate('auth.fields.username.label')}
      fullWidth
    />
  )}
/>
```

Store resource keys, not translated sentences, in validation rules. Disable submit during mutation and prevent accidental repeated submission.

## 4. TanStack Query

Create query-key factories with readonly tuples:

```ts
export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (filters: Readonly<UserFilters>) =>
    [...userQueryKeys.lists(), filters] as const,
  detail: (userId: string) => [...userQueryKeys.all, 'detail', userId] as const,
};

/**
 * Load one user and cache it under its stable public identifier.
 *
 * @param userId - Public user identifier; an empty value disables the query.
 * @returns TanStack Query state for the selected user.
 * @example
 * const userQuery = useUser(userId);
 */
export const useUser = (userId: string) =>
  useQuery({
    queryKey: userQueryKeys.detail(userId),
    queryFn: ({ signal }) => usersApi.getById(userId, signal),
    enabled: userId.length > 0,
  });
```

Pass the query cancellation signal to the HTTP client. Set `staleTime`, retry behavior, and refetch behavior only from actual product requirements. Do not globally disable useful defaults without reason.

## 5. Mutations and errors

Keep API clients responsible for HTTP and DTO parsing. Keep query hooks responsible for cache policy. Keep components responsible for interaction and presentation.

After a mutation, invalidate the narrowest keys that may be stale or update a cache entry when the response is authoritative. Avoid optimistic updates unless the interaction benefit justifies rollback complexity.

Map backend error codes or `resourceKey` values to localized UI text at the presentation boundary. Log diagnostic details to the server; do not display raw network or exception messages.
