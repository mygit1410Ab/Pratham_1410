import { View, Text, Image, TouchableOpacity, Keyboard, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import Wrapper from '../../components/wrapper'
import { height, width } from '../../hooks/responsive'
import { CommonActions, useNavigation, useRoute, useTheme } from '@react-navigation/native'
import ButtonComp from '../../components/buttonComp'
import Toast from "react-native-simple-toast";
import { moderateScale, scale, verticalScale } from 'react-native-size-matters'
import { COLORS } from '../../../res/colors'
import { SCREEN } from '..'
import TextInputComp from '../../components/textInputComp'
import TextComp from '../../components/textComp'
import Icon from '../../../utils/icon'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { isIOS } from '../../hooks/platform'
import { useDispatch } from 'react-redux'
import { resetPasswordAction } from '../../../redux/action'

const ChangePassword = () => {
    const navigation = useNavigation()
    const route = useRoute();
    const dispatch = useDispatch()
    const email = route?.params?.email || 'example@gmail.com';
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleBack = () => {
        navigation.goBack()
    }

    const handleReset = () => {

        setError('')

        if (!password || !confirmPassword) {
            setError('Both fields are required')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        const payload = {
            email:email,
            new_password:password
        }
        setLoading(true)

        dispatch(resetPasswordAction(payload, (response) => {
            setLoading(false)
            if (response?.data?.status) {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: SCREEN.LOGIN }], // or whatever your login screen name is
                    })

                );
                Toast.show(`${response?.data?.message}` || 'Password change successfully! Please Login', Toast.SHORT);
            } else {
                Toast.show(response?.data?.message || 'password change failed', Toast.SHORT);
                // console.log(`rejecteddddd`, response.data);
                Alert.alert(response?.data?.message)
            }
        }))


    };
    return (
        <Wrapper useBottomInset={true} useTopInsets={true} safeAreaContainerStyle={{}} childrenStyles={{ height: isIOS() ? height * 0.9 : height }}>
            <View style={{ height: verticalScale(50), width: width, alignSelf: 'center', justifyContent: 'center', paddingLeft: moderateScale(15) }}>
                <TouchableOpacity onPress={handleBack} hitSlop={{ left: 30 }} style={{ backgroundColor: COLORS.secondaryAppColor, height: verticalScale(30), width: verticalScale(30), borderRadius: 100, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={'arrowleft'} color={COLORS.white} size={scale(22)} type='AntDesign' />
                </TouchableOpacity>
            </View>
            <KeyboardAwareScrollView
                enableOnAndroid
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    flexGrow: 1,
                }} >
                {/* <Header/> */}
                <View style={{ marginTop: height * 0.01 }}>
                    <TextComp style={{ fontSize: scale(30), fontWeight: '700', textAlign: 'center' }}>Create New Password</TextComp>
                    <TextComp style={{ marginTop: scale(8), fontSize: scale(13), textAlign: 'center' }}>
                        {` Please enter and confirm your new password \n You will need to login after you reset.`}
                    </TextComp>
                </View>
                <TextInputComp showPasswordToggle
                    style={{ marginTop: verticalScale(25) }}
                    placeholder={'Password'}
                    label={'Password'}
                    value={password}
                    onChangeText={setPassword} />

                {/* <TextComp style={{ fontSize: scale(11), marginLeft: 5, marginTop: 2 }}>{`Must contain 8 characters`}</TextComp> */}
                <TextInputComp
                    showPasswordToggle
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={{ marginTop: verticalScale(25) }}
                    placeholder={'Confirm Password'}
                    label={'Confirm Password'} />
                {error ? (
                    <TextComp style={{ color: COLORS.red, marginTop: scale(10), textAlign: 'center' }}>{error}</TextComp>
                ) : null}
                <ButtonComp
                    loading={loading}
                    onPress={handleReset}
                    title={'Change password'} buttonStyle={{ marginTop: verticalScale(40), position: 'absolute', bottom: verticalScale(50), width: width * 0.89 }} textStyle={{ color: COLORS.white }} />
            </KeyboardAwareScrollView>
        </Wrapper>
    )
}

export default ChangePassword