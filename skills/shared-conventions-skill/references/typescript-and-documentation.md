# TypeScript and documentation conventions

## Contents

1. Declaration and immutability rules
2. Types and boundary validation
3. Function-first design
4. Documentation template
5. Exception examples

## 1. Declaration and immutability rules

Use `const` when the binding itself does not change. This does not make an object immutable, so prefer readonly types and immutable updates as well.

```ts
const nextUser: User = { ...user, isApproved: true };
```

Use `let` only for necessary reassignment, such as advancing a cursor in a bounded algorithm. If `map`, `reduce`, an early return, or a small pure function is clearer, use it instead. Never distort straightforward code merely to eliminate all `let` declarations.

Use `Object.freeze` only when runtime protection is required; readonly types provide compile-time protection and are usually sufficient.

## 2. Types and boundary validation

- Use `unknown` for parsed JSON, caught errors, message bodies, and other untrusted values.
- Validate before converting `unknown` to a domain type.
- Use `Readonly<T>` and readonly arrays at public boundaries where mutation is not part of the contract.
- Use a type alias for unions, mapped types, function signatures, and DTO compositions.
- Use an interface when declaration merging or an intentionally extensible object contract is useful. Do not enforce one keyword everywhere.
- Avoid TypeScript numeric enums in shared contracts. Prefer string unions or `as const` maps with stable serialized values.

```ts
export const REQUEST_STATES = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;

export type RequestState =
  (typeof REQUEST_STATES)[keyof typeof REQUEST_STATES];
```

## 3. Function-first design

Prefer dependency-injected function factories:

```ts
export type FindUserById = (userId: string) => Promise<User | null>;

/**
 * Create an operation that loads an existing user or returns a stable error.
 *
 * @param findUserById - Repository function used to load the user.
 * @returns A function that resolves to the user result.
 * @example
 * const getUser = createGetUser(userRepository.findById);
 */
export const createGetUser = (findUserById: FindUserById) =>
  async (userId: string): Promise<Result<User, 'USER_NOT_FOUND'>> => {
    const user = await findUserById(userId);
    return user === null
      ? { ok: false, error: 'USER_NOT_FOUND' }
      : { ok: true, value: user };
  };
```

This makes dependencies visible and tests simple. Introduce a class only when instance identity or lifecycle state is meaningful.

## 4. Documentation template

Use this shape and omit only tags that truly do not apply:

```ts
/**
 * Calculate the final price after applying a percentage discount.
 *
 * @param price - Original non-negative price.
 * @param discountPercent - Discount from `0` to `100`. Defaults to `0`.
 * @returns The discounted price in the same currency unit.
 * @throws {RangeError} When either input is outside its accepted range.
 * @example
 * const finalPrice = calculatePrice(100, 20); // 80
 */
export const calculatePrice = (
  price: number,
  discountPercent = 0,
): number => {
  if (price < 0 || discountPercent < 0 || discountPercent > 100) {
    throw new RangeError('INVALID_PRICE_OR_DISCOUNT');
  }

  return price * (1 - discountPercent / 100);
};
```

Use stable machine-readable codes for thrown errors. If an error can reach a user or API client, return a stable error/resource key and translate it at the presentation boundary. Put the diagnostic sentence in structured server logs.

Apply the same rule to named local handlers and callbacks. Keep their blocks concise, but include the purpose, parameters, return behavior, defaults when applicable, and an example. An anonymous callback used directly by `map`, `filter`, `reduce`, a promise handler, or JSX prop does not need a separate documentation block when its behavior is obvious.

For complex types, document the type and non-obvious properties:

```ts
/**
 * Describe the immutable context carried across an HTTP request and messages it produces.
 *
 * @property correlationId - Groups work from the same external operation.
 * @property causationId - Identifies the message that caused this operation. Defaults to absent for an initial HTTP request.
 * @example
 * const context: OperationContext = { correlationId: crypto.randomUUID() };
 */
export type OperationContext = Readonly<{
  correlationId: string;
  causationId?: string;
}>;
```

## 5. Exception examples

Accept a class for a lifecycle-owning connection manager, a framework-required error boundary, or a value object whose constructor enforces a meaningful invariant. Add a comment explaining that justification.

Reject classes used only to group static helpers, wrap one repository function, or imitate Java/C# layering without state or polymorphism.
