import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';

const UPDATE_URL = 'http://45.83.178.10:8444/version.json';
const APK_URL = 'http://45.83.178.10:8444/PrivateChat-RN.apk';

export async function checkForUpdate() {
  try {
    const r = await fetch(UPDATE_URL + '?t=' + Date.now());
    const data = await r.json();
    const current = Constants.expoConfig?.version || '1.0.0';
    if (data.version && data.version !== current) {
      Alert.alert(
        'Обновление доступно',
        `Новая версия ${data.version}\n\n${data.changelog || ''}`,
        [
          { text: 'Позже', style: 'cancel' },
          { text: 'Обновить', onPress: () => Linking.openURL(APK_URL) },
        ]
      );
      return true;
    }
  } catch(e) {}
  return false;
}
