import React, { memo, useCallback, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Routes from './routes';
import { Provider } from 'react-redux';
import store, { persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { createDefaultChannel, getFCMToken, listenFCMTokenRefresh, registerForegroundHandler, requestNotificationPermission } from './services/notifications';

const Loading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const App = () => {



  const initNotifications = useCallback(async () => {
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        console.log('[Notifications] Permission denied');
        return;
      }
      await createDefaultChannel();
      const token = await getFCMToken();
      if (token) {
        //  Send token to backend if needed
        // api.updateFCMToken(token);
      }
    } catch (error) {
      console.error('[Notifications] Init error', error);
    }
  }, []);

  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;
    let unsubscribeTokenRefresh: (() => void) | undefined;

    initNotifications();

    //  Foreground notifications
    unsubscribeForeground = registerForegroundHandler();


    unsubscribeTokenRefresh = listenFCMTokenRefresh(updatedToken => {
      console.log('[Notifications] Token refreshed:', updatedToken);
      // api.updateFCMToken(updatedToken);
    });

    return () => {
      unsubscribeForeground?.();
      unsubscribeTokenRefresh?.();
    };
  }, [initNotifications]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <PersistGate loading={<Loading />} persistor={persistor}>
          <Routes />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default memo(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


