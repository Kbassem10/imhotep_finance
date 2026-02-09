import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  useColorScheme,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const themes = {
  light: {
    background: '#EEF2FF',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    placeholder: '#9CA3AF',
    border: '#D1D5DB',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    success: '#16A34A',
    successBg: '#DCFCE7',
    successBorder: '#86EFAC',
    inputBg: '#FFFFFF',
    progressBg: '#E5E7EB',
  },
  dark: {
    background: '#1F2937',
    card: '#374151',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    placeholder: '#6B7280',
    border: '#4B5563',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    error: '#F87171',
    errorBg: '#7F1D1D',
    errorBorder: '#F87171',
    success: '#4ADE80',
    successBg: '#14532D',
    successBorder: '#4ADE80',
    inputBg: '#4B5563',
    progressBg: '#4B5563',
  },
};

type VerificationStatus = 'input' | 'verifying' | 'success' | 'error';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'];

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<VerificationStatus>('input');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get email from AsyncStorage (set during registration)
    const loadEmail = async () => {
      const storedEmail = await AsyncStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    };
    loadEmail();
  }, []);

  const verifyEmail = async (otpCode: string, userEmail: string) => {
    try {
      const response = await axios.post('/api/auth/verify-email/', {
        otp: otpCode,
        email: userEmail,
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      return {
        success: false,
        error: axiosError.response?.data?.error || 'Verification failed. Please try again.',
      };
    }
  };

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setStatus('verifying');
    setError('');
    setLoading(true);

    const result = await verifyEmail(otp, email);

    if (result.success) {
      setStatus('success');
      setMessage(result.message || 'Your email has been verified successfully!');
      // Clear stored email
      await AsyncStorage.removeItem('pendingVerificationEmail');

      // Start countdown
      let count = 5;
      const timerId = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(timerId);
          router.replace('/(auth)/login');
        }
      }, 1000);
    } else {
      setStatus('input');
      setError(result.error || 'Verification failed');
    }

    setLoading(false);
  };

  const getIcon = () => {
    switch (status) {
      case 'verifying':
        return (
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        );
      case 'success':
        return (
          <View style={[styles.iconCircle, { backgroundColor: colors.successBg }]}>
            <Ionicons name="checkmark" size={24} color={colors.success} />
          </View>
        );
      case 'error':
        return (
          <View style={[styles.iconCircle, { backgroundColor: colors.errorBg }]}>
            <Ionicons name="alert-circle" size={24} color={colors.error} />
          </View>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'input':
        return 'Verify Your Email';
      case 'verifying':
        return 'Verifying...';
      case 'success':
        return 'Email Verified';
      case 'error':
        return 'Verification Failed';
    }
  };

  const getSubtitle = () => {
    switch (status) {
      case 'input':
        return 'Enter the 6-digit OTP code sent to your email. The code expires in 10 minutes.';
      case 'verifying':
        return 'Please wait while we verify your email address.';
      case 'success':
        return message || 'Your email has been verified. Redirecting to login shortly.';
      case 'error':
        return message;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
              <Image
                source={require('@/assets/images/imhotep_finance.png')}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{getSubtitle()}</Text>

          {(status === 'verifying' || status === 'success') && (
            <View style={styles.statusIconContainer}>{getIcon()}</View>
          )}

          {/* Input Form */}
          {status === 'input' && (
            <>
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Email Address Or Username</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.placeholder}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your email or username"
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                  />
                </View>
              </View>

              {/* OTP Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>OTP Code</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons
                    name="keypad-outline"
                    size={20}
                    color={colors.placeholder}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.otpInput, { color: colors.text }]}
                    placeholder="000000"
                    placeholderTextColor={colors.placeholder}
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text.replace(/\D/g, ''));
                      if (error) setError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }, (loading || otp.length !== 6 || !email) && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading || otp.length !== 6 || !email}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>

              {/* Resend Link */}
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                Didn't receive the code?{' '}
                <Link href="/(auth)/login" asChild>
                  <Text style={[styles.linkText, { color: colors.primary }]}>Login to resend</Text>
                </Link>
              </Text>
            </>
          )}

          {/* Verifying State */}
          {status === 'verifying' && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.progressBg }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>Processing verification...</Text>
            </View>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
                  <Text style={styles.buttonText}>Go to Login</Text>
                </TouchableOpacity>
              </Link>
              {countdown > 0 && (
                <View style={[styles.countdownBox, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
                  <Text style={[styles.countdownText, { color: colors.success }]}>
                    Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Support Link */}
          <Text style={[styles.supportText, { color: colors.textSecondary }]}>Need help? Contact support</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  statusIconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleBlue: {
  },
  iconCircleGreen: {
  },
  iconCircleRed: {
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  countdownBox: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  countdownText: {
    fontSize: 14,
    textAlign: 'center',
  },
  helpText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  linkText: {
    fontWeight: '600',
  },
  supportText: {
    marginTop: 24,
    fontSize: 14,
    textAlign: 'center',
  },
});