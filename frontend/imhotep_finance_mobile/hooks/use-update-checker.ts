import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

// GitHub repository info
const GITHUB_OWNER = 'Imhotep-Tech';
const GITHUB_REPO = 'imhotep_finance';

// Storage key for last check timestamp
const LAST_CHECK_KEY = 'update_checker_last_check';

interface UpdateCheckResult {
  hasUpdate: boolean;
  isOTAUpdate: boolean;
  isNativeUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  message: string;
}

export function useUpdateChecker() {
  const [checking, setChecking] = useState(false);

  const checkForUpdates = useCallback(async (showAlerts = true): Promise<UpdateCheckResult> => {
    setChecking(true);
    
    const currentVersion = Application.nativeApplicationVersion || '0.0.0';
    
    try {
      // Clear the last check timestamp to force a fresh check
      await AsyncStorage.removeItem(LAST_CHECK_KEY);

      // 1. Check for OTA Updates (EAS Update) - works for JS bundle updates
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          if (showAlerts) {
            Alert.alert(
              'Update Available',
              'A new update is available. The app will download it now and apply it on next restart.',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Update Now',
                  onPress: async () => {
                    try {
                      await Updates.fetchUpdateAsync();
                      Alert.alert(
                        'Update Downloaded',
                        'The update has been downloaded. Restart the app to apply it.',
                        [
                          { text: 'Later', style: 'cancel' },
                          { text: 'Restart Now', onPress: () => Updates.reloadAsync() },
                        ]
                      );
                    } catch (e) {
                      Alert.alert('Error', 'Failed to download update. Please try again later.');
                    }
                  },
                },
              ]
            );
          }
          
          setChecking(false);
          return {
            hasUpdate: true,
            isOTAUpdate: true,
            isNativeUpdate: false,
            currentVersion,
            message: 'OTA update available',
          };
        }
      } catch (otaError) {
        console.log('OTA update check failed:', otaError);
        // Continue to check GitHub for native updates
      }

      // 2. Check for Native/APK Updates from GitHub (Android only)
      if (Platform.OS === 'android') {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
            {
              headers: {
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          if (response.ok) {
            const release = await response.json();
            const latestVersion = release.tag_name.replace(/^v/, '');
            
            if (compareVersions(latestVersion, currentVersion) > 0) {
              setChecking(false);
              return {
                hasUpdate: true,
                isOTAUpdate: false,
                isNativeUpdate: true,
                currentVersion,
                latestVersion,
                message: `New version ${latestVersion} available on GitHub`,
              };
            }
          }
        } catch (githubError) {
          console.log('GitHub release check failed:', githubError);
        }
      }

      // No updates found
      if (showAlerts) {
        Alert.alert('Up to Date', `You're running the latest version (${currentVersion}).`);
      }
      
      setChecking(false);
      return {
        hasUpdate: false,
        isOTAUpdate: false,
        isNativeUpdate: false,
        currentVersion,
        message: 'App is up to date',
      };
    } catch (error) {
      console.error('Update check error:', error);
      if (showAlerts) {
        Alert.alert('Error', 'Failed to check for updates. Please try again later.');
      }
      setChecking(false);
      return {
        hasUpdate: false,
        isOTAUpdate: false,
        isNativeUpdate: false,
        currentVersion,
        message: 'Update check failed',
      };
    }
  }, []);

  return {
    checking,
    checkForUpdates,
  };
}

/**
 * Compare two semantic version strings.
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}
