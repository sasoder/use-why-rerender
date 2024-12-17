import { useRef, useEffect, useCallback } from 'react';

/**
 * Configuration options for useWhyRerender hook
 */
interface UseWhyRerenderOptions {
  /**
   * Enable deep equality checking for object comparisons
   * When true, performs recursive comparison of object properties
   * @default false
   */
  deep?: boolean;

  /**
   * Enables logging
   * When false, logs are not shown in console
   * @default true
   */
  enabled?: boolean;

  /**
   * Delay in milliseconds before logging changes
   * Useful for reducing lag for components that re-render frequently
   * @default 0
   */
  debounceMs?: number;

  /**
   * Custom identifier for the component or hook using useWhyRerender
   * Helps identify the source of renders in logs
   * @example "MyComponent" | "useMyHook"
   */
  caller?: string;
}

type Props = Record<string | symbol, unknown>;
type Changes = Record<string, Diff>;

type DiffMeta = {
  prev: unknown;
  next: unknown;
  type: 'value' | 'error' | 'object';
  recreated: boolean;
  equal: boolean;
  error?: string;
}

type Diff = {
  meta: DiffMeta;
  keys?: string[];
}

// load react-fast-compare only when deep comparison is needed
let fastDeepEqual: ((a: unknown, b: unknown) => boolean) | undefined;

// diff detection
function getObjectDiff(
  prev: unknown,
  next: unknown,
  deep: boolean,
): Diff | null {
  // reference equality determines recreation
  const recreated = prev !== next;
  
  // handle null/undefined cases
  if (prev === null || prev === undefined || next === null || next === undefined) {
    if (!recreated) return null;
    return {
      meta: {
        prev,
        next,
        type: 'value',
        recreated,
        equal: prev === next
      }
    };
  }

  const isObjectComparison = 
    typeof prev === 'object' && prev !== null &&
    typeof next === 'object' && next !== null;

  if (isObjectComparison) {
    if (!deep) {
      // early return if lengths don't match
      const shallowEqual = Object.keys(prev).every(key => 
        (prev as any)[key] === (next as any)[key]
      );
      
      return {
        meta: {
          prev,
          next,
          type: 'object',
          recreated,
          equal: shallowEqual
        }
      };
    } else {
      // deep equality check
      try {
        let isEqual: boolean;
        if (!fastDeepEqual) {
          throw new Error('Fast deep equal function not loaded');
        }
        isEqual = fastDeepEqual(prev, next);
        
        return {
          meta: {
            prev,
            next,
            type: 'object',
            recreated,
            equal: isEqual
          }
        };
      } catch (error) {
        return {
          meta: {
            prev,
            next,
            type: 'error',
            recreated,
            equal: false,
            error: error instanceof Error ? error.message : 'Deep comparison failed'
          }
        };
      }
    }
  }

  // for non-objects
  return {
    meta: {
      prev,
      next,
      type: 'value',
      recreated,
      equal: prev == next
    }
  };
}

function useWhyRerender(
  props: Props,
  options: UseWhyRerenderOptions = {}
) {
  const {
    deep = false,
    enabled = true,
    debounceMs = 0,
    caller,
  } = options;

  const prevProps = useRef(props);
  const renderCount = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  
  // cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // logging function
  const logChanges = useCallback((changes: Changes, deep: boolean) => {
    if (!enabled) return;

    if (Object.keys(changes).length > 0) {
      console.group(`🔄 Render #${renderCount.current} ${caller ? `from ${caller}` : ''}`);
      Object.entries(changes).forEach(([key, change]) => {
        if (change.meta.recreated && change.meta.equal) {
          console.warn(`${key}: Object reference changed but ${deep ? 'deeply' : 'shallowly'} equal`);
        } else if ((change.meta.type === 'value' || change.meta.type === 'object') && !change.meta.recreated) {
          console.group(`${key}:`);
          console.log("prev:", change.meta.prev);
          console.log("next:", change.meta.next);
          console.groupEnd();
        } else if (change.meta.type === 'error') {
          console.warn(`${key}:`, change.meta.error);
        } else {
          console.group(`${key}:`);
          console.log("prev:", change.meta.prev);
          console.log("next:", change.meta.next);
          console.groupEnd();
        }
      });
      console.groupEnd();
    } else {
      console.log(`❓ Render #${renderCount.current} ${caller ? `from ${caller} ` : ''}- No tracked props changed`);
    }
  }, [enabled, caller]);

  // lazy load react-fast-compare
  useEffect(() => {
    if (deep && !fastDeepEqual) {
      import('react-fast-compare')
        .then(module => {
          fastDeepEqual = module.default;
        })
        .catch(error => {
          console.error('Failed to load deep comparison function:', error);
        });
    }
  }, [deep]);

  useEffect(() => {
    if (!enabled) return;

    try {
      renderCount.current++;

      const changes: Changes = {};
      Object.entries(props).forEach(([key, value]) => {
        const prev = prevProps.current[key];
        if (prev !== value) {
          const diff = getObjectDiff(prev, value, deep);
          if (diff) {
            changes[key] = diff;
          }
        }
      });
      
      if (debounceMs > 0) {
        cleanup();
        
        timeoutRef.current = window.setTimeout(() => {
          logChanges(changes, deep);
        }, debounceMs);
      } else {
        logChanges(changes, deep);
      }
      
      prevProps.current = props;
    } catch (error) {
      console.error('useWhyRerender encountered an error:', error);
    }

    return cleanup;
  }, [props, enabled, deep, debounceMs, logChanges, cleanup]);
}

export type { UseWhyRerenderOptions };
export { useWhyRerender };
