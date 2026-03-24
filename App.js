import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackHandler, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import matrix from './src/services/matrix';
import { getSession } from './src/services/storage';
import { initNotifications, onNotificationTap } from './src/services/notifications';
import { checkForUpdate } from './src/services/updater';
import LoginScreen from './src/screens/LoginScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RoomInfoScreen from './src/screens/RoomInfoScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import CreateChannelScreen from './src/screens/CreateChannelScreen';
import AddMemberScreen from './src/screens/AddMemberScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import PersonalizationScreen from './src/screens/PersonalizationScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import DataStorageScreen from './src/screens/DataStorageScreen';
import AboutScreen from './src/screens/AboutScreen';
import FoldersScreen from './src/screens/FoldersScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import ChatBgScreen from './src/screens/ChatBgScreen';
import CallScreen from './src/screens/CallScreen';
import { onThemeChange, colors, loadThemeFromStorage } from './src/utils/theme';

const SUB_SCREENS = ['chat', 'profile', 'search', 'settings', 'roominfo', 'creategroup', 'createchannel', 'addmember', 'favorites', 'privacy', 'personalization', 'notifications', 'datastorage', 'devices', 'about', 'folders', 'language', 'chatbg'];

export default function App() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState('rooms');
  const [screenParams, setScreenParams] = useState({});
  const screenAnim = useRef(new Animated.Value(1)).current;
  
  const animateScreen = (fn) => {
    Animated.timing(screenAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(screenAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };
  const [history, setHistory] = useState([]);
  const [themeKey, setThemeKey] = useState(0);

  const navigate = useCallback((name, params = {}) => {
    setHistory(h => [...h, { screen, params: screenParams }]);
    setScreen(name);
    setScreenParams(params);
  }, [screen, screenParams]);

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setScreen(prev.screen);
      setScreenParams(prev.params);
      return true;
    }
    if (screen !== 'rooms') {
      setScreen('rooms');
      setScreenParams({});
      return true;
    }
    return false; // let Android handle exit
  }, [history, screen]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [goBack]);

  useEffect(() => {
    const unsub = onThemeChange(() => setThemeKey(k => k + 1));
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await initNotifications();
        await loadThemeFromStorage();
        const session = await getSession();
        if (session) {
          matrix.restoreSession(session.token, session.userId, session.deviceId);
          matrix.startSync();
          setLoggedIn(true);
        }
      } catch(_) {}
      setReady(true);
      setTimeout(() => checkForUpdate(), 3000);
    })();
    const unsub = onNotificationTap((roomId) => {
      setScreen('chat');
      setScreenParams({ roomId });
    });
    return unsub;
  }, []);

  if (!ready) return null;

  if (!loggedIn) {
    return (
      <SafeAreaProvider>
        <StatusBar style={colors.statusBar || "light"} />
        <LoginScreen onLogin={() => { setLoggedIn(true); matrix.startSync(); setScreen('rooms'); }} />
      </SafeAreaProvider>
    );
  }

  const nav = { navigate, goBack, params: screenParams };

  return (
    <SafeAreaProvider>
      <StatusBar style={colors.statusBar || "light"} />
      {screen === 'rooms' && <RoomsScreen navigation={nav} />}
      {screen === 'chat' && <ChatScreen navigation={nav} route={{ params: screenParams }} />}
      {screen === 'profile' && <ProfileScreen navigation={nav} onLogout={() => setLoggedIn(false)} />}
      {screen === 'search' && <SearchScreen navigation={nav} />}
      {screen === 'settings' && <SettingsScreen navigation={nav} onLogout={() => { setLoggedIn(false); matrix.logout(); matrix.stopSync(); setScreen('rooms'); }} />}
      {screen === 'roominfo' && <RoomInfoScreen navigation={nav} route={{ params: screenParams }} />}
      {screen === 'creategroup' && <CreateGroupScreen navigation={nav} />}
      {screen === 'createchannel' && <CreateChannelScreen navigation={nav} />}
      {screen === 'addmember' && <AddMemberScreen navigation={nav} route={{ params: screenParams }} />}
      {screen === 'favorites' && <FavoritesScreen navigation={nav} />}
      {screen === "privacy" && <PrivacyScreen navigation={nav} />}
      {screen === "personalization" && <PersonalizationScreen navigation={nav} />}
      {screen === "notifications" && <NotificationsScreen navigation={nav} />}
      {screen === "datastorage" && <DataStorageScreen navigation={nav} />}
      {screen === "about" && <AboutScreen navigation={nav} />}
      {screen === "folders" && <FoldersScreen navigation={nav} />}
      {screen === "language" && <LanguageScreen navigation={nav} />}
      {screen === "chatbg" && <ChatBgScreen navigation={nav} />}
      {screen === "call" && <CallScreen navigation={nav} route={{ params: screenParams }} />}
    </SafeAreaProvider>
  );
}
