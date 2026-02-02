import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { toggleShowPrice } from '../../redux/slices/togglePriceSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // use your icon lib
import { scale } from 'react-native-size-matters';
import { COLORS } from '../../res/colors';
import { GABRITO_MEDIUM } from '../../../assets/fonts';

const PriceToggleButton = () => {
  const dispatch = useDispatch();
  const isPriceVisible = useSelector(state => state.togglePrice.showPrice);

  const handleToggle = () => {
    dispatch(toggleShowPrice());
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: scale(4),
        borderRadius: 8,
        backgroundColor: !isPriceVisible
          ? COLORS.primaryAppColorOpacity(0.3)
          : 'transparent',
        paddingVertical: scale(10),
        paddingHorizontal: scale(12),
      }}>
      {/* Left Icon + Label */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon
          name="currency-inr" // or any icon you prefer
          size={20}
          color={COLORS.primaryText}
          style={{ marginRight: scale(10) }}
        />
        <Text
          allowFontScaling={false}
          style={{
            fontSize: scale(14),
            fontFamily: GABRITO_MEDIUM,
            color: COLORS.primaryText,
          }}>
          {'Hide Prices'}
        </Text>
      </View>

      {/* Right Switch */}
      <Switch
        value={!isPriceVisible}
        onValueChange={handleToggle}
        trackColor={{ false: '#ccc', true: COLORS.primaryAppColor }}
        thumbColor={!isPriceVisible ? '#fff' : '#f4f3f4'}
      />
    </TouchableOpacity>
  );
};

export default PriceToggleButton;
