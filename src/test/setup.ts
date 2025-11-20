/// <reference types="vitest/globals" />
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

declare const global: typeof globalThis;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock browser APIs
global.Notification = vi.fn() as unknown as typeof Notification;
global.Notification.requestPermission = vi.fn().mockResolvedValue('granted' as NotificationPermission);
Object.defineProperty(global.Notification, 'permission', {
  writable: true,
  value: 'default' as NotificationPermission,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    controller: null,
    ready: Promise.resolve({
      showNotification: vi.fn(),
    }),
  },
  writable: true,
  configurable: true,
});

// Make expect available globally
Object.defineProperty(global, 'expect', {
  writable: true,
  value: expect,
});
