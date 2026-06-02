import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_PORT = 4000;

function resolveBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
  const explicit = extra?.apiBaseUrl;
  // app.json で localhost 以外が明示設定されていればそれを優先
  if (explicit && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(explicit)) {
    return explicit;
  }
  // Expo Go / Dev Client: Expo Dev Server のホストを流用すると実機からも到達できる
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const host = String(hostUri).split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${API_PORT}`;
    }
  }
  // Android エミュレータからはホスト PC が 10.0.2.2
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }
  return explicit ?? `http://localhost:${API_PORT}`;
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
});

const TOKEN_KEY = 'homegear.token';
const isWeb = Platform.OS === 'web';

async function persistToken(token: string) {
  if (isWeb) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function removeToken() {
  if (isWeb) {
    window.localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

async function readToken(): Promise<string | null> {
  if (isWeb) {
    return window.localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string | null) {
  if (token) {
    await persistToken(token);
  } else {
    await removeToken();
  }
}

export async function getStoredToken(): Promise<string | null> {
  return readToken();
}

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
