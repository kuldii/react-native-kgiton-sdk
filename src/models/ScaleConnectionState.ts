/**
 * BLE Connection States
 */
export enum ScaleConnectionState {
  DISCONNECTED = 'disconnected',
  SCANNING = 'scanning',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error',
}

/**
 * Helper methods for connection state
 */
export const ConnectionStateHelpers = {
  isConnected: (state: ScaleConnectionState): boolean => {
    return [
      ScaleConnectionState.CONNECTED,
      ScaleConnectionState.AUTHENTICATED,
    ].includes(state);
  },

  isAuthenticated: (state: ScaleConnectionState): boolean => {
    return state === ScaleConnectionState.AUTHENTICATED;
  },

  getDisplayName: (state: ScaleConnectionState): string => {
    const names: Record<ScaleConnectionState, string> = {
      [ScaleConnectionState.DISCONNECTED]: 'Terputus',
      [ScaleConnectionState.SCANNING]: 'Mencari Perangkat',
      [ScaleConnectionState.CONNECTING]: 'Menghubungkan',
      [ScaleConnectionState.CONNECTED]: 'Terhubung',
      [ScaleConnectionState.AUTHENTICATED]: 'Terautentikasi',
      [ScaleConnectionState.ERROR]: 'Error',
    };
    return names[state];
  },
};
