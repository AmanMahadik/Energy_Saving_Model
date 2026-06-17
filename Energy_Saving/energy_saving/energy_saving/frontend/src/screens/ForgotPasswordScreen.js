import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { API_URL } from '../config';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Password reset email sent. Check your inbox.');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Forgot Password Error:', error);
      Alert.alert('Error', 'Could not send reset email');
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email to resend reset link');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/resend-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Reset email resent. Please check your inbox.');
      } else {
        Alert.alert('Error', data.message || 'Failed to resend email');
      }
    } catch (error) {
      console.error('Resend Email Error:', error);
      Alert.alert('Error', 'Unable to resend reset email. Try again later.');
    }
  };

  return (
    <Animatable.View animation="fadeInUpBig" duration={800} style={styles.container}>
      <Animatable.Text animation="fadeInDown" style={styles.title}>Forgot Password</Animatable.Text>

      <Animatable.View animation="fadeInLeft" delay={200}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Animatable.View>

      <Animatable.View animation="zoomIn" delay={400}>
        <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>
      </Animatable.View>

      <Animatable.View animation="zoomIn" delay={600}>
        <TouchableOpacity style={styles.resendButton} onPress={handleResendEmail}>
          <Text style={styles.resendButtonText}>Resend Email</Text>
        </TouchableOpacity>
      </Animatable.View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    width: 300,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    width: 300,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    width: 300,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
