import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Keyboard,
  Linking,
} from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Wrapper from '../../components/wrapper';
import { height, width } from '../../hooks/responsive';
import { useNavigation } from '@react-navigation/native';
import ButtonComp from '../../components/buttonComp';
import { IMAGES } from '../../../res/images';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { COLORS } from '../../../res/colors';
import { SCREEN } from '..';
import TextInputComp from '../../components/textInputComp';
import TextComp from '../../components/textComp';
import Icon from '../../../utils/icon';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { isIOS } from '../../hooks/platform';
import Toast from 'react-native-simple-toast';
import { useDispatch } from 'react-redux';
import { signupAction } from '../../../redux/action';
import CustomDropdown from '../../components/dropdown';
import { indianStates } from '../../../utils/data';

// GST validation regex
const isValidGSTIN = gst => {
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gst.toUpperCase());
};

const Signup = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Single form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    businessName: '',
    businessType: '',
    gstNumber: '',
    businessAddress: '',
    city: '',
    state: '',
    postalCode: '',
    password: '',
    confirmPassword: '',
  });

  // Errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const updateForm = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' })); // clear error on change
  }, []);

  const validateForm = useCallback(() => {
    let valid = true;
    let newErrors = {};

    Object.entries(form).forEach(([key, value]) => {
      if (!value) {
        newErrors[key] = `${key.replace(/([A-Z])/g, ' $1')} is required`;
        valid = false;
      }
    });

    // Password length validation
    if (form.password && form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    // Password match validation
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    // GST validation
    if (
      form.gstNumber &&
      (form.gstNumber.length !== 15 || !isValidGSTIN(form.gstNumber))
    ) {
      newErrors.gstNumber = 'Invalid GST Number';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form]);


  const handleRegister = useCallback(() => {
    if (!validateForm()) {
      Toast.show('Please fix errors before submitting');
      return;
    }

    const payload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim(),
      mobile_number: Number(form.mobileNumber.trim()),
      business_name: form.businessName.trim(),
      business_type: form.businessType.trim(),
      gst_number: form.gstNumber.trim(),
      business_address: form.businessAddress.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: Number(form.postalCode.trim()),
      password: form.password.trim(),
      confirmPassword: form.confirmPassword.trim(),
    };

    setLoading(true);
    dispatch(
      signupAction(payload, response => {
        setLoading(false);
        if (response?.data?.status) {
          Toast.show(
            response?.data?.message || 'OTP sent to registered email!',
            Toast.SHORT,
          );
          navigation.navigate(SCREEN.VERIFY_OTP, {
            email: payload.email,
            comingFrom: SCREEN.SIGNUP,
            payload
          });
        } else {
          Toast.show(response?.data?.message || 'Registration failed');
        }
      }),
    );
  }, [form, validateForm, dispatch, navigation]);

  const businessTypes = useMemo(
    () => [
      { label: 'Wholesale', value: 'Wholesale' },
      { label: 'Retail', value: 'Retail' },
    ],
    [],
  );

  return (
    <Wrapper
      useBottomInset
      useTopInsets
      childrenStyles={{ height: isIOS() ? height * 0.9 : height }}>

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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}>

        <Image
          source={IMAGES.LOGO_WITH_TEXT}
          style={{
            height: verticalScale(190),
            width: verticalScale(190),
            alignSelf: 'center',
            marginTop: height * 0.01,
            marginBottom: height * 0.02,
          }}
          resizeMode="contain"
        />

        {/* Name Fields */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          <View style={{ flex: 0.95 }}>
            <TextInputComp
              value={form.firstName}
              onChangeText={val => updateForm('firstName', val)}
              placeholder="John"
              label="First Name"
            />
            {errors.firstName && (
              <Text style={{ color: COLORS.red, fontSize: scale(11), marginTop: scale(2) }}>{errors.firstName}</Text>
            )}
          </View>
          <View style={{ width: moderateScale(8) }} />
          <View style={{ flex: 0.95 }}>
            <TextInputComp
              value={form.lastName}
              onChangeText={val => updateForm('lastName', val)}
              placeholder="Doe"
              label="Last Name"
            />
            {errors.lastName && (
              <Text style={{ color: COLORS.red, fontSize: scale(11), marginTop: scale(2) }}>{errors.lastName}</Text>
            )}
          </View>
        </View>

        {/* Rest of the fields */}
        {[
          { field: 'email', placeholder: 'Enter your email', label: 'E-mail' },
          { field: 'mobileNumber', placeholder: 'Mobile Number', label: 'Mobile Number', keyboardType: 'phone-pad' },
          { field: 'businessName', placeholder: 'Business Name', label: 'Business Name' },
          { field: 'gstNumber', placeholder: 'GST Number', label: 'GST Number' },
          { field: 'businessAddress', placeholder: 'Business Address', label: 'Business Address' },
          { field: 'city', placeholder: 'City', label: 'City' },
          { field: 'postalCode', placeholder: 'Postal Code', label: 'Postal Code', keyboardType: 'phone-pad' },
          { field: 'password', placeholder: 'Enter your password', label: 'Password', secureTextEntry: true },
          { field: 'confirmPassword', placeholder: 'Confirm Password', label: 'Confirm Password', secureTextEntry: true },
        ].map(({ field, ...props }) => (
          <View key={field} style={{ marginTop: verticalScale(12) }}>
            <TextInputComp
              value={form[field]}
              onChangeText={val =>
                updateForm(
                  field,
                  field === 'gstNumber' ? val.toUpperCase() : val
                )
              }
              {...props}
              showPasswordToggle={props.secureTextEntry}
              autoCapitalize={field === 'gstNumber' ? 'characters' : 'none'}
            />

            {errors[field] && (
              <Text style={{ color: COLORS.red, fontSize: scale(11), marginTop: scale(2) }}>
                {errors[field]}
              </Text>
            )}
          </View>
        ))}

        {/* Dropdowns */}
        <CustomDropdown
          items={businessTypes}
          selectedValue={businessTypes.find(s => s.value === form.businessType)}
          onValueChange={item => updateForm('businessType', item.value)}
          placeholder="Select Business Type"
          label="Business Type"
          containerStyle={{ marginTop: verticalScale(12) }}
        />
        {errors.businessType && (
          <Text style={{ color: COLORS.red, fontSize: 12 }}>{errors.businessType}</Text>
        )}

        <CustomDropdown
          items={indianStates}
          selectedValue={indianStates.find(s => s.value === form.state)}
          onValueChange={item => updateForm('state', item.value)}
          placeholder="Select your state"
          label="State"
          containerStyle={{ marginTop: verticalScale(12) }}
        />
        {errors.state && (
          <Text style={{ color: COLORS.red, fontSize: 12 }}>{errors.state}</Text>
        )}

        <ButtonComp
          loading={loading}
          onPress={handleRegister}
          title="Register"
          buttonStyle={{ marginTop: verticalScale(40) }}
          textStyle={{ color: COLORS.white }}
        />



        <TextComp
          style={{
            fontSize: scale(11),
            textAlign: 'center',
            marginTop: verticalScale(8),
            marginBottom: verticalScale(30),
            width: width * 0.8,
            left: 20
          }}
        >
          By continuing, you agree to our{' '}
          <Text
            onPress={() =>
              Linking.openURL(
                'https://test.bharatechmedia.com/view_policy1.php?type=terms_conditions'
              )
            }
            style={{
              color: COLORS.blue,
              fontWeight: '700',
              fontSize: scale(12),
              textDecorationLine: 'underline',
            }}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            onPress={() =>
              Linking.openURL(
                'https://test.bharatechmedia.com/view_policy1.php?type=privacy'
              )
            }
            style={{
              color: COLORS.blue,
              fontWeight: '700',
              fontSize: scale(12),
              textDecorationLine: 'underline',
            }}
          >
            Privacy Policy
          </Text>
        </TextComp>



        <View style={{ height: verticalScale(80) }} />
      </KeyboardAwareScrollView>
    </Wrapper>
  );
};

export default Signup;
