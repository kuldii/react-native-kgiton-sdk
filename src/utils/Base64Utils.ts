/**
 * Base64 encoding/decoding utilities for React Native
 * Provides Buffer-like functionality without Node.js dependencies
 */

/**
 * Convert string to base64
 * @param str - Input string to encode
 * @returns Base64 encoded string
 */
export function stringToBase64(str: string): string {
  // Use btoa for browsers/React Native
  if (typeof btoa !== 'undefined') {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  }
  
  // Fallback for environments without btoa
  const bytes = new TextEncoder().encode(str);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

/**
 * Convert base64 to string
 * @param base64 - Base64 encoded string
 * @returns Decoded string
 */
export function base64ToString(base64: string): string {
  // Use atob for browsers/React Native
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    return decodeURIComponent(
      Array.from(binary, (char) => {
        return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
  }
  
  // Fallback for environments without atob
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Convert string to UTF-8 byte array
 * @param str - Input string
 * @returns Uint8Array of UTF-8 bytes
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert UTF-8 byte array to string
 * @param bytes - UTF-8 byte array
 * @returns Decoded string
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
