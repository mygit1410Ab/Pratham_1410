import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Wrapper from '../../components/wrapper';
import { height, width } from '../../hooks/responsive';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import ButtonComp from '../../components/buttonComp';
import { IMAGES } from '../../../res/images';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { COLORS } from '../../../res/colors';
import { SCREEN } from '..';
import TextInputComp from '../../components/textInputComp';
import TextComp from '../../components/textComp';
import Icon from '../../../utils/icon';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-simple-toast';
import { useDispatch } from 'react-redux';
import {
  requestForgetPasswordAction,
  signupAction,
  verifyEmailAction,
  verifyForgetPasswordOtpAction,
} from '../../../redux/action';

const VerifyOtp = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { email = 'example@gmail.com', payload = {}, comingFrom = SCREEN.SIGNUP } = route.params || {};

  // Single state object
  const [form, setForm] = useState({ otp: '' });
  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(59);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const showResendLine = useMemo(() => timeLeft <= 0, [timeLeft]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const updateForm = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const validateForm = useCallback(() => {
    let valid = true;
    let newErrors = {};

    if (!form.otp) {
      newErrors.otp = 'OTP is required';
      valid = false;
    } else if (form.otp.length !== 4) {
      newErrors.otp = 'Please enter a 4-digit OTP';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form.otp]);

  const handleResendCode = useCallback(() => {
    setTimeLeft(59);

    if (comingFrom === SCREEN.FORGOT_PASSWORD) {
      dispatch(requestForgetPasswordAction(payload, response => {
        if (response?.data?.status) {
          Toast.show('OTP sent to your email!', Toast.SHORT);
        } else {
          Toast.show(response?.data?.message, Toast.SHORT);
        }
      }));
    } else {
      dispatch(signupAction(payload, response => {
        if (response?.data?.status) {
          Toast.show(response?.data?.message || 'OTP sent to registered email!', Toast.SHORT);
        } else {
          Toast.show(response?.data?.message || 'Registration failed', Toast.SHORT);
        }
      }));
    }
  }, [comingFrom, dispatch, payload]);

  const handleVerify = useCallback(() => {
    if (!validateForm()) {
      Toast.show('Please fix errors before submitting');
      return;
    }

    const verifyPayload = { email, otp: form.otp };
    setLoading(true);

    if (comingFrom === SCREEN.SIGNUP) {
      dispatch(verifyEmailAction(verifyPayload, response => {
        setLoading(false);
        if (response?.data?.status) {
          setModalVisible(true);
        } else {
          Toast.show(response?.data?.message || 'Verification failed');
        }
      }));
    } else if (comingFrom === SCREEN.FORGOT_PASSWORD) {
      dispatch(verifyForgetPasswordOtpAction(verifyPayload, response => {
        setLoading(false);
        if (response?.data?.status) {
          navigation.navigate(SCREEN.CHANGE_PASSWORD, { email });
          Toast.show(`${response?.data?.message}`, Toast.SHORT);
        } else {
          Toast.show(response?.data?.message || 'OTP verification failed');
        }
      }));
    }
  }, [form.otp, validateForm, comingFrom, email, navigation, dispatch]);

  const handleOkPress = useCallback(() => {
    setModalVisible(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: SCREEN.LOGIN }],
      }),
    );
  }, [navigation]);

  const titleText = useMemo(() =>
    comingFrom === SCREEN.FORGOT_PASSWORD ? "Verify OTP" : "Verify Account",
    [comingFrom]
  );

  const buttonText = useMemo(() =>
    comingFrom === SCREEN.FORGOT_PASSWORD ? "Reset Password" : "Verify Account",
    [comingFrom]
  );

  const messageText = useMemo(() =>
    comingFrom === SCREEN.FORGOT_PASSWORD
      ? "Enter the OTP to reset your password."
      : "Enter the OTP to verify your account.",
    [comingFrom]
  );

  return (
    <Wrapper useBottomInset useTopInsets childrenStyles={{ flex: 1 }}>
      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingBottom: verticalScale(40),
        }}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
        showsVerticalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={{
            height: verticalScale(50),
            width,
            justifyContent: 'center'
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

          {/* Logo */}
          <Image
            source={IMAGES.LOGO_WITH_TEXT}
            style={{
              height: verticalScale(190),
              width: verticalScale(190),
              alignSelf: 'center',
              marginTop: height * 0.01,
            }}
            resizeMode="contain"
          />

          {/* Title */}
          <TextComp
            style={{
              fontSize: scale(30),
              fontWeight: '700',
              textAlign: 'center'
            }}>
            {titleText}
          </TextComp>

          {/* Message */}
          <TextComp
            style={{
              marginTop: scale(8),
              fontSize: scale(13),
              textAlign: 'center',
            }}
          >
            OTP has been sent to{' '}
            <TextComp style={{ fontWeight: '700', fontSize: scale(13) }}>
              {`${email}.\n`}
            </TextComp>
            {messageText}
          </TextComp>

          {/* OTP Input */}
          <View style={{ marginTop: verticalScale(25) }}>
            <TextInputComp
              value={form.otp}
              onChangeText={val => updateForm('otp', val)}
              keyboardType="numeric"
              maxLength={4}
              placeholder="4 Digit Code"
              label="Enter OTP"
            />
            {errors.otp && (
              <Text style={{ color: COLORS.red, fontSize: 12, marginTop: 4 }}>
                {errors.otp}
              </Text>
            )}
          </View>

          {/* Resend Timer/Link */}
          <View style={{ marginTop: verticalScale(16) }}>
            {showResendLine ? (
              <TextComp style={{ fontSize: scale(13), textAlign: 'center' }}>
                Didn't Receive Code?{' '}
                <TextComp
                  onPress={handleResendCode}
                  style={{
                    color: `rgba(148, 163, 184, 1)`,
                    fontWeight: '700',
                    fontSize: scale(13),
                    textDecorationLine: 'underline',
                    textDecorationColor: `rgba(148, 163, 184, 1)`,
                  }}
                >
                  Resend Code
                </TextComp>
              </TextComp>
            ) : (
              <TextComp
                style={{
                  fontSize: scale(13),
                  textAlign: 'center',
                  marginTop: verticalScale(10),
                }}>
                Resend Code in {formatTime}
              </TextComp>
            )}
          </View>
        </View>

        {/* Button */}
        <View style={{ marginTop: verticalScale(20), alignItems: 'center' }}>
          <ButtonComp
            loading={loading}
            onPress={handleVerify}
            title={buttonText}
            buttonStyle={{ width: width * 0.9 }}
            textStyle={{ color: COLORS.white }}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Success Modal */}
      {modalVisible && (
        <View
          style={{
            position: 'absolute',
            height,
            width,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            paddingHorizontal: scale(20),
            alignSelf: 'center',
          }}>
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: scale(10),
              padding: scale(15),
              maxHeight: height * 0.75,
            }}>
            <TextComp
              style={{
                textAlign: 'center',
                fontSize: scale(18),
                marginBottom: verticalScale(20),
              }}>
              Your business has been registered successfully. Please wait for
              your profile verification.
            </TextComp>
            <ButtonComp
              onPress={handleOkPress}
              title="OK"
              textStyle={{ fontSize: scale(20), color: COLORS.white }}
            />
          </View>
        </View>
      )}
    </Wrapper>
  );
};

export default VerifyOtp;