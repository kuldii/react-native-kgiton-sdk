/**
 * Model untuk data berat dari timbangan
 */
export interface WeightData {
  weight: number;
  timestamp: Date;
  unit: string;
}

/**
 * Factory dan helper untuk WeightData
 */
export class WeightDataFactory {
  static create(weight: number, timestamp?: Date, unit = 'kg'): WeightData {
    return {
      weight,
      timestamp: timestamp || new Date(),
      unit,
    };
  }

  /**
   * Raw weight value tanpa formatting
   */
  static getRawWeight(data: WeightData): number {
    return data.weight;
  }

  /**
   * Format berat sebagai string dengan 3 desimal
   */
  static getFormattedWeight(data: WeightData): string {
    return data.weight.toFixed(3);
  }

  /**
   * Berat dalam string dengan satuan
   */
  static getDisplayWeight(data: WeightData): string {
    return `${WeightDataFactory.getFormattedWeight(data)} ${data.unit}`;
  }
}
