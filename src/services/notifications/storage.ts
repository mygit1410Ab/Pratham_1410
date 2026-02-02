import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = '@fcm_token';

export const saveFCMToken = async (token: string) => {
    try {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    } catch (e) {
        console.error('❌ Failed to save FCM token', e);
    }
};

export const getSavedFCMToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(FCM_TOKEN_KEY);
    } catch (e) {
        return null;
    }
};

export const removeFCMToken = async () => {
    try {
        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    } catch (e) { }
};
