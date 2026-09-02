# React and MUI conventions

## Contents

1. Component design
2. MUI-first composition
3. `sx` and theme rules
4. RTL and responsive layout
5. Accessibility
6. Component example

## 1. Component design

Use function components. Keep a component responsible for one recognizable UI responsibility. Split a component when a child has independent behavior, repeated use, significant rendering branches, or a useful test boundary. Do not split every wrapper into its own file.

Prefer composition over boolean-heavy components. Keep feature-specific components near the feature. Move a component to `shared/ui` only after real cross-feature reuse appears.

Avoid storing derived values:

```ts
const visibleUsers = users.filter((user) => user.isApproved);
```

Do not calculate the same value in an effect and place it in state.

## 2. MUI-first composition

Choose components by semantics:

- `Typography` for text hierarchy;
- `Button` and `IconButton` for actions;
- `Link` for navigation;
- `Stack` for one-dimensional flow;
- `Grid` for responsive grid layout supported by the installed MUI version;
- `Box` for a generic theme-aware wrapper;
- `Card`, `Dialog`, `Drawer`, `Table`, and `List` for their intended interaction patterns.

Preserve MUI focus, disabled, keyboard, and ARIA behavior. Do not rebuild a button from a clickable `Box`.

## 3. `sx` and theme rules

Use shorthand spacing and theme-aware callbacks:

```ts
const cardSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  p: 3,
  borderRadius: 2,
  bgcolor: 'background.paper',
  color: 'text.primary',
};
```

Use `sx` inline when styles are short and local. Extract a typed `SxProps<Theme>` constant when the object is long, repeated in the component, or obscures JSX. Use `styled` when creating a reusable styled primitive or when prop-based selectors are clearer there.

Avoid raw hex colors, pixel spacing that duplicates the theme scale, and selectors coupled to MUI's generated class names. Use documented slot classes or `slotProps` when customization needs a component slot.

## 4. RTL and responsive layout

Set document direction and configure the MUI/Emotion RTL cache at application bootstrap. Do not mirror the page with per-component transforms.

Use logical properties:

```ts
const actionsSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 1,
  marginInlineStart: 'auto',
};
```

Start with the smallest viewport. Add breakpoint overrides only where content needs them. Test Hebrew text expansion, mixed numbers, icons with directional meaning, dialogs, menus, and date inputs.

## 5. Accessibility

- Give every field a programmatic label and connect helper/error text.
- Give icon-only buttons a localized `aria-label`.
- Preserve visible focus and logical tab order.
- Use a dialog title and description, restore focus on close, and avoid nested dialogs.
- Use semantic headings in order even when visual size differs.
- Do not rely on color alone to communicate state.

## 6. Component example

```tsx
/**
 * Configure the data and actions rendered by `UserCard`.
 *
 * @property isApproving - Disable approval while the mutation runs. Defaults to `false` in the component.
 * @example
 * const props: UserCardProps = { user, onApprove };
 */
export type UserCardProps = Readonly<{
  user: UserDto;
  onApprove: (userId: string) => void;
  isApproving?: boolean;
}>;

/**
 * Display a user and expose the approval action.
 *
 * @param props - User data, approval callback, and pending state.
 * @param props.isApproving - Disable the action while approval runs. Defaults to `false`.
 * @returns A localized MUI card.
 * @example
 * <UserCard user={user} onApprove={approveUser} />
 */
export const UserCard = ({
  user,
  onApprove,
  isApproving = false,
}: UserCardProps): ReactElement => {
  const { translate } = useTranslate();

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h6">
          {user.username}
        </Typography>
        <Button
          disabled={user.isApproved || isApproving}
          onClick={() => onApprove(user.id)}
          variant="contained"
        >
          {translate('users.actions.approve')}
        </Button>
      </Stack>
    </Card>
  );
};
```
