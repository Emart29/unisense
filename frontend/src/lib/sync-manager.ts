import { apiClient } from './api-client';
import { OfflineStorage } from './offline-storage';

export class SyncManager {
  private static syncInProgress = false;

  static async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress) return;
    if (!OfflineStorage.isOnline()) return;

    this.syncInProgress = true;

    try {
      const pendingOps = OfflineStorage.getPendingSync();
      
      for (const op of pendingOps) {
        try {
          await this.executeSyncOperation(op);
        } catch (error) {
          console.error('Failed to sync operation:', op, error);
          // Keep failed operations for retry
          continue;
        }
      }

      // Clear successfully synced operations
      OfflineStorage.clearPendingSync();
    } finally {
      this.syncInProgress = false;
    }
  }

  private static async executeSyncOperation(op: any): Promise<void> {
    const { type, method, url, data } = op;

    switch (method) {
      case 'POST':
        await apiClient.post(url, data);
        break;
      case 'PUT':
        await apiClient.put(url, data);
        break;
      case 'PATCH':
        await apiClient.patch(url, data);
        break;
      case 'DELETE':
        await apiClient.delete(url);
        break;
      default:
        throw new Error(`Unsupported sync method: ${method}`);
    }
  }

  static setupOnlineListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('Connection restored, syncing...');
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost, entering offline mode');
    });
  }

  static async refreshCachedData(userId: string, role: string): Promise<void> {
    if (!OfflineStorage.isOnline()) return;

    try {
      // Refresh based on role
      if (role === 'STUDENT') {
        // Cache student profile
        const profile = await apiClient.get(`/api/students/${userId}`);
        OfflineStorage.cacheStudentProfile(userId, profile.data);

        // Cache courses
        const courses = await apiClient.get('/api/courses');
        OfflineStorage.cacheCourses(courses.data);

        // Cache grades
        const grades = await apiClient.get(`/api/grades/student/${userId}`);
        OfflineStorage.cacheGrades(userId, grades.data);

        // Cache registrations
        const registrations = await apiClient.get(`/api/course-registrations/student/${userId}`);
        OfflineStorage.cacheCourseRegistrations(userId, registrations.data);
      }
    } catch (error) {
      console.error('Failed to refresh cached data:', error);
    }
  }
}
