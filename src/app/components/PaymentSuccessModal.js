import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { IMAGES } from '../../res/images';
import TextComp from './textComp';
import { scale } from 'react-native-size-matters';
import { GABRITO_MEDIUM } from '../../../assets/fonts';
import { COLORS } from '../../res/colors';

const PaymentSuccessModal = ({ visible, onClose, paymentStatus, loading, orderId }) => {
  const getMessage = () => {
    if (loading) return 'Processing your order...';
    if (paymentStatus === true) return 'Order placed successfully!';
    if (paymentStatus === false) return 'Order failed. Please try again.';
    return '';
  };

  const getTextColor = () => {
    if (loading) return 'black';
    return paymentStatus ? 'green' : 'orange';
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color="green" />
              <Text style={[styles.text, { color: getTextColor() }]}>
                {getMessage()}
              </Text>
            </>
          ) : (
            <>
              <Image
                source={
                  paymentStatus === true
                    ? IMAGES.sucess
                    : IMAGES.failed || IMAGES.sucess
                }
                style={styles.image}
                resizeMode="contain"
              />
              <TextComp style={styles.titleText}>
                {paymentStatus ? 'Success!' : 'Failed!'}
              </TextComp>
              <TextComp style={styles.messageText}>
                {paymentStatus
                  ? `Great purchase. Thank you for your purchase. Your ORDER ID is ${orderId}.`
                  : 'Something went wrong. Please try again.'}
              </TextComp>
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <TextComp style={styles.buttonText}>Done</TextComp>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 6,
    width: '90%',
    borderWidth: 1,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  image: {
    height: scale(60),
    width: scale(60),
    marginBottom: 12,
  },
  titleText: {
    fontSize: scale(15),
    fontWeight: '700',
    fontFamily: GABRITO_MEDIUM,
    lineHeight: scale(18),
    color: COLORS.secondaryAppColor,
  },
  messageText: {
    fontSize: scale(13),
    lineHeight: scale(18),
    fontFamily: GABRITO_MEDIUM,
    color: COLORS.secondaryAppColor,
    textAlign: 'center',
    marginVertical: 4,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '400',
    fontFamily: GABRITO_MEDIUM,
    lineHeight: scale(18),
    color: COLORS.white,
  },
});

export default PaymentSuccessModal;
