import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
      expect(result.current[0]).toBe('default');
    });

    it('should return stored value when localStorage has data', () => {
      localStorage.setItem('test-key', JSON.stringify('stored'));
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
      expect(result.current[0]).toBe('stored');
    });

    it('should handle objects', () => {
      const obj = { name: 'test', value: 42 };
      localStorage.setItem('test-key', JSON.stringify(obj));
      const { result } = renderHook(() => useLocalStorage('test-key', {}));
      expect(result.current[0]).toEqual(obj);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3];
      localStorage.setItem('test-key', JSON.stringify(arr));
      const { result } = renderHook(() => useLocalStorage('test-key', []));
      expect(result.current[0]).toEqual(arr);
    });

    it('should handle null', () => {
      const { result } = renderHook(() => useLocalStorage<string | null>('test-key', null));
      expect(result.current[0]).toBe(null);
    });

    it('should return initial value on parse error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('test-key', 'invalid json {');

      const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
      expect(result.current[0]).toBe('default');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('setValue', () => {
    it('should update state and localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
    });

    it('should handle function updater', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 5));

      act(() => {
        result.current[1](prev => prev + 10);
      });

      expect(result.current[0]).toBe(15);
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(15));
    });

    it('should handle object updates', () => {
      const initial = { count: 0, name: 'test' };
      const { result } = renderHook(() => useLocalStorage('test-key', initial));

      act(() => {
        result.current[1]({ count: 1, name: 'updated' });
      });

      expect(result.current[0]).toEqual({ count: 1, name: 'updated' });
    });

    it('should handle array updates', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', [1, 2, 3]));

      act(() => {
        result.current[1](prev => [...prev, 4]);
      });

      expect(result.current[0]).toEqual([1, 2, 3, 4]);
    });

    it('should handle errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      // State should not update on error
      expect(consoleErrorSpy).toHaveBeenCalled();

      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearValue', () => {
    it('should clear localStorage and reset to initial value', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');

      act(() => {
        result.current[2](); // clearValue
      });

      expect(result.current[0]).toBe('initial');
      expect(localStorage.getItem('test-key')).toBe(null);
    });

    it('should handle errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Cannot remove');
      });

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[2]();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();

      localStorage.removeItem = originalRemoveItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cross-tab synchronization', () => {
    it('should update state on storage event', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      expect(result.current[0]).toBe('initial');

      // Simulate storage event from another tab
      act(() => {
        const event = new StorageEvent('storage', {
          key: 'test-key',
          newValue: JSON.stringify('from-another-tab'),
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('from-another-tab');
    });

    it('should ignore events for different keys', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'other-key',
          newValue: JSON.stringify('other-value'),
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('initial');
    });

    it('should ignore events with null newValue', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'test-key',
          newValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('updated');
    });

    it('should handle parse errors in storage events', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'test-key',
          newValue: 'invalid json {',
        });
        window.dispatchEvent(event);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.current[0]).toBe('initial'); // Should not update on parse error

      consoleErrorSpy.mockRestore();
    });

    it('should cleanup event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useLocalStorage('test-key', 'initial'));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });

  describe('type safety', () => {
    it('should maintain type for primitives', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 42));

      act(() => {
        result.current[1](100);
      });

      expect(typeof result.current[0]).toBe('number');
      expect(result.current[0]).toBe(100);
    });

    it('should maintain type for complex objects', () => {
      interface TestType {
        id: string;
        count: number;
      }

      const initial: TestType = { id: 'test', count: 0 };
      const { result } = renderHook(() => useLocalStorage<TestType>('test-key', initial));

      act(() => {
        result.current[1]({ id: 'updated', count: 5 });
      });

      expect(result.current[0].id).toBe('updated');
      expect(result.current[0].count).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string key', () => {
      const { result } = renderHook(() => useLocalStorage('', 'value'));
      expect(result.current[0]).toBe('value');
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      const { result } = renderHook(() => useLocalStorage(longKey, 'value'));

      act(() => {
        result.current[1]('updated');
      });

      expect(localStorage.getItem(longKey)).toBe(JSON.stringify('updated'));
    });

    it('should handle very large values', () => {
      const largeArray = Array(1000).fill({ data: 'test' });
      const { result } = renderHook(() => useLocalStorage('test-key', largeArray));

      expect(result.current[0]).toEqual(largeArray);
    });

    it('should handle boolean values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', true));

      act(() => {
        result.current[1](false);
      });

      expect(result.current[0]).toBe(false);
    });

    it('should handle undefined initial value', () => {
      const { result } = renderHook(() => useLocalStorage<string | undefined>('test-key', undefined));
      expect(result.current[0]).toBe(undefined);
    });
  });
});
