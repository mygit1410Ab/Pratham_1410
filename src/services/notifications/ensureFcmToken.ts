// services/notifications/ensureFcmToken.ts
import { getSavedFCMToken } from './storage';
import { getFCMToken } from './fcmToken';

export const ensureFCMToken = async (): Promise<string | null> => {
    try {
        // 1️⃣ Try local storage
        let token = await getSavedFCMToken();

        if (token) {
            console.log('✅ Using saved FCM token');
            return token;
        }

        // 2️⃣ Generate new token
        console.log('⚠️ No FCM token found, generating...');
        token = await getFCMToken();

        return token;
    } catch (error) {
        console.error('❌ ensureFCMToken error', error);
        return null;
    }
};
