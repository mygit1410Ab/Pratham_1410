import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { saveFCMToken, getSavedFCMToken } from './storage';

export const getFCMToken = async (): Promise<string | null> => {
    try {
        if (Platform.OS === 'ios') {
            await messaging().registerDeviceForRemoteMessages();
        }

        const token = await messaging().getToken();
        if (!token) return null;

        const storedToken = await getSavedFCMToken();

        // ✅ Save only if changed
        if (storedToken !== token) {
            await saveFCMToken(token);
            console.log('✅ FCM Token saved:', token);
        }

        return token;
    } catch (error) {
        console.error('❌ FCM Token Error:', error);
        return null;
    }
};

export const listenFCMTokenRefresh = (
    onRefresh?: (token: string) => void
) => {
    return messaging().onTokenRefresh(async token => {
        await saveFCMToken(token);
        console.log('🔄 FCM Token refreshed & saved:', token);

        onRefresh?.(token);
    });
};
