import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {scale} from 'react-native-size-matters';
import {GABRITO_MEDIUM} from '../../../assets/fonts';
import {COLORS} from '../../res/colors';
import TextComp from './textComp';
import {width} from '../hooks/responsive';

const BrandSavingModal = ({visible, onClose, brandSavings}) => {
  const brandEntries = Object.entries(brandSavings || {}).sort(
    (a, b) => a[1].amount - b[1].amount,
  );

  const totalSaving = brandEntries.reduce(
    (sum, [_, val]) => sum + val.amount,
    0,
  );

  const rowHeight = scale(35); // Approx height per row
  const itemCount = brandEntries.length;
  const maxVisibleRows = 6;
  const scrollAreaHeight =
    itemCount > maxVisibleRows ? rowHeight * maxVisibleRows : null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TextComp style={styles.headerText}>Brand-wise Savings</TextComp>

          <View
            style={[
              styles.scrollWrapper,
              scrollAreaHeight && {height: scrollAreaHeight},
            ]}>
            <ScrollView>
              {brandEntries.map(([brand, data], index) => (
                <View style={styles.item} key={index}>
                  <Text style={styles.brand}>
                    {brand} ({data.percent}%)
                  </Text>
                  <Text style={styles.amount}>₹ {data.amount.toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          <View style={styles.totalSection}>
            <Text style={styles.totalText}>Total Saving:</Text>
            <Text style={styles.totalAmount}>₹ {totalSaving.toFixed(2)}</Text>
          </View>

          <Text style={styles.congratsText}>
            🎉 Congratulations! You saved ₹ {totalSaving.toFixed(2)}
          </Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <TextComp style={styles.buttonText}>Close</TextComp>
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
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    minWidth: '80%',
    maxHeight: '75%',
    elevation: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scrollWrapper: {
    marginVertical: 10,
    width: width * 0.7,
    // borderWidth: 1,
    alignSelf: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  brand: {
    fontSize: scale(13),
    fontFamily: GABRITO_MEDIUM,
    color: COLORS.secondaryAppColor,
  },
  amount: {
    fontSize: scale(13),
    fontFamily: GABRITO_MEDIUM,
    color: COLORS.green,
  },
  headerText: {
    fontSize: scale(15),
    fontWeight: '700',
    fontFamily: GABRITO_MEDIUM,
    textAlign: 'center',
    color: COLORS.secondaryAppColor,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#aaa',
  },
  totalText: {
    fontSize: scale(14),
    fontFamily: GABRITO_MEDIUM,
    color: COLORS.black,
  },
  totalAmount: {
    fontSize: scale(14),
    fontFamily: GABRITO_MEDIUM,
    fontWeight: '600',
    color: COLORS.primaryAppColor ?? COLORS.green,
  },
  congratsText: {
    fontSize: scale(13),
    color: COLORS.secondaryAppColor,
    fontFamily: GABRITO_MEDIUM,
    textAlign: 'center',
    marginTop: 10,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
    backgroundColor: COLORS.black,
    alignSelf: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: scale(13),
    fontFamily: GABRITO_MEDIUM,
  },
});

export default BrandSavingModal;
