import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import matrix from './src/services/matrix';
import { getSession } from './src/services/storage';
import LoginScreen from './src/screens/LoginScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/utils/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session) {
        matrix.restoreSession(session.token, session.userId, session.deviceId);
        matrix.startSync();
        setLoggedIn(true);
      }
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer theme={{ dark: true, colors: { primary: colors.purple, background: colors.bg, card: colors.surface, text: colors.text, border: colors.glassBorder, notification: colors.purple } }}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!loggedIn ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={() => { setLoggedIn(true); matrix.startSync(); }} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Rooms" component={RoomsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Settings">
              {(props) => <SettingsScreen {...props} onLogout={() => { setLoggedIn(false); matrix.logout(); }} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
