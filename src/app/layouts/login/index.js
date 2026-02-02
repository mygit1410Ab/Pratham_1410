import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-simple-toast';
import {
  moderateScale,
  scale,
  verticalScale,
} from 'react-native-size-matters';

import Wrapper from '../../components/wrapper';
import ButtonComp from '../../components/buttonComp';
import TextInputComp from '../../components/textInputComp';
import TextComp from '../../components/textComp';
import Icon from '../../../utils/icon';
import { IMAGES } from '../../../res/images';
import { COLORS } from '../../../res/colors';
import { SCREEN } from '..';
import { height, width } from '../../hooks/responsive';
import { isIOS } from '../../hooks/platform';
import { loginUser } from '../../../redux/slices/authSlice';
import { loginAction } from '../../../redux/action';
import { setUserData } from '../../../redux/slices/userDataSlice';
import { getSavedFCMToken } from '../../../services/notifications';
import { ensureFCMToken } from '../../../services/notifications/ensureFcmToken';

const Login = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    email: '',
    password: '',
    errors: {
      email: '',
      password: '',
    },
  });

  const [loading, setLoading] = useState(false);

  /** ✅ Memoized payload to avoid unnecessary recalculations */
  const payload = useMemo(
    () => ({
      email: form.email.trim(),
      password: form.password,
    }),
    [form.email, form.password],
  );

  /** ✅ Form field change handler */
  const handleChange = useCallback((key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
      errors: { ...prev.errors, [key]: '' }, // clear error on typing
    }));
  }, []);

  /** ✅ Validate form fields */
  const validateForm = useCallback(() => {
    let valid = true;
    const errors: Record<string, string> = { email: '', password: '' };

    if (!form.email) {
      errors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = 'Invalid email address';
      valid = false;
    }

    if (!form.password) {
      errors.password = 'Password is required';
      valid = false;
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    if (!valid) {
      setForm(prev => ({ ...prev, errors }));
    }
    return valid;
  }, [form.email, form.password]);

  /** ✅ Store JWT token */
  const storeToken = useCallback(async (jwtToken: string) => {
    try {
      await AsyncStorage.setItem('token', jwtToken);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }, []);

  /** ✅ Handle login */
  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // ✅ Ensure FCM token exists
      const fcm_token = await ensureFCMToken();

      console.log('FCM Token ===>', fcm_token);

      const payloadWithFCM = {
        ...payload,
        fcm_token: fcm_token || '', // backend-safe
        device_info: Platform.OS === 'ios' ? 'ios' : 'android',
      };

      console.log('Login Payload:', payloadWithFCM);

      dispatch(
        loginAction(payloadWithFCM, response => {
          setLoading(false);

          if (response?.data?.status) {
            const userData = response?.data?.data;

            storeToken(userData?.auth_token);
            dispatch(setUserData(userData));
            AsyncStorage.setItem('userData', JSON.stringify(userData));
            dispatch(loginUser());

            Toast.show(
              response?.data?.message || 'Login successful',
              Toast.SHORT
            );
          } else {
            Toast.showWithGravityAndOffset(
              response?.data?.message || 'Login failed. Please try again.',
              Toast.LONG,
              Toast.TOP,
              0,
              160
            );
          }
        })
      );
    } catch (error) {
      setLoading(false);
      console.error('❌ Login Error:', error);

      Toast.showWithGravityAndOffset(
        'Something went wrong. Please try again.',
        Toast.LONG,
        Toast.TOP,
        0,
        160
      );
    }
  }, [dispatch, payload, storeToken, validateForm]);


  const handleForgotPassword = useCallback(() => {
    navigation.navigate(SCREEN.FORGOT_PASSWORD);
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.navigate(SCREEN.ENTERY_SCREEN);
  }, [navigation]);

  return (
    <Wrapper
      useBottomInset
      useTopInsets
      childrenStyles={{ flex: 1 }}
    >

      {/* Back Button */}
      <View
        style={{
          height: verticalScale(50),
          width,
          justifyContent: 'center',
          paddingLeft: moderateScale(15),
        }}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ left: 30 }}
          style={{
            backgroundColor: COLORS.secondaryAppColor,
            height: verticalScale(30),
            width: verticalScale(30),
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon
            name="arrowleft"
            color={COLORS.white}
            size={scale(22)}
            type="AntDesign"
          />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={verticalScale(120)}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: verticalScale(40) }}
      >

        <Image
          source={IMAGES.LOGO_WITH_TEXT}
          style={{
            height: verticalScale(190),
            width: verticalScale(190),
            alignSelf: 'center',
            marginTop: height * 0.13,
            marginBottom: height * 0.02,
          }}
          resizeMode="contain"
        />

        <TextInputComp
          value={form.email}
          onChangeText={text => handleChange('email', text)}
          placeholder="Enter your email"
          label="E-mail"
        />

        {form.errors.email && (
          <TextComp style={{ color: COLORS.red, fontSize: scale(12), marginTop: 4 }}>
            {form.errors.email}
          </TextComp>
        )}

        <TextInputComp
          value={form.password}
          onChangeText={text => handleChange('password', text)}
          secureTextEntry
          showPasswordToggle
          placeholder="Enter your password"
          label="Password"
          style={{ marginTop: verticalScale(12) }}
        />

        {form.errors.password && (
          <TextComp style={{ color: COLORS.red, fontSize: scale(12), marginTop: 4 }}>
            {form.errors.password}
          </TextComp>
        )}

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={{ alignItems: 'flex-end', marginTop: verticalScale(8) }}>
          <TextComp style={{ color: COLORS.blue }}>Forgot Password?</TextComp>
        </TouchableOpacity>

        <ButtonComp
          loading={loading}
          onPress={handleLogin}
          title="Login"
          buttonStyle={{ marginTop: verticalScale(40) }}
          textStyle={{ color: COLORS.white }}
        />
      </KeyboardAwareScrollView>
    </Wrapper>

  );
};

export default Login;
