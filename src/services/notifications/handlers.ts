import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

export const createDefaultChannel = async () => {
    await notifee.createChannel({
        id: 'default',
        name: 'Default Notifications',
        importance: AndroidImportance.HIGH,
    });

    console.log('✅ Default notification channel created');
};

export const registerForegroundHandler = () => {
    return messaging().onMessage(async remoteMessage => {
        console.log('📩 Foreground FCM Message Received:', remoteMessage);

        await notifee.displayNotification({
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            android: {
                channelId: 'default',
            },
        });
    });
};

export const registerBackgroundHandler = () => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('📩 Background FCM Message Received:', remoteMessage);

        await notifee.displayNotification({
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            android: {
                channelId: 'default',
            },
        });
    });
};
