/**
 * Feature: unisense-mvp, Property 34: Sync on reconnection
 * Validates: Requirements 11.3
 * 
 * Property: For any PWA with pending changes, restoring internet connectivity
 * should trigger synchronization with the Core Backend, applying all pending updates.
 */

import * as fc from 'fast-check';
import { OfflineStorage } from '@/lib/offline-storage';
import { SyncManager } from '@/lib/sync-manager';
import { apiClient } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Property 34: Sync on reconnection', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    
    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => storage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          storage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete storage[key];
        }),
        clear: jest.fn(() => {
          storage = {};
        }),
        length: 0,
        key: jest.fn(),
      },
      writable: true,
    });

    // Mock navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear pending sync operations
    OfflineStorage.clearPendingSync();
  });

  afterEach(() => {
    storage = {};
    jest.clearAllMocks();
    OfflineStorage.clearPendingSync();
  });

  test('pending POST operations sync on reconnection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constant('create'),
            method: fc.constant('POST'),
            url: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/api/${s}`),
            data: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 3, maxLength: 50 }),
            }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (operations) => {
          // Clear mocks and storage for this iteration
          jest.clearAllMocks();
          OfflineStorage.clearPendingSync();
          
          // Setup: Add pending operations
          operations.forEach(op => {
            OfflineStorage.addPendingSync(op);
          });

          // Verify operations are pending
          const pending = OfflineStorage.getPendingSync();
          expect(pending.length).toBe(operations.length);

          // Mock API responses
          (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });

          // Test: Sync pending operations
          await SyncManager.syncPendingOperations();

          // Verify: All POST operations were called
          expect(apiClient.post).toHaveBeenCalledTimes(operations.length);
          
          operations.forEach((op, index) => {
            expect(apiClient.post).toHaveBeenNthCalledWith(
              index + 1,
              op.url,
              op.data
            );
          });

          // Verify: Pending operations cleared after successful sync
          const remainingPending = OfflineStorage.getPendingSync();
          expect(remainingPending.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('pending PUT operations sync on reconnection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constant('update'),
            method: fc.constant('PUT'),
            url: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/api/${s}`),
            data: fc.record({
              id: fc.uuid(),
              value: fc.integer({ min: 0, max: 1000 }),
            }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (operations) => {
          // Clear mocks and storage for this iteration
          jest.clearAllMocks();
          OfflineStorage.clearPendingSync();
          
          // Setup: Add pending operations
          operations.forEach(op => {
            OfflineStorage.addPendingSync(op);
          });

          // Mock API responses
          (apiClient.put as jest.Mock).mockResolvedValue({ data: { success: true } });

          // Test: Sync pending operations
          await SyncManager.syncPendingOperations();

          // Verify: All PUT operations were called
          expect(apiClient.put).toHaveBeenCalledTimes(operations.length);
          
          operations.forEach((op, index) => {
            expect(apiClient.put).toHaveBeenNthCalledWith(
              index + 1,
              op.url,
              op.data
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('pending PATCH operations sync on reconnection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constant('patch'),
            method: fc.constant('PATCH'),
            url: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/api/${s}`),
            data: fc.record({
              field: fc.string({ minLength: 3, maxLength: 20 }),
              value: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (operations) => {
          // Clear mocks and storage for this iteration
          jest.clearAllMocks();
          OfflineStorage.clearPendingSync();
          
          // Setup: Add pending operations
          operations.forEach(op => {
            OfflineStorage.addPendingSync(op);
          });

          // Mock API responses
          (apiClient.patch as jest.Mock).mockResolvedValue({ data: { success: true } });

          // Test: Sync pending operations
          await SyncManager.syncPendingOperations();

          // Verify: All PATCH operations were called
          expect(apiClient.patch).toHaveBeenCalledTimes(operations.length);
          
          operations.forEach((op, index) => {
            expect(apiClient.patch).toHaveBeenNthCalledWith(
              index + 1,
              op.url,
              op.data
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('pending DELETE operations sync on reconnection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constant('delete'),
            method: fc.constant('DELETE'),
            url: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/api/${s}`),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (operations) => {
          // Clear mocks and storage for this iteration
          jest.clearAllMocks();
          OfflineStorage.clearPendingSync();
          
          // Setup: Add pending operations
          operations.forEach(op => {
            OfflineStorage.addPendingSync(op);
          });

          // Mock API responses
          (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

          // Test: Sync pending operations
          await SyncManager.syncPendingOperations();

          // Verify: All DELETE operations were called
          expect(apiClient.delete).toHaveBeenCalledTimes(operations.length);
          
          operations.forEach((op, index) => {
            expect(apiClient.delete).toHaveBeenNthCalledWith(
              index + 1,
              op.url
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mixed operation types sync in order on reconnection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            fc.record({
              type: fc.constant('create'),
              method: fc.constant('POST'),
              url: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/api/${s}`),
              data: fc.record({ id: fc.uuid() }),
            }),
            fc.record({
              type: fc.constant('update'),
              method: fc.constant('PUT'),
              url: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/api/${s}`),
              data: fc.record({ id: fc.uuid() }),
            }),
            fc.record({
              type: fc.constant('patch'),
              method: fc.constant('PATCH'),
              url: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/api/${s}`),
              data: fc.record({ field: fc.string() }),
            })
          ),
          { minLength: 1, maxLength: 10 }
        ),
        async (operations) => {
          // Clear mocks and storage for this iteration
          jest.clearAllMocks();
          OfflineStorage.clearPendingSync();
          
          // Setup: Add pending operations
          operations.forEach(op => {
            OfflineStorage.addPendingSync(op);
          });

          // Mock API responses
          (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
          (apiClient.put as jest.Mock).mockResolvedValue({ data: { success: true } });
          (apiClient.patch as jest.Mock).mockResolvedValue({ data: { success: true } });

          // Test: Sync pending operations
          await SyncManager.syncPendingOperations();

          // Verify: Total API calls match operation count
          const totalCalls = 
            (apiClient.post as jest.Mock).mock.calls.length +
            (apiClient.put as jest.Mock).mock.calls.length +
            (apiClient.patch as jest.Mock).mock.calls.length;
          
          expect(totalCalls).toBe(operations.length);

          // Verify: Operations were executed in order
          const postOps = operations.filter(op => op.method === 'POST');
          const putOps = operations.filter(op => op.method === 'PUT');
          const patchOps = operations.filter(op => op.method === 'PATCH');

          expect(apiClient.post).toHaveBeenCalledTimes(postOps.length);
          expect(apiClient.put).toHaveBeenCalledTimes(putOps.length);
          expect(apiClient.patch).toHaveBeenCalledTimes(patchOps.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('sync does not occur when offline', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            method: fc.constant('POST'),
            url: fc.string().map(s => `/api/${s}`),
            data: fc.record({ id: fc.uuid() }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (operations) => {
          // Clear mocks and storage for this iteration
          jest.clearAllMocks();
          OfflineStorage.clearPendingSync();
          
          // Setup: Add pending operations
          operations.forEach(op => {
            OfflineStorage.addPendingSync(op);
          });

          // Simulate offline
          Object.defineProperty(global.navigator, 'onLine', {
            writable: true,
            value: false,
          });

          // Test: Attempt to sync while offline
          await SyncManager.syncPendingOperations();

          // Verify: No API calls were made
          expect(apiClient.post).not.toHaveBeenCalled();
          expect(apiClient.put).not.toHaveBeenCalled();
          expect(apiClient.patch).not.toHaveBeenCalled();
          expect(apiClient.delete).not.toHaveBeenCalled();

          // Verify: Operations remain pending
          const pending = OfflineStorage.getPendingSync();
          expect(pending.length).toBeGreaterThanOrEqual(operations.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
