import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import RateUsScreen from "./src/screens/RateUsScreen";
import ChatbotScreen from "./src/screens/ChatbotScreen";
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordForm from './src/screens/ResetPasswordForm'; // ✅ Imported

const Stack = createStackNavigator();

const AuthenticatedStack = () => (
  <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }} // Important: Hide the StackNavigator's header for HomeScreen
      />
      {/* Remove header configuration from these screens here, as the Tab.Navigator will handle it */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RateUs" component={RateUsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const UnauthenticatedStack = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordForm} />

  </Stack.Navigator>
);

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AuthenticatedStack /> : <UnauthenticatedStack />}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
