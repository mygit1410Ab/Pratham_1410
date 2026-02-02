import { View, TouchableOpacity, Keyboard, Alert } from 'react-native';
import React, { useState } from 'react';
import Wrapper from '../../components/wrapper';
import { height, width } from '../../hooks/responsive';
import { useNavigation, useTheme } from '@react-navigation/native';
import ButtonComp from '../../components/buttonComp';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { COLORS } from '../../../res/colors';
import TextInputComp from '../../components/textInputComp';
import TextComp from '../../components/textComp';
import Icon from '../../../utils/icon';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { isIOS } from '../../hooks/platform';
import { useDispatch } from 'react-redux';
import { requestForgetPasswordAction } from '../../../redux/action';
import Toast from 'react-native-simple-toast';
import { SCREEN } from '..';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleVerify = () => {
    const payload = { email };
    if (!email) {
      Toast.show('Please enter your email.');
      return;
    }
    setLoading(true);
    dispatch(
      requestForgetPasswordAction(payload, response => {
        if (response?.data?.status) {
          setLoading(false);
          Toast.show('An otp set to your email!', Toast.SHORT);
          navigation.navigate(SCREEN.VERIFY_OTP, { email: email, comingFrom: SCREEN.FORGOT_PASSWORD, payload });
        } else {
          setLoading(false);
          Alert.alert(response?.data?.message);
        }
      }),
    );
    // navigation.navigate(SCREEN.VERIFY_OTP)
  };
  return (
    <Wrapper
      useBottomInset={true}
      useTopInsets={true}
      safeAreaContainerStyle={{}}
      childrenStyles={{ height: isIOS() ? height * 0.9 : height }}>
      <View
        style={{
          height: verticalScale(50),
          width: width,
          alignSelf: 'center',
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
            name={'arrowleft'}
            color={COLORS.white}
            size={scale(22)}
            type="AntDesign"
          />
        </TouchableOpacity>
      </View>
      <KeyboardAwareScrollView
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
        }}>
        {/* <Header/> */}
        <View style={{ marginTop: height * 0.01 }}>
          <TextComp
            style={{
              fontSize: scale(30),
              fontWeight: '700',
              textAlign: 'center',
            }}>
            Forgot Password
          </TextComp>
          <TextComp
            style={{
              marginTop: scale(8),
              fontSize: scale(13),
              textAlign: 'center',
            }}>
            {` No worries! Enter you email below and we will \n send a Otp to reset your password.`}
          </TextComp>
        </View>
        <TextInputComp
          value={email}
          onChangeText={setEmail}
          style={{ marginTop: verticalScale(25) }}
          placeholder={'Enter your email'}
          label={'Email'}
        />
        <ButtonComp
          loading={loading}
          onPress={handleVerify}
          title={'Send Reset Instruction'}
          buttonStyle={{
            marginTop: verticalScale(30),
            width: width * 0.89,
          }}
          textStyle={{ color: COLORS.white }}
        />
      </KeyboardAwareScrollView>
    </Wrapper>
  );
};

export default ForgotPassword;
