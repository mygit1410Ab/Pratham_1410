import React, { useCallback, useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Wrapper from '../../components/wrapper';
import { height } from '../../hooks/responsive';
import { useNavigation } from '@react-navigation/native';
import ButtonComp from '../../components/buttonComp';
import { IMAGES } from '../../../res/images';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { COLORS } from '../../../res/colors';
import { isIOS } from '../../hooks/platform';
import { SCREEN } from '..';

const EntryScreen = () => {
  const navigation = useNavigation();

  // ✅ useCallback for stable handlers
  const handleRegister = useCallback(() => {
    navigation.navigate(SCREEN.SIGNUP);
  }, [navigation]);

  const handleLogin = useCallback(() => {
    navigation.navigate(SCREEN.LOGIN);
  }, [navigation]);

  // ✅ useMemo for computed values (avoid recalculation)
  const logoStyle = useMemo(
    () => [
      styles.logo,
      { marginTop: height * 0.3 }, // dynamic prop
    ],
    []
  );

  const buttonContainerStyle = useMemo(
    () => [
      styles.buttonContainer,
      { bottom: isIOS() ? verticalScale(110) : verticalScale(70) }, // platform-specific
    ],
    []
  );

  return (
    <Wrapper useBottomInset safeAreaContainerStyle={{}} childrenStyles={{ height }}>
      <Image
        source={IMAGES.LOGO_WITH_TEXT}
        style={logoStyle}
        resizeMode="contain"
      />

      <View style={buttonContainerStyle}>
        <ButtonComp
          onPress={handleRegister}
          title="Register"
          buttonStyle={styles.registerButton}
          textStyle={styles.registerText}
        />
        <View style={styles.spacer} />
        <ButtonComp
          onPress={handleLogin}
          title="Login"
          buttonStyle={styles.loginButton}
          textStyle={styles.loginText}
        />
      </View>
    </Wrapper>
  );
};

export default EntryScreen;

const styles = StyleSheet.create({
  logo: {
    height: verticalScale(170),
    width: verticalScale(170),
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    position: 'absolute',
  },
  registerButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
  },
  registerText: {
    color: COLORS.primaryTextColor,
  },
  loginButton: {
    flex: 1,
    backgroundColor: COLORS.primaryAppColor, // fallback for clarity
  },
  loginText: {
    color: COLORS.white,
  },
  spacer: {
    width: moderateScale(20),
  },
});
