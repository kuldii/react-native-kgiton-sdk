/**
 * Connection stability monitoring
 */
export interface ConnectionMetrics {
  connectionTime: number;
  disconnectionCount: number;
  lastDisconnection?: Date;
  averageRSSI?: number;
  rssiSamples: number[];
}

export class ConnectionStability {
  private metrics: Map<string, ConnectionMetrics> = new Map();

  /**
   * Track connection established
   */
  trackConnection(deviceId: string): void {
    const existing = this.metrics.get(deviceId);
    this.metrics.set(deviceId, {
      connectionTime: Date.now(),
      disconnectionCount: existing?.disconnectionCount || 0,
      lastDisconnection: existing?.lastDisconnection,
      rssiSamples: [],
    });
  }

  /**
   * Track disconnection
   */
  trackDisconnection(deviceId: string): void {
    const metrics = this.metrics.get(deviceId);
    if (metrics) {
      metrics.disconnectionCount++;
      metrics.lastDisconnection = new Date();
    }
  }

  /**
   * Track RSSI sample
   */
  trackRSSI(deviceId: string, rssi: number): void {
    const metrics = this.metrics.get(deviceId);
    if (metrics) {
      metrics.rssiSamples.push(rssi);
      // Keep only last 10 samples
      if (metrics.rssiSamples.length > 10) {
        metrics.rssiSamples.shift();
      }
      // Calculate average
      const sum = metrics.rssiSamples.reduce((a, b) => a + b, 0);
      metrics.averageRSSI = sum / metrics.rssiSamples.length;
    }
  }

  /**
   * Get connection metrics
   */
  getMetrics(deviceId: string): ConnectionMetrics | undefined {
    return this.metrics.get(deviceId);
  }

  /**
   * Check if connection is stable
   */
  isStable(deviceId: string): boolean {
    const metrics = this.metrics.get(deviceId);
    if (!metrics) return false;

    const uptime = Date.now() - metrics.connectionTime;
    const hasMinimalUptime = uptime > 5000; // 5 seconds
    const hasGoodRSSI = !metrics.averageRSSI || metrics.averageRSSI > -80;
    const hasLowDisconnectionRate = metrics.disconnectionCount < 3;

    return hasMinimalUptime && hasGoodRSSI && hasLowDisconnectionRate;
  }

  /**
   * Reset metrics for device
   */
  reset(deviceId: string): void {
    this.metrics.delete(deviceId);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}
