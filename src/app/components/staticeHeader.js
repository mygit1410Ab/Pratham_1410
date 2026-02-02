import { View, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { IMAGES } from '../../res/images';
import { COLORS } from '../../res/colors';
import Icon from '../../utils/icon';
import TextComp from './textComp';
import { width } from '../hooks/responsive';
import { useNavigation } from '@react-navigation/native';
import { SCREEN } from '../layouts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROFILE_IMAGE_BASE_URL } from '../../utils/config';
import { useSelector } from 'react-redux';

const StaticeHeader = ({ headerLabel, showFilterIcon = true, onpressFilter, goToDrawer }) => {
    const navigation = useNavigation()
    const [profileImage, setProfileImage] = useState(null);
    const imageUri = 'https://i.pinimg.com/736x/e8/e6/41/e8e64141f4c0ae39c32f9701ccea9a2e.jpg'
    const usersData = useSelector((state) => state.userData.userData);

    useEffect(() => {
        if (usersData?.image) {
            setProfileImage(`${PROFILE_IMAGE_BASE_URL}${encodeURIComponent(usersData.image)}`);
        } else {
            setProfileImage(null);
        }
    }, [usersData]);

    // console.log('profileImage typeof --->', typeof profileImage, profileImage);
    return (
        <>
            <View style={{ width: width, height: verticalScale(55), alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: !headerLabel ? 1 : 0, borderColor: COLORS.greyOpacity(0.5) }}>
                {headerLabel && (
                    <>
                        <TouchableOpacity onPress={() => { navigation.goBack() }} style={{ backgroundColor: COLORS.secondaryAppColor, height: verticalScale(30), width: verticalScale(30), alignItems: 'center', justifyContent: 'center', borderRadius: 100 }}>
                            <Icon type='AntDesign' name={'arrowleft'} size={23} color={COLORS.white} />
                        </TouchableOpacity>
                    </>
                )}
                <TouchableOpacity

                    onPress={() => { navigation.openDrawer() }}
                    disabled={goToDrawer}
                >
                    <Image source={IMAGES.LOGO} style={{ height: verticalScale(45), width: verticalScale(45), }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { navigation.navigate(SCREEN.SEARCH) }} style={{ flexDirection: 'row', alignItems: 'center', height: verticalScale(34), borderRadius: 100, borderWidth: 1, width: 100, justifyContent: 'space-between', flex: 0.9, paddingHorizontal: moderateScale(5) }}>
                    <TextComp style={{ paddingLeft: 5 }}>Search</TextComp>
                    <Icon name={'search'} type='EvilIcons' size={20} color={COLORS.black} />
                </TouchableOpacity>
                {showFilterIcon && (
                    <TouchableOpacity onPress={onpressFilter} style={{ paddingHorizontal: 5 }}>
                        <Icon name='filter' type='Ionicons' size={24} color={COLORS.black} />
                    </TouchableOpacity>
                )}
            </View>
            {headerLabel && (
                <>
                    <View style={{
                        paddingVertical: verticalScale(6),
                        paddingHorizontal: moderateScale(15),
                        borderBottomWidth: 1,
                        borderColor: COLORS.greyOpacity(0.5),
                        backgroundColor: COLORS.white,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <TextComp style={{ fontSize: scale(22), fontWeight: '600', }}>
                            {headerLabel}
                        </TextComp>
                    </View>
                </>
            )}
        </>
    )
}

export default StaticeHeader