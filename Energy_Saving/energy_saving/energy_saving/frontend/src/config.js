import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Support EXPO_PUBLIC_API_URL if configured
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Automatically detect the host PC's IP during local development
  const manifest = Constants.expoConfig || Constants.manifest || {};
  const hostUri = manifest.hostUri;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }

  // Fallback for web or standalone production build
  return 'http://localhost:3000';
};

export const BASE_URL = getApiUrl();
export const API_URL = `${BASE_URL}/api`;
