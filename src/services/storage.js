import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const KEYS = { TOKEN: 'pc_token', USER_ID: 'pc_uid', DEVICE_ID: 'pc_did', PIN: 'pc_pin', HIDDEN: 'pc_hidden', PINNED_ROOMS: 'pc_pinned' };
const SAVED_FILE = FileSystem.documentDirectory + 'saved_messages.json';

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

// Pinned rooms
export async function getFavorites() {
  try { const j = await SecureStore.getItemAsync(KEYS.PINNED_ROOMS); return j ? JSON.parse(j) : []; } catch(_) { return []; }
}
export async function saveFavorites(list) { await SecureStore.setItemAsync(KEYS.PINNED_ROOMS, JSON.stringify(list)); }

// Saved messages (Избранное) — file-based for unlimited size
export async function getSavedMessages() {
  try {
    const j = await FileSystem.readAsStringAsync(SAVED_FILE);
    return JSON.parse(j);
  } catch(_) { return []; }
}
export async function addSavedMessage(msg) {
  const msgs = await getSavedMessages();
  if (msgs.find(m => m.id === msg.id)) return;
  msgs.unshift({ id: msg.id, body: msg.body, msgtype: msg.msgtype, sender: msg.sender, senderName: msg.senderName, ts: msg.ts, url: msg.url, filename: msg.filename, info: msg.info, roomId: msg.roomId, roomName: msg.roomName });
  await FileSystem.writeAsStringAsync(SAVED_FILE, JSON.stringify(msgs));
}
export async function removeSavedMessage(msgId) {
  const msgs = await getSavedMessages();
  await FileSystem.writeAsStringAsync(SAVED_FILE, JSON.stringify(msgs.filter(m => m.id !== msgId)));
}

// Hidden chats
export async function getHiddenChats() {
  try { const j = await SecureStore.getItemAsync(KEYS.HIDDEN); return j ? JSON.parse(j) : []; } catch(_) { return []; }
}
export async function setHiddenChats(list) { await SecureStore.setItemAsync(KEYS.HIDDEN, JSON.stringify(list)); }
