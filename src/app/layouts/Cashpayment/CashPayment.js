import React, {useState} from 'react';
import {Image, StyleSheet, TouchableOpacity, View, Alert} from 'react-native';
import Wrapper from '../../components/wrapper';
import {width} from '../../hooks/responsive';
import {scale, verticalScale} from 'react-native-size-matters';
import Icon from '../../../utils/icon';
import {useNavigation} from '@react-navigation/native';
import {COLORS} from '../../../res/colors';
import TextComp from '../../components/textComp';
import {IMAGES} from '../../../res/images';
import {GABRITO_MEDIUM} from '../../../../assets/fonts';

const ImageContainer = ({source}) => (
  <Image source={source} style={styles.bankImage} resizeMode="contain" />
);

const CashPayment = () => {
  const navigation = useNavigation();
  const [paymentMethod, setPaymentMethod] = useState('');

  const handleUPISelection = () => {
    setPaymentMethod('upi');
  };

  const handleCODSelection = () => {
    setPaymentMethod(prev => (prev === 'cod' ? '' : 'cod'));
  };

  const handlePayNow = () => {
    if (!paymentMethod) {
      Alert.alert('Payment Error', 'Please select a payment method.');
      return;
    }
    Alert.alert('Payment', `Selected: ${paymentMethod.toUpperCase()}`);
  };

  return (
    <Wrapper useBottomInset={false} childrenStyles={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Icon
            type="AntDesign"
            name="arrowleft"
            size={23}
            color={COLORS.white}
          />
        </TouchableOpacity>
        <TextComp style={styles.paymentText}>Payment</TextComp>
      </View>

      {/* UPI Option */}
      <TouchableOpacity onPress={handleUPISelection} style={styles.paymentBtn}>
        <Image
          source={IMAGES.phone_Pay}
          style={styles.paymentIcon}
          resizeMode="contain"
        />
        <View style={styles.titleCart}>
          <View>
            <TextComp style={styles.upiText}>UPI</TextComp>
            <TextComp style={styles.payBtnTitle}>PhonePe</TextComp>
          </View>
          <View style={styles.radioBtnOuter}>
            <View
              style={[
                styles.radioBtnInner,
                {
                  backgroundColor:
                    paymentMethod === 'upi' ? COLORS.black : COLORS.white,
                  borderColor:
                    paymentMethod !== 'upi' ? COLORS.black : COLORS.white,
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Net Banking Logos */}
      <TextComp style={styles.sectionTitle}>Net Banking</TextComp>
      <View style={styles.bankImgCard}>
        {[
          IMAGES.bk_1,
          IMAGES.bk_2,
          IMAGES.bk_3,
          IMAGES.bk_4,
          IMAGES.bk_5,
          IMAGES.bk_6,
        ].map((img, idx) => (
          <ImageContainer key={idx} source={img} />
        ))}
      </View>

      {/* Cash on Delivery Option */}
      <View style={styles.codCard}>
        <TouchableOpacity onPress={handleCODSelection} style={styles.checkBox}>
          {paymentMethod === 'cod' && (
            <Image
              source={IMAGES.check}
              style={styles.checkIcon}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
        <TextComp style={styles.codText}>Pay on delivery</TextComp>
      </View>

      {/* Pay Button */}
      <TouchableOpacity style={styles.payNowBtn} onPress={handlePayNow}>
        <TextComp style={styles.payNowText}>₹2000 Pay Now</TextComp>
      </TouchableOpacity>
    </Wrapper>
  );
};

export default CashPayment;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'white',
    flex: 1,
    width,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: verticalScale(55),
  },
  backButton: {
    backgroundColor: COLORS.secondaryAppColor,
    height: verticalScale(30),
    width: verticalScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  paymentText: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: COLORS.secondaryAppColor,
    paddingLeft: 13,
  },
  paymentBtn: {
    borderWidth: 1.5,
    padding: scale(5),
    width: '90%',
    alignSelf: 'center',
    marginTop: verticalScale(20),
    borderRadius: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    borderRadius: scale(15),
    height: scale(30),
    width: scale(30),
  },
  titleCart: {
    marginLeft: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  upiText: {
    fontSize: scale(12),
    color: COLORS.black,
    fontFamily: GABRITO_MEDIUM,
    lineHeight: scale(14),
  },
  payBtnTitle: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: COLORS.secondaryAppColor,
    fontFamily: GABRITO_MEDIUM,
  },
  radioBtnOuter: {
    borderWidth: 1.5,
    padding: scale(3),
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(5),
  },
  radioBtnInner: {
    height: scale(10),
    width: scale(10),
    backgroundColor: COLORS.black,
    borderRadius: 100,
  },
  sectionTitle: {
    fontSize: scale(14),
    color: COLORS.black,
    marginLeft: scale(20),
    marginTop: verticalScale(40),
    fontFamily: GABRITO_MEDIUM,
  },
  bankImgCard: {
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: verticalScale(10),
  },
  bankImage: {
    height: verticalScale(30),
    width: verticalScale(30),
  },
  codCard: {
    width: '90%',
    alignSelf: 'center',
    marginTop: verticalScale(20),
    padding: scale(5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBox: {
    borderWidth: 2,
    borderRadius: 5,
    height: scale(25),
    width: scale(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    height: scale(20),
    width: scale(20),
  },
  codText: {
    fontSize: scale(14),
    color: COLORS.black,
    marginLeft: scale(14),
    fontFamily: GABRITO_MEDIUM,
    lineHeight: scale(14),
  },
  payNowBtn: {
    position: 'absolute',
    bottom: verticalScale(25),
    alignSelf: 'center',
    backgroundColor: '#FFB200',
    paddingHorizontal: scale(25),
    paddingVertical: scale(10),
    borderRadius: scale(20),
  },
  payNowText: {
    fontSize: scale(16),
    fontWeight: '600',
    color: COLORS.secondaryAppColor,
  },
});
