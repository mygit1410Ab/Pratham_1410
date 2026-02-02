import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Image, useColorScheme, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Main from '../stacks/main';
import Auth from '../stacks/auth';
import { darkTheme, lightTheme } from '../res/colors';
import { IMAGES } from '../res/images';
import { height } from '../app/hooks/responsive';
import { loginUser } from '../redux/slices/authSlice';
import { navigationRef } from './NavigationService';

import { handleLogout } from '../utils/handleLogout';
import { hideDeactivationModal } from '../redux/slices/accountStatusSlice';
import AccountDeactivationModal from '../app/components/AccountDeactivationModal';

const Loading = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Image
      source={IMAGES.LOGO_WITH_TEXT}
      style={{ height: height * 0.3, width: height * 0.3 }}
      resizeMode="contain"
    />
  </View>
);

export default function Routes() {
  const scheme = useColorScheme();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  const { showDeactivationModal, is_active } = useSelector(state => state.accountStatus);

  const [isLoading, setIsLoading] = useState(true);
  const theme = useMemo(() => (scheme === 'dark' ? darkTheme : lightTheme), [scheme]);
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const checkLoginStatus = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');

    if (token) {
      dispatch(loginUser());
    }

    await delay(1500); // 👈 wait 3 seconds
    setIsLoading(false);
  }, [dispatch]);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (is_active === false) handleLogout(dispatch, navigationRef);
  }, [is_active]);

  if (isLoading) return <Loading />;

  return (
    <>
      <NavigationContainer theme={theme} ref={navigationRef}>
        {isLoggedIn ? <Main /> : <Auth />}
      </NavigationContainer>

      <AccountDeactivationModal
        visible={showDeactivationModal}
        onClose={() => dispatch(hideDeactivationModal())}
        onLogout={() => handleLogout(dispatch, navigationRef)}
      />
    </>
  );
}
