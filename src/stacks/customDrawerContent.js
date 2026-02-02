import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { moderateScale, scale } from 'react-native-size-matters';
import { COLORS } from '../res/colors';
import Icon from '../utils/icon';
import TextComp from '../app/components/textComp';
import { GABRITO_MEDIUM } from '../../assets/fonts';
import { SCREEN } from '../app/layouts';
import { useDispatch, useSelector } from 'react-redux';
import { IMAGES } from '../res/images';
import { PROFILE_IMAGE_BASE_URL } from '../utils/config';
import PriceToggleButton from '../app/components/PriceToggleButton';
import { handleLogout } from '../utils/handleLogout';
import { useNavigation } from '@react-navigation/native';
import { width } from '../app/hooks/responsive';

const drawerItems = [
  {
    label: 'Home',
    screen: SCREEN.DRAWER_HOME,
    icon: 'home',
    iconType: 'Feather',
  },
  {
    label: 'Shop by categories',
    screen: SCREEN.CATEGORIES,
    icon: 'grid',
    iconType: 'Feather',
  },
  {
    label: 'My Orders',
    screen: SCREEN.MY_ORDERS,
    icon: 'package',
    iconType: 'Feather',
  },
  {
    label: 'Favourites',
    screen: SCREEN.FAVOURITES,
    icon: 'heart-outline',
    iconType: 'MaterialCommunityIcons',
  },
  {
    label: 'Notifications',
    screen: SCREEN.NOTIFICATIONS,
    icon: 'notifications-outline',
    iconType: 'Ionicons',
  },
  {
    label: 'Ledger Statement',
    screen: SCREEN.LEDGER_STATEMENT,
    icon: 'notebook-outline',
    iconType: 'MaterialCommunityIcons',
  },
  {
    label: 'Pending Bills Report',
    screen: SCREEN.PENDING_BILLS,
    icon: 'credit-card',
    iconType: 'Feather',
  },
  {
    label: 'Privacy',
    screen: SCREEN.PRIVACY,
    icon: 'privacy-tip',
    iconType: 'MaterialIcons',
  },
  {
    label: 'About Us',
    screen: SCREEN.ABOUT_US,
    icon: 'account-box-outline',
    iconType: 'MaterialCommunityIcons',
  },
  {
    label: 'Payment Terms',
    screen: SCREEN.PAYMENT_TERMS,
    icon: 'file-document-outline',
    iconType: 'MaterialCommunityIcons',
  },
  {
    label: 'Terms and Conditions',
    screen: SCREEN.TERMS_AND_CONDITION,
    icon: 'file-document-edit-outline',
    iconType: 'MaterialCommunityIcons',
  },
  {
    label: 'Contact Us',
    screen: SCREEN.CONTACT_US,
    icon: 'phone-outline',
    iconType: 'MaterialCommunityIcons',
  },
];

const CustomDrawerContent = props => {
  const navigation = useNavigation()
  const dispatch = useDispatch();
  const usersData = useSelector(state => state.userData.userData);


  const userData = {
    image: usersData?.image || null,
    businessName: usersData?.business_name || 'Business Name',
    phone: usersData?.mobile_number || '+91 9876543210',
    customerId: usersData?.id || '123456',
  };

  const getProfileImage = (img) => {
    if (!img) return IMAGES.DEFAULT_PROFILE;

    if (img.startsWith('http')) return { uri: img };

    return { uri: `data:image/jpeg;base64,${img}` };
  };



  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DrawerContentScrollView
        showsVerticalScrollIndicator={false}
        {...props}
        contentContainerStyle={{ flexGrow: 1 }}>
        {/* Top Profile Section */}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.secondaryAppColor,
            alignSelf: 'flex-end',
            borderRadius: 100,
            padding: scale(3),
          }}
          onPress={() => props.navigation.closeDrawer()}>
          <Icon name="x" type="Feather" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => props.navigation.navigate(SCREEN.SELF_PROFILE)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            paddingVertical: scale(5),
          }}>
          {/* <View style={{  flexDirection: 'row',alignItems:'center'}}> */}
          <Image
            source={getProfileImage(userData?.image)}
            style={{ width: 60, height: 60, borderRadius: 30 }}
          />
          <View style={{ paddingRight: moderateScale(30), width: "70%" }}>
            <TextComp
              style={{ fontSize: scale(14), fontFamily: GABRITO_MEDIUM, width: '100%' }}>
              {userData.businessName}
            </TextComp>
            <TextComp style={{ fontSize: scale(12), color: COLORS.gray }}>
              Customer ID:{userData.customerId}
            </TextComp>
            <TextComp style={{ fontSize: scale(12), color: COLORS.gray }}>
              {userData.phone}
            </TextComp>
          </View>
          {/* </View> */}
          <View style={{}}>
            <Icon name="caretright" type="AntDesign" size={16} />
          </View>
        </TouchableOpacity>

        {/* Drawer Items */}
        <View style={{ marginTop: scale(10) }}>
          {drawerItems.map((item, index) => (
            <DrawerItem
              key={index}
              label={({ color, focused }) => (
                <TextComp
                  allowFontScaling={false}
                  style={{
                    fontSize: scale(14),
                    fontFamily: GABRITO_MEDIUM,
                    paddingVertical: 0,
                    marginVertical: 0,
                    color,
                  }}>
                  {item.label}
                </TextComp>
              )}
              onPress={() => {
                props.navigation.navigate(item.screen);
              }}
              icon={({ color }) => (
                <Icon
                  name={item.icon}
                  type={item.iconType}
                  size={20}
                  color={color}
                />
              )}
              style={{
                backgroundColor:
                  props.state.routeNames[props.state.index] === item.screen
                    ? COLORS.primaryAppColorOpacity(0.3)
                    : 'transparent',
                marginHorizontal: scale(4),
                borderRadius: 8,
              }}
            />
          ))}
        </View>
        <PriceToggleButton />
        <View style={{ padding: scale(10), marginTop: 'auto' }}>
          <TouchableOpacity
            onPress={() => handleLogout(dispatch, navigation)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.secondaryAppColor,
              paddingVertical: scale(10),
              paddingHorizontal: scale(15),
              borderRadius: 8,
            }}>
            <Icon
              name="log-out"
              type="Feather"
              size={18}
              color={COLORS.white}
            />
            <TextComp
              style={{
                fontSize: scale(14),
                color: COLORS.white,
                marginLeft: scale(10),
                fontFamily: GABRITO_MEDIUM,
              }}>
              Logout
            </TextComp>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
};

export default CustomDrawerContent;


