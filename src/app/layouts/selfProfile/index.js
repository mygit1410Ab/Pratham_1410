import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Keyboard,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import Wrapper from '../../components/wrapper';
import {height, width} from '../../hooks/responsive';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import ButtonComp from '../../components/buttonComp';
import {IMAGES} from '../../../res/images';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {COLORS} from '../../../res/colors';
import {SCREEN} from '..';
import TextInputComp from '../../components/textInputComp';
import TextComp from '../../components/textComp';
import Icon from '../../../utils/icon';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {isIOS} from '../../hooks/platform';
import Toast from 'react-native-simple-toast';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PROFILE_IMAGE_BASE_URL} from '../../../utils/config';
import {useDispatch, useSelector} from 'react-redux';
import {editProfileAction} from '../../../redux/action';
import {setUserData} from '../../../redux/slices/userDataSlice';

const SelfProfile = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const usersData = useSelector(state => state.userData.userData);

  // console.log(`usersData--------->>>>>>>`,usersData);
  // console.log(usersData?.profileImage);

  // Input states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [buttonLoading, setButtonLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Prefill form fields
        setFirstName(usersData.first_name || '');
        setLastName(usersData.last_name || '');
        setEmail(usersData.email || '');
        setMobileNumber(usersData.mobile_number || '');
        setBusinessName(usersData.business_name || '');
        setBusinessType(usersData.business_type || '');
        setGstNumber(usersData.gst_number || '');
        setBusinessAddress(usersData.business_address || '');
        setCity(usersData.city || '');
        setState(usersData.state || '');
        setPostalCode(usersData.postal_code || '');
        // }
      } catch (e) {
        // console.log('Failed to load user data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [{name: SCREEN.DRAWER_HOME}],
        });
        return true; // prevents default back behavior
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  const openGallery = async () => {
    console.log('Opening gallery...');

    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 400,
        cropping: true,
        mediaType: 'photo',
      });

      if (image && image.path) {
        // console.log('Selected image object:', image);
        // console.log('Image path:', image.path);
        setProfileImage(image); // store the full image object
      } else {
        // console.log('No image selected or path missing');
      }
    } catch (err) {
      // console.log('Image picker error:', err);
    }
  };

  const handleBack = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: SCREEN.HOME_TAB}],
      }),
    );
  };

  const handleSave = async () => {
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // If either password or confirm password has data, ensure they match
    if (
      (trimmedPassword || trimmedConfirmPassword) &&
      trimmedPassword !== trimmedConfirmPassword
    ) {
      setError(true);
      return;
    } else {
      setError(false);
    }
    setButtonLoading(true);
    // Start building raw payload
    const rawPayload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      mobile_number: mobileNumber.trim(),
      business_name: businessName.trim(),
      business_type: businessType.trim(),
      gst_number: gstNumber.trim(),
      business_address: businessAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      postal_code: postalCode.trim(),
    };

    // Conditionally add password if it's non-empty and matches confirm password
    // if (trimmedPassword && trimmedPassword === trimmedConfirmPassword) {
    //   rawPayload.password = trimmedPassword;
    // }

    // Filter out empty values
    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([_, v]) => v !== ''),
    );

    if (profileImage) {
      payload.image = {
        uri: profileImage.path,
        name: profileImage.filename || profileImage.path.split('/').pop(), // fallback to filename
        type: profileImage.mime || 'image/jpeg',
      };
    }

    if (Object.keys(payload).length === 0) {
      Toast.show('Please fill at least one field to update.', Toast.LONG);
      return;
    }

    dispatch(
      editProfileAction(payload, async response => {
        setButtonLoading(false);
        if (response?.data?.status) {
          const updatedUserData = response?.data?.data;
          console.log(`Success response: ${JSON.stringify(updatedUserData)}`);

          try {
            dispatch(setUserData(updatedUserData));
            Toast.show('Profile updated successfully!', Toast.SHORT);
            navigation.goBack(); // or navigate to a success screen
          } catch (storageError) {
            console.log('Failed to save updated user data:', storageError);
            Toast.show(
              'Update saved, but failed to store locally.',
              Toast.LONG,
            );
          }
        } else {
          Toast.show('Failed to update profile. Try again later.', Toast.SHORT);
          console.log(`Failure response: ${JSON.stringify(response)}`);
        }
      }),
    );
  };

  if (loading) {
    return (
      // <Wrapper >
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={COLORS.secondaryAppColor} />
        <Text style={{marginTop: 10}}>Loading profile...</Text>
      </View>
      // </Wrapper>
    );
  }

  return (
    <Wrapper
      useBottomInset={true}
      useTopInsets={true}
      safeAreaContainerStyle={{}}
      childrenStyles={{height: isIOS() ? height * 0.9 : height}}>
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
          hitSlop={{left: 30}}
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

        <View style={{width: verticalScale(100), alignSelf: 'center'}}>
          <Image
            source={
              profileImage?.path
                ? {uri: profileImage.path}
                : usersData?.image
                ? {uri: `${PROFILE_IMAGE_BASE_URL}${usersData.image}`}
                : IMAGES.DEFAULT_PROFILE
            }
            style={{
              height: verticalScale(100),
              width: verticalScale(100),
              borderRadius: verticalScale(100) / 2,
              alignSelf: 'center',
              marginTop: height * 0.01,
              marginBottom: height * 0.03,
              borderWidth: 2,
            }}
            resizeMode="cover"
          />
          <View
            style={{position: 'absolute', right: 12, top: verticalScale(82)}}>
            <TouchableOpacity
              onPress={openGallery}
              activeOpacity={0.7}
              style={{backgroundColor: COLORS.white, borderRadius: 100}}>
              <Icon
                type="AntDesign"
                name={'plus'}
                color={COLORS.black}
                size={22}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
          <TextInputComp
            editable={false}
            style={{flex: 0.95}}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={'John'}
            label={'First Name'}
          />
          <View style={{width: moderateScale(8)}} />
          <TextInputComp
            editable={false}
            value={lastName}
            onChangeText={setLastName}
            placeholder={'Doe'}
            label={'Last Name'}
            style={{flex: 0.95}}
          />
        </View>
        <TextInputComp
          editable={false}
          selectTextOnFocus={false}
          value={email}
          onChangeText={setEmail}
          style={{marginTop: verticalScale(12)}}
          placeholder={'Enter your email'}
          label={'E-mail'}
        />
        <TextInputComp
          value={mobileNumber}
          onChangeText={setMobileNumber}
          placeholder={'Mobile Number'}
          label={'Mobile Number'}
          style={{marginTop: verticalScale(12)}}
        />
        <TextInputComp
          editable={false}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder={'Business Name'}
          label={'Business Name'}
          style={{marginTop: verticalScale(12)}}
        />
        <TextInputComp
          editable={false}
          value={businessType}
          onChangeText={setBusinessType}
          placeholder={'Business Type'}
          label={'Business Type'}
          style={{marginTop: verticalScale(12)}}
        />
        <TextInputComp
          editable={false}
          value={gstNumber}
          onChangeText={setGstNumber}
          placeholder={'GST Number'}
          label={'GST Number'}
          style={{marginTop: verticalScale(12)}}
        />
        <TextInputComp
          value={businessAddress}
          onChangeText={setBusinessAddress}
          placeholder={'Business Address'}
          label={'Business Address'}
          style={{marginTop: verticalScale(12)}}
        />
        <TextInputComp
          editable={false}
          value={city}
          onChangeText={setCity}
          placeholder={'City'}
          label={'City'}
          style={{marginTop: verticalScale(12)}}
        />
        <TextInputComp
          editable={false}
          value={state}
          onChangeText={setState}
          placeholder={'State'}
          label={'State'}
          style={{marginTop: verticalScale(12)}}
        />
        <TextInputComp
          editable={false}
          value={postalCode}
          onChangeText={setPostalCode}
          placeholder={'Postal Code'}
          label={'Postal Code'}
          style={{marginTop: verticalScale(12)}}
        />
        {/* <TextInputComp
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          showPasswordToggle={true}
          placeholder={'Enter your password'}
          label={'Password'}
          style={{marginTop: verticalScale(12)}}
        />
        <TextInputComp
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={true}
          showPasswordToggle={true}
          placeholder={'Confirm Password'}
          label={'Confirm Password'}
          style={{marginTop: verticalScale(12)}}
        /> */}
        {error && (
          <TextComp
            style={{
              color: COLORS.red,
              fontSize: scale(10),
            }}>{`Both password should match`}</TextComp>
        )}
        <ButtonComp
          onPress={handleSave}
          loading={buttonLoading}
          title={'Save'}
          buttonStyle={{
            marginTop: verticalScale(40),
            backgroundColor: COLORS.secondaryAppColor,
          }}
          textStyle={{color: COLORS.white}}
        />
        {/* {keyboardVisible && ( */}
        <View style={{height: verticalScale(50)}} />

        {/* )} */}
      </KeyboardAwareScrollView>
    </Wrapper>
  );
};

export default SelfProfile;
