import type { PersistenceAdapter } from './types';
import { browserStorageKey } from './paths';

export class BrowserPersistenceAdapter implements PersistenceAdapter {
  private storage: Storage | null;

  constructor(storage?: Storage | null) {
    this.storage = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  }

  async read<T>(key: string): Promise<T | null> {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(browserStorageKey(key));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async write<T>(key: string, data: T): Promise<void> {
    if (!this.storage) return;
    try {
      this.storage.setItem(browserStorageKey(key), JSON.stringify(data));
    } catch (err) {
      console.warn('[StudioPersistence] localStorage write failed:', err);
    }
  }

  async delete(key: string): Promise<void> {
    this.storage?.removeItem(browserStorageKey(key));
  }

  async exists(key: string): Promise<boolean> {
    return this.storage?.getItem(browserStorageKey(key)) != null;
  }
}
