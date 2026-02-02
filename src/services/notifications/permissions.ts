import { Platform, PermissionsAndroid } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

/* ===============================
   ANDROID 13+ Permission
================================ */
export const requestAndroidPermission = async (): Promise<boolean> => {
    if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
};

/* ===============================
   iOS Permission
================================ */
export const requestIOSPermission = async (): Promise<boolean> => {
    const settings = await notifee.requestPermission();

    return (
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
};

/* ===============================
   MAIN HANDLER
================================ */
export const requestNotificationPermission = async (): Promise<boolean> => {
    return Platform.OS === 'android'
        ? requestAndroidPermission()
        : requestIOSPermission();
};
