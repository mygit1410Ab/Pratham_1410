import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { width } from '../hooks/responsive';
import { COLORS } from '../../res/colors';

const Wrapper = ({
  children,
  safeAreaContainerStyle,
  useBottomInset = true,
  useTopInsets = true,
  childrenStyles,
  bottomInsetBgColor = COLORS.white,
}) => {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.safeAreaContainer, safeAreaContainerStyle]}>
      {useTopInsets && <View style={{ paddingTop: insets.top, }} />}

      <View style={[styles.childrenStyles, childrenStyles]}>
        {children}
      </View>
      {useBottomInset && <View style={{ paddingBottom: insets.bottom, backgroundColor: bottomInsetBgColor }} />}
      {/* <View style={{ paddingBottom: insets.bottom }} /> */}
    </View >
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  childrenStyles: {
    backgroundColor: COLORS.white,
    width: width * 0.89, alignSelf: "center"
  }
});

export default Wrapper;



