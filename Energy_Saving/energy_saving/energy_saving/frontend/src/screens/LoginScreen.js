import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');  // Changed from email to username to match backend
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoOpacity] = useState(new Animated.Value(0));  // Animation for logo fade-in
  const { login } = useAuth();

  useEffect(() => {
    // Fade-in animation for the logo when the component mounts
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 2000, // Adjust the duration for the fade-in effect
      useNativeDriver: true,
    }).start();
  }, [logoOpacity]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const credentials = { username, password };
      const result = await login(credentials);
      
      if (result && result.token) {
        console.log('Login successful');
        Alert.alert('Success', 'You have logged in successfully!', [
          { text: 'OK', onPress: () => navigation.replace('Home') }
        ]);
      } else {
        Alert.alert('Login Failed', 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        {/* Logo Animation */}
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
          <Image
            source={require('../../assets/energylogo.png')}  // Ensure this path is correct
            style={styles.logo}
          />
        </Animated.View>

        <Text style={styles.title}>Login</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            autoCapitalize="none"
            testID="username-input"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            testID="password-input"
          />
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}
          testID="login-button"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,  // Adjust logo size
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#333',
  },
  footerLink: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LoginScreen;
