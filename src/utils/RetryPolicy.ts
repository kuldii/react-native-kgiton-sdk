/**
 * Retry policy untuk operasi BLE
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
}

export class RetryPolicy {
  /**
   * Execute function dengan retry logic
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    const { maxAttempts, delayMs, backoffMultiplier = 1.5 } = config;
    let lastError: Error | undefined;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          console.log(
            `[RetryPolicy] Attempt ${attempt} failed, retrying in ${currentDelay}ms...`
          );
          await this.delay(currentDelay);
          currentDelay *= backoffMultiplier;
        }
      }
    }

    throw lastError;
  }

  /**
   * Helper untuk delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute dengan timeout
   */
  static async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      ),
    ]);
  }
}
