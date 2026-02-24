import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import matrix from './src/services/matrix';
import { getSession } from './src/services/storage';
import LoginScreen from './src/screens/LoginScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState('rooms');
  const [screenParams, setScreenParams] = useState({});

  const navigate = (name, params = {}) => { setScreen(name); setScreenParams(params); };
  const goBack = () => setScreen('rooms');

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (session) {
          matrix.restoreSession(session.token, session.userId, session.deviceId);
          matrix.startSync();
          setLoggedIn(true);
        }
      } catch(_) {}
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  if (!loggedIn) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoginScreen onLogin={() => { setLoggedIn(true); matrix.startSync(); setScreen('rooms'); }} />
      </SafeAreaProvider>
    );
  }

  const nav = { navigate, goBack, params: screenParams };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen === 'rooms' && <RoomsScreen navigation={nav} />}
      {screen === 'chat' && <ChatScreen navigation={nav} route={{ params: screenParams }} />}
      {screen === 'profile' && <ProfileScreen navigation={nav} />}
      {screen === 'search' && <SearchScreen navigation={nav} />}
      {screen === 'settings' && <SettingsScreen navigation={nav} onLogout={() => { setLoggedIn(false); matrix.logout(); matrix.stopSync(); setScreen('rooms'); }} />}
    </SafeAreaProvider>
  );
}
