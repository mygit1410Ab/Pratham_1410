// src/components/CustomText.js
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { COLORS, lightTheme } from '../../res/colors';
import { GABRITO_REGULAR } from '../../../assets/fonts';
import { scale } from 'react-native-size-matters';

const TextComp = ({ children, style, onPress, numberOfLines, ...props }) => {
    const { color } = useTheme()
    return (
        <Text numberOfLines={numberOfLines} onPress={onPress} allowFontScaling={false} style={[styles.text, style]} >
            {children}
        </Text>
    );
};
const styles = StyleSheet.create({
    text: {
        color: COLORS.primaryTextColor,
        fontFamily: GABRITO_REGULAR,
        fontSize: scale(14)
    }
}
)
export default TextComp;
