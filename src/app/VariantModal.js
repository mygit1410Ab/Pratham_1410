import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    Image,
    FlatList,
    StyleSheet,
    Platform,
    ActivityIndicator,
    InteractionManager
} from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import TextComp from './components/textComp';
import { COLORS } from '../res/colors';
import { updateMultipleCartItemsAction } from '../redux/action';

// Memoized component to prevent unnecessary re-renders
const MemoizedVariantItem = React.memo(({ renderItem, item, index }) =>
    renderItem({ item, index })
);

const VariantModal = ({
    product,
    quantities,
    onClose,
    renderItem,
    userData,
    setVariantQuantities
}) => {
    const dispatch = useDispatch();
    const cartItems = useSelector(state => state.cart.items);
    const [isLoading, setIsLoading] = useState(false);
    const timeoutRef = useRef(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Memoized cart items lookup for better performance
    const cartItemsMap = useMemo(() => {
        const map = new Map();
        cartItems.forEach(item => {
            const key = `${item.product_id}_${item.variant_id}`;
            map.set(key, item);
        });
        return map;
    }, [cartItems]);

    // Optimized variant merging
    const mergedVariants = useMemo(() => {
        if (!product?.variants) return [];

        return product.variants.map(variant => {
            const key = `${variant.products_id}_${variant.id}`;
            const cartItem = cartItemsMap.get(key);
            if (cartItem) {
                const { id, ...restCartItem } = cartItem; // remove id
                return { ...variant, ...restCartItem };
            }

            return variant;

        });
    }, [product?.variants, cartItemsMap]);

    // Memoized key extractor for FlatList
    const keyExtractor = useCallback((item) => `${item.products_id}_${item.id}`, []);

    // Optimized cart updates calculation
    const calculateCartUpdates = useCallback(() => {
        if (!product?.variants) return { hasQuantity: false, updates: [] };

        let hasQuantity = false;
        const updates = [];

        product.variants.forEach(variant => {
            const key = `${product.id}_${variant.id}`;
            const localChange = quantities[key] || 0;

            const cartItemKey = `${product.id}_${variant.id}`;
            const cartItem = cartItemsMap.get(cartItemKey);

            const baseOrderQty = Number(cartItem?.itemQuantity) || 0;
            const totalQty = baseOrderQty + localChange;

            if (totalQty > 0 || baseOrderQty) hasQuantity = true;

            if (!cartItem && totalQty === 0) return;

            updates.push({
                product_id: product.id,
                variant_id: variant.id,
                itemQuantity: totalQty,
                stepsize: Number(variant.details?.stepsize ?? 1),
                maxQuantity: Number(variant.details?.quantity ?? 0),
                action: !cartItem ? 'add' : totalQty <= 0 ? 'remove' : 'update'
            });
        });

        return { hasQuantity, updates };
    }, [product, quantities, cartItemsMap]);

    // Debounced submit handler
    const handleSubmit = useCallback(() => {
        if (!product?.variants?.length) return;

        // Clear any pending timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setIsLoading(true);

        // Use InteractionManager for smoother UX
        InteractionManager.runAfterInteractions(() => {
            const { hasQuantity, updates } = calculateCartUpdates();

            if (!hasQuantity) {
                setIsLoading(false);
                Toast.show('Please select at least one variant');
                return;
            }

            if (!isMountedRef.current) return;

            dispatch(
                updateMultipleCartItemsAction(
                    {
                        user_id: userData?.id,
                        updates
                    },
                    (res) => {
                        if (!isMountedRef.current) return;

                        setIsLoading(false);
                        if (res?.data?.status) {
                            Toast.show('Cart updated successfully');
                        } else {
                            Toast.show(res?.data?.message || 'Failed to update cart');
                        }
                        setVariantQuantities({});
                        onClose();
                    }
                )
            );
        });
    }, [product, quantities, userData, dispatch, calculateCartUpdates, onClose, setVariantQuantities]);

    // Memoized render item wrapper
    const renderVariantItem = useCallback(({ item, index }) => (
        <MemoizedVariantItem
            renderItem={renderItem}
            item={item}
            index={index}
        />
    ), [renderItem]);

    // Memoized styles for better performance
    const modalContentStyle = useMemo(() => [
        styles.modalContent,
        { maxHeight: Platform.OS === 'ios' ? '60%' : '75%' }
    ], []);

    const submitButtonStyle = useMemo(() => [
        styles.submitButton,
        isLoading && styles.disabledButton
    ], [isLoading]);

    const cancelButtonStyle = useMemo(() => [
        styles.cancelButton,
        isLoading && styles.disabledButton
    ], [isLoading]);

    // Early return if no product
    if (!product) {
        return null;
    }

    return (
        <View style={styles.modalOverlay}>
            <View style={modalContentStyle}>
                <TextComp style={styles.modalTitle}>
                    {product?.product_name}
                </TextComp>
                <TextComp style={styles.modalSubTitle}>
                    {`HSN Code:${product?.hsn_code}`}
                </TextComp>

                <Image
                    source={{ uri: product.display_image }}
                    style={styles.modalImage}
                    resizeMode="cover"
                />

                {product.variants?.length > 0 ? (
                    <>
                        <View style={styles.variantHeader}>
                            <TextComp style={styles.variantHeaderText}>Size</TextComp>
                            <TextComp style={styles.variantHeaderText}>Price</TextComp>
                            <TextComp style={styles.variantHeaderText}>Qty</TextComp>
                        </View>
                        <FlatList
                            data={mergedVariants}
                            keyExtractor={keyExtractor}
                            renderItem={renderVariantItem}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={10}
                            maxToRenderPerBatch={5}
                            windowSize={5}
                            removeClippedSubviews={Platform.OS === 'android'}
                        />
                    </>
                ) : (
                    <TextComp style={styles.noVariantsText}>No variants</TextComp>
                )}

                <View style={styles.modalButtons}>
                    <TouchableOpacity
                        style={cancelButtonStyle}
                        onPress={onClose}
                        disabled={isLoading}
                    >
                        <TextComp style={styles.buttonText}>Cancel</TextComp>
                    </TouchableOpacity>

                    {product.variants?.length > 0 && (
                        <TouchableOpacity
                            style={submitButtonStyle}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <TextComp style={styles.buttonText}>Submit</TextComp>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={COLORS.primaryAppColor} />
                            <TextComp style={styles.loadingText}>Updating cart...</TextComp>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

// Optimized styles with memoization
const styles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        paddingHorizontal: scale(20),
        paddingBottom: verticalScale(50),
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: scale(10),
        padding: scale(15),
    },
    modalTitle: {
        fontSize: scale(13),
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalSubTitle: {
        fontSize: scale(10),
        fontWeight: '500',
        marginBottom: verticalScale(10),
        textAlign: 'center',
    },
    modalImage: {
        width: verticalScale(40),
        height: verticalScale(40),
        alignSelf: 'center',
    },
    variantHeader: {
        flexDirection: 'row',
        paddingVertical: verticalScale(8),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyOpacity(0.5),
        marginBottom: verticalScale(5),
    },
    variantHeaderText: {
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    noVariantsText: {
        textAlign: 'center',
        marginVertical: verticalScale(20),
        color: COLORS.red,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: verticalScale(20),
        position: 'relative',
    },
    cancelButton: {
        backgroundColor: COLORS.greyOpacity(1),
        paddingVertical: scale(10),
        borderRadius: scale(6),
        flex: 1,
        marginRight: scale(10),
    },
    submitButton: {
        backgroundColor: COLORS.primaryAppColor,
        paddingVertical: scale(10),
        borderRadius: scale(6),
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: verticalScale(40),
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        textAlign: 'center',
        color: COLORS.white,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: scale(10),
    },
    loaderContainer: {
        backgroundColor: COLORS.white,
        padding: scale(20),
        borderRadius: scale(10),
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    loadingText: {
        marginTop: verticalScale(10),
        color: COLORS.primaryAppColor,
        fontSize: scale(12),
    },
});

export default React.memo(VariantModal);