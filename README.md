# use-why-rerender

A lightweight drop-in React hook for finding out which props cause a component to re-render. Supports nested data structures and object reference changes.

![npm](https://img.shields.io/npm/v/use-why-rerender)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/use-why-rerender)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![React](https://img.shields.io/badge/React-18%2B-blue)
![License](https://img.shields.io/npm/l/use-why-rerender)

## Installation

```bash
npm install use-why-rerender
```

## Usage

```typescript
import useWhyRerender from 'use-why-rerender';

function MyComponent({ user, items, onUpdate }) {
  const [count, setCount] = useState(0);
  useWhyRerender({ user, items, onUpdate, count }, { caller: 'MyComponent' });
  
  return (
    // your component
  );
}
```

This will produce console output like:
```
🔁 Render #1 - MyComponent
  user:
    prev: { id: 1, name: "John" }
    next: { id: 1, name: "Jane" }
  items: Object reference changed but shallowly equal

🔁 Render #2 - MyComponent
  count:
    prev: 0
    next: 1
```

### Configuration Options

```typescript
useWhyRerender(props, {
  deep: true,                   // enable deep equality comparison
  enabled: true,                // enable/disable logging
  debounceMs: 100,              // debounce logs
  caller: 'MyComponent'         // name of caller for logging
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `deep` | boolean | `false` | Enable deep equality comparison |
| `enabled` | boolean | `true` | Enable/disable logging |
| `debounceMs` | number | `0` | Logging delay in milliseconds |
| `caller` | string | - | Calling component identifier |

## License

MIT