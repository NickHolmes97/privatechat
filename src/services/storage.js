import * as SecureStore from 'expo-secure-store';

const KEYS = { TOKEN: 'pc_token', USER_ID: 'pc_uid', DEVICE_ID: 'pc_did', PIN: 'pc_pin', FAVORITES: 'pc_favs', HIDDEN: 'pc_hidden', THEME: 'pc_theme' };

export async function saveSession(token, userId, deviceId) {
  await SecureStore.setItemAsync(KEYS.TOKEN, token);
  await SecureStore.setItemAsync(KEYS.USER_ID, userId);
  await SecureStore.setItemAsync(KEYS.DEVICE_ID, deviceId);
}

export async function getSession() {
  const token = await SecureStore.getItemAsync(KEYS.TOKEN);
  const userId = await SecureStore.getItemAsync(KEYS.USER_ID);
  const deviceId = await SecureStore.getItemAsync(KEYS.DEVICE_ID);
  return token ? { token, userId, deviceId } : null;
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(KEYS.TOKEN);
  await SecureStore.deleteItemAsync(KEYS.USER_ID);
  await SecureStore.deleteItemAsync(KEYS.DEVICE_ID);
}

export async function setPin(pin) { await SecureStore.setItemAsync(KEYS.PIN, pin); }
export async function getPin() { return SecureStore.getItemAsync(KEYS.PIN); }
export async function clearPin() { await SecureStore.deleteItemAsync(KEYS.PIN); }

export async function getFavorites() {
  const j = await SecureStore.getItemAsync(KEYS.FAVORITES);
  return j ? JSON.parse(j) : [];
}
export async function saveFavorites(list) { await SecureStore.setItemAsync(KEYS.FAVORITES, JSON.stringify(list)); }

export async function getHiddenChats() {
  const j = await SecureStore.getItemAsync(KEYS.HIDDEN);
  return j ? JSON.parse(j) : [];
}
export async function setHiddenChats(list) { await SecureStore.setItemAsync(KEYS.HIDDEN, JSON.stringify(list)); }
