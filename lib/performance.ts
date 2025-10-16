// Performance utility functions

/**
 * Debounce function to limit how often a function can be called
 * Useful for search inputs, resize handlers, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to ensure a function is called at most once per time period
 * Useful for scroll handlers, frequent API calls, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Simple in-memory LRU cache implementation
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)

    return value
  }

  set(key: K, value: V): void {
    // Delete if exists to re-add at end
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // Add to end (most recently used)
    this.cache.set(key, value)

    // Remove oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

/**
 * Batch multiple async operations to reduce overhead
 */
export class BatchProcessor<T, R> {
  private queue: Array<{
    item: T
    resolve: (value: R) => void
    reject: (error: any) => void
  }> = []
  private timeout: NodeJS.Timeout | null = null
  private processing = false

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private maxBatchSize: number = 10,
    private maxWaitTime: number = 100
  ) {}

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject })

      // Process if batch is full
      if (this.queue.length >= this.maxBatchSize) {
        this.processBatch()
      } else {
        // Schedule batch processing
        if (this.timeout) {
          clearTimeout(this.timeout)
        }
        this.timeout = setTimeout(() => this.processBatch(), this.maxWaitTime)
      }
    })
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    const batch = this.queue.splice(0, this.maxBatchSize)
    const items = batch.map((b) => b.item)

    try {
      const results = await this.processor(items)

      batch.forEach((b, index) => {
        b.resolve(results[index])
      })
    } catch (error) {
      batch.forEach((b) => {
        b.reject(error)
      })
    } finally {
      this.processing = false

      // Process remaining items if any
      if (this.queue.length > 0) {
        this.processBatch()
      }
    }
  }
}

/**
 * Request deduplication to prevent multiple identical requests
 */
export class RequestDeduplicator<T> {
  private pending = new Map<string, Promise<T>>()

  async dedupe(key: string, fn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!
    }

    // Create new request
    const promise = fn().finally(() => {
      // Clean up after completion
      this.pending.delete(key)
    })

    this.pending.set(key, promise)
    return promise
  }

  clear(): void {
    this.pending.clear()
  }
}
