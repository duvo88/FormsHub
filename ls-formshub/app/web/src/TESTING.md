# React Tests

This directory contains Jest and React Testing Library tests for the Forms Hub web application.

## Test Structure

Tests are located next to their source files following React best practices:

```
src/
  components/
    FormField.tsx
    FormField.test.tsx          ← Component tests
    SubmissionSuccess.test.tsx
  hooks/
    usePCFee.ts
    usePCFee.test.ts            ← Hook utility tests
  services/
    authService.ts
    authService.test.ts         ← Service tests
  utils/
    validation.test.ts          ← Utility tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (recommended for development)
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run a specific test file
```bash
npm test FormField.test.tsx
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="renders label"
```

## Test Coverage

Current test files:
- ✅ **FormField.test.tsx** - Form input component tests (11 tests)
- ✅ **usePCFee.test.ts** - Practice type mapping utility tests (14 tests)
- ✅ **authService.test.ts** - Authentication service tests (7 tests)
- ✅ **SubmissionSuccess.test.tsx** - Success page component tests (3 tests)
- ⏳ **validation.test.ts** - Placeholder for validation utilities

## Writing New Tests

### Component Test Template
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Hook Test Template
```typescript
import { renderHook } from '@testing-library/react';
import useMyHook from './useMyHook';

test('returns expected value', () => {
  const { result } = renderHook(() => useMyHook());
  expect(result.current.value).toBe(expectedValue);
});
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what users see and interact with
2. **Use accessible queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Test user interactions** - Use `@testing-library/user-event` for realistic interactions
4. **Mock external dependencies** - Mock API calls, localStorage, etc.
5. **Keep tests independent** - Each test should be able to run in isolation
6. **Use descriptive test names** - Test names should describe the expected behavior

## Debugging Tests

### View rendered output
```typescript
const { debug } = render(<MyComponent />);
debug(); // Prints DOM to console
```

### Check what's in the document
```typescript
screen.debug(); // Prints current screen content
```

### Find elements
```typescript
screen.logTestingPlaygroundURL(); // Get Testing Playground link
```

## CI/CD Integration

Tests run automatically in the Azure DevOps pipeline before deployment:

```yaml
- script: npm test -- --coverage --watchAll=false
  displayName: 'Run React Tests'
```

## Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Testing Playground](https://testing-playground.com/)
