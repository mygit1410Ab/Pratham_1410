import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {COLORS} from '../../res/colors'; // Assuming static colors
import Icon from '../../utils/icon';
import TextComp from './textComp';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';

const TextInputComp = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconRightName,
  iconRightType = 'MaterialIcons',
  onIconPress,
  iconRightColor,
  showPasswordToggle = false,
  secureTextEntry = false,
  style,
  inputStyle,
  labelStyle,
  customBorderColor,
  customContainerStyle,
  keyboardType,
  maxLength,
  editable,
  selectTextOnFocus,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  return (
    <View style={style}>
      {label && (
        <TextComp
          style={[styles.label, {color: COLORS.primaryTextColor}, labelStyle]}>
          {label}
        </TextComp>
      )}
      <View
        style={[
          styles.container,
          customContainerStyle,
          {borderColor: customBorderColor || COLORS.borderColor},
        ]}>
        <TextInput
          editable={editable}
          selectTextOnFocus={selectTextOnFocus}
          keyboardType={keyboardType}
          // keyboardType='phone-pad'
          maxLength={maxLength}
          allowFontScaling={false}
          value={value}
          onChangeText={onChangeText}
          onBlur={props.onBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.secondaryTextColor}
          secureTextEntry={isSecure}
          style={[styles.input, {color: COLORS.primaryTextColor}, inputStyle]}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.icon}>
            <Icon
              name={isSecure ? 'eye-off' : 'eye'}
              type="Feather"
              color={COLORS.primaryTextColor}
              size={20}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: scale(13),
    marginBottom: verticalScale(3),
  },
  container: {
    height: verticalScale(44),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    fontSize: scale(14),
  },
  icon: {
    marginLeft: moderateScale(8),
  },
});

export default TextInputComp;
