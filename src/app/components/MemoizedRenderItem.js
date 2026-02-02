import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import TextComp from './textComp';
import Icon from '../../utils/icon';
import { COLORS } from '../../res/colors';
import { scale } from 'react-native-size-matters';
import Toast from 'react-native-simple-toast';
import { useDispatch } from 'react-redux';
import { updateCartItem } from '../../redux/slices/cartSlice';
import { safeNumber } from '../hooks/useCartFunctions';

/**
 * Hook: show a toast only once when condition changes to true after a user action
 */
const useOneTimeToast = (condition, message, trigger) => {
    const wasTrue = useRef(false);
    const prevTrigger = useRef(trigger);

    useEffect(() => {
        // Only show toast if condition is true and trigger has changed
        if (condition && prevTrigger.current !== trigger && !wasTrue.current) {
            Toast.show(message);
            wasTrue.current = true;
        }
        // Reset if condition becomes false
        if (!condition) {
            wasTrue.current = false;
        }
        prevTrigger.current = trigger;
    }, [condition, message, trigger]);
};

const MemoizedRenderItem = React.memo(
    ({
        id,
        item,
        getQuantity,
        onIncrease,
        onDecrease,
        selectedProduct,
        showPrice,
    }) => {
        const dispatch = useDispatch();
        const quantity = getQuantity(id);
        const size = item?.details?.size;
        const stepsize = safeNumber(item?.details?.stepsize);
        const stock = Number(item?.details?.quantity || 0);
        const limit = Number(item?.details?.quantity ?? 0);
        // console.log("id==================>>>>>>>", item)
        // derived state
        const isIncreaseDisabled = quantity >= limit;
        const isDecreaseDisabled = quantity <= 0;

        // toast hooks with quantity as trigger to detect user action
        useOneTimeToast(isIncreaseDisabled, 'Maximum stock limit reached!', quantity);
        useOneTimeToast(isDecreaseDisabled, 'Already at 0', quantity);

        // memoized tax price calculation
        const priceWithTax = useMemo(() => {
            const rawPrice = item?.details?.price;
            const basePrice = parseFloat(rawPrice);
            if (isNaN(basePrice)) return 0;
            const taxRate = Number(selectedProduct?.tax?.igst || 0);
            const taxAmount = (basePrice * taxRate) / 100;
            return (basePrice + taxAmount).toFixed(2);
        }, [item?.details?.price, selectedProduct?.tax?.igst]);

        // memoized handlers
        const handleIncrease = useCallback(() => {

            if (!isIncreaseDisabled) {

                onIncrease(id, stepsize, limit);
            }
        }, [isIncreaseDisabled, id, stepsize, limit, onIncrease]);

        const handleDecrease = useCallback(() => {
            if (!isDecreaseDisabled) {
                onDecrease(id, stepsize);
            }
        }, [isDecreaseDisabled, id, stepsize, onDecrease]);

        return (
            <View style={styles.variantItem}>
                {/* Size */}
                <View style={styles.sizeContainer}>
                    <TextComp
                        style={{
                            color:
                                quantity >= stock
                                    ? COLORS.red
                                    : item?.maxLimitReached
                                        ? 'orange'
                                        : COLORS.secondaryAppColor,
                        }}
                        numberOfLines={1}>
                        {size}
                    </TextComp>
                </View>

                {/* Price */}
                <View style={styles.priceContainer}>
                    <TextComp numberOfLines={1}>
                        ₹{showPrice ? priceWithTax : '...'}
                    </TextComp>
                </View>

                {/* Quantity Control */}
                <View style={styles.quantityContainer}>
                    <View style={styles.quantityControl}>
                        {/* Decrease */}
                        <TouchableOpacity
                            style={[
                                styles.decreaseButton,
                                isDecreaseDisabled && { opacity: 0.5 },
                            ]}
                            disabled={isDecreaseDisabled}
                            onPress={handleDecrease}>
                            <Icon
                                type="AntDesign"
                                name="minus"
                                size={scale(14)}
                                color={COLORS.black}
                            />
                        </TouchableOpacity>

                        {/* Value */}
                        <View style={styles.quantityValue}>
                            <TextComp style={{ fontSize: scale(12) }}>{quantity}</TextComp>
                        </View>

                        {/* Increase */}
                        <TouchableOpacity
                            style={[
                                styles.increaseButton,
                                isIncreaseDisabled && { opacity: 0.5 },
                            ]}
                            disabled={isIncreaseDisabled}
                            onPress={handleIncrease}>
                            <Icon
                                type="AntDesign"
                                name="plus"
                                size={scale(14)}
                                color={COLORS.black}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    },
    (prev, next) =>
        prev.id === next.id &&
        prev.getQuantity(prev.id) === next.getQuantity(next.id) &&
        prev.showPrice === next.showPrice
);

const styles = StyleSheet.create({
    variantItem: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyOpacity(0.3),
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sizeContainer: {
        width: '30%',
        alignItems: 'center',
    },
    priceContainer: {
        width: '30%',
        alignItems: 'center',
    },
    quantityContainer: {
        width: '40%',
        alignItems: 'flex-end',
    },
    quantityControl: {
        width: scale(90),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.greyOpacity(0.1),
        borderRadius: scale(20),
        paddingHorizontal: scale(10),
        paddingVertical: scale(6),
    },
    quantityValue: {
        width: scale(24),
        alignItems: 'center',
    },
    decreaseButton: {
        height: 45,
        width: 45,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 0,
    },
    increaseButton: {
        height: 45,
        width: 45,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        right: 0,
    },
});

export default MemoizedRenderItem;