// Offline storage manager for PWA
export interface CachedData {
  timestamp: number;
  data: any;
}

export class OfflineStorage {
  private static readonly STORAGE_PREFIX = 'unisense_offline_';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static set(key: string, data: any): void {
    if (typeof window === 'undefined') return;
    
    const cached: CachedData = {
      timestamp: Date.now(),
      data,
    };
    
    try {
      localStorage.setItem(
        `${this.STORAGE_PREFIX}${key}`,
        JSON.stringify(cached)
      );
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  static get<T = any>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (!item) return null;

      const cached: CachedData = JSON.parse(item);
      
      // Check if cache is still valid
      if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
        this.remove(key);
        return null;
      }

      return cached.data as T;
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
      return null;
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  static isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  }

  // Cache student profile
  static cacheStudentProfile(studentId: string, profile: any): void {
    this.set(`student_profile_${studentId}`, profile);
  }

  static getCachedStudentProfile(studentId: string): any | null {
    return this.get(`student_profile_${studentId}`);
  }

  // Cache courses
  static cacheCourses(courses: any[]): void {
    this.set('courses', courses);
  }

  static getCachedCourses(): any[] | null {
    return this.get('courses');
  }

  // Cache grades
  static cacheGrades(studentId: string, grades: any[]): void {
    this.set(`grades_${studentId}`, grades);
  }

  static getCachedGrades(studentId: string): any[] | null {
    return this.get(`grades_${studentId}`);
  }

  // Cache course registrations
  static cacheCourseRegistrations(studentId: string, registrations: any[]): void {
    this.set(`registrations_${studentId}`, registrations);
  }

  static getCachedCourseRegistrations(studentId: string): any[] | null {
    return this.get(`registrations_${studentId}`);
  }

  // Pending sync operations
  static addPendingSync(operation: any): void {
    const pending = this.get<any[]>('pending_sync') || [];
    pending.push({
      ...operation,
      timestamp: Date.now(),
    });
    this.set('pending_sync', pending);
  }

  static getPendingSync(): any[] {
    return this.get<any[]>('pending_sync') || [];
  }

  static clearPendingSync(): void {
    this.remove('pending_sync');
  }
}
