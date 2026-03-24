import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let permissionGranted = false;

export async function initNotifications() {
  if (!Device.isDevice) return;
  
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  permissionGranted = finalStatus === 'granted';
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Сообщения',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C6AEF',
      sound: 'default',
    });
  }
}

export async function showMessageNotification(senderName, body, roomId) {
  if (!permissionGranted) return;
  // Don't show if app is active/foreground
  if (AppState.currentState === 'active') return;
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: senderName || 'Новое сообщение',
        body: body || '',
        data: { roomId },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'messages' }),
      },
      trigger: null, // immediate
    });
  } catch (e) {
    // silently fail
  }
}

export function onNotificationTap(callback) {
  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    const roomId = response.notification.request.content.data?.roomId;
    if (roomId && callback) callback(roomId);
  });
  return () => sub.remove();
}
