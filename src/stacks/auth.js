import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREEN } from '../app/layouts';
import Signup from '../app/layouts/signup';
import EntryScreen from '../app/layouts/entryScreen';
import Login from '../app/layouts/login';
import VerifyOtp from '../app/layouts/verifyOtp';
import ForgotPassword from '../app/layouts/forgotPassword';
import ChangePassword from '../app/layouts/changePassword';

const Stack = createNativeStackNavigator();
const Auth = () => {
  //
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={SCREEN.ENTERY_SCREEN} component={EntryScreen} />
      <Stack.Screen name={SCREEN.SIGNUP} component={Signup} />
      <Stack.Screen name={SCREEN.LOGIN} component={Login} />
      <Stack.Screen name={SCREEN.VERIFY_OTP} component={VerifyOtp} />
      {/* left to optimezeit */}
      <Stack.Screen name={SCREEN.FORGOT_PASSWORD} component={ForgotPassword} />
      {/* left to optimezeit */}
      <Stack.Screen name={SCREEN.CHANGE_PASSWORD} component={ChangePassword} />
    </Stack.Navigator>
  );
};

export default Auth;
