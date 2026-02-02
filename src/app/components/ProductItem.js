import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import Toast from 'react-native-simple-toast';
import { useSelector, useDispatch } from 'react-redux';
import { IMAGES } from '../../res/images';
import { COLORS } from '../../res/colors';
import Icon from '../../utils/icon';
import TextComp from './textComp';
import { removeCartItemAction, updateCartItemAction } from '../../redux/action';
import throttle from 'lodash.throttle';
import FastImage from '@d11/react-native-fast-image';


// Utility function to safely parse numbers
const safeNumber = (value, defaultValue = 0) => Number(value) || defaultValue;

const ProductItem = React.memo(
    ({ item, onPress, onMorePress, toggleLike, addToCart, showPrice }) => {
        const dispatch = useDispatch();
        const [buttonLoading, setButtonLoading] = useState(false);
        const [cartActionLoading, setCartActionLoading] = useState(false);

        const favorites = useSelector(state => state.favorites?.items || []);
        const cartItems = useSelector(state => state.cart?.items || []);
        const userId = useSelector(state => state.userData?.userData?.id);

        // Memoize mergedItem
        const mergedItem = useMemo(() => {
            const itemInCart = cartItems.find(
                (cartItem) => String(cartItem.product_id) === String(item.id)
            );
            if (itemInCart) {
                const { id: _, display_image, variants, ...restCartProps } = itemInCart; // exclude id
                const { products_id, ...restItemProps } = item; // exclude id
                // console.log('===========restCartProps==========>', restCartProps)
                // console.log('item======>222', item)
                const merged = { ...restItemProps, ...restCartProps };   // keep item.id intact

                // console.log("✅ Item found in cart:", itemInCart);
                // console.log("🔀 Merged item (id preserved):", merged);

                return merged;
            } else
                //  {
                //     console.log("❌ Item not in cart:", item.id);
                // }

                if (Array.isArray(item?.variants) && item.variants.length < 0) {
                    return item;
                }

            return item;
        }, [cartItems, item]);


        // Memoize isLiked
        const isLiked = useMemo(() => favorites.some(fav => fav.id == mergedItem.id), [favorites, mergedItem.id]);

        // Memoize price calculation
        const getPriceWithTax = useCallback(
            (variant = null) => {
                const basePrice = parseFloat(variant?.details?.price || mergedItem.price || 0);
                const taxRate = safeNumber(mergedItem?.tax?.igst);
                const taxAmount = (basePrice * taxRate) / 100;
                return (basePrice + taxAmount).toFixed(2);
            },
            [mergedItem.price, mergedItem?.tax?.igst]
        );

        // Memoized event handlers
        const handlePress = useCallback(() => onPress(mergedItem), [onPress, mergedItem]);
        const handleMorePress = useCallback(() => onMorePress(mergedItem), [onMorePress, mergedItem]);
        const handleToggleLike = useCallback(() => toggleLike(mergedItem), [toggleLike, mergedItem]);

        const handleAddToCart = useCallback(async () => {
            setButtonLoading(true);
            try {
                const result = await addToCart(mergedItem);
                console.log('result=====>', result);
                // Handle variant selection if needed
                if (result?.requiresVariantSelection) {
                    // You might need to pass these setters as props or use context
                    // setSelectedProduct(result.item);
                    // setShowVariantModal(true);
                }
            } catch (error) {
                console.error('Add to cart error:', error);
            } finally {
                setButtonLoading(false);
            }
        }, [addToCart, mergedItem]);

        // Throttled handlers with loading states
        const handleDecrease = useCallback(
            throttle(() => {
                if (cartActionLoading) return;

                setCartActionLoading(true);
                const step = safeNumber(mergedItem?.size, 1);
                const currentQty = safeNumber(mergedItem?.itemQuantity);

                if (currentQty > step) {
                    dispatch(
                        updateCartItemAction(
                            {
                                action: 'update',
                                user_id: userId,
                                product_id: mergedItem.product_id || mergedItem.id,
                                variant_id: mergedItem?.variant_id || 0,
                                itemQuantity: currentQty - step,
                            },
                            res => {
                                setCartActionLoading(false);
                                if (!res?.data?.status) {
                                    Toast.show(res?.data?.message || 'Update failed');
                                }
                            }
                        )
                    );
                } else {
                    dispatch(
                        removeCartItemAction(
                            {
                                action: 'remove',
                                user_id: userId,
                                product_id: mergedItem.product_id || mergedItem.id,
                                variant_id: mergedItem?.variant_id || 0,
                            },
                            res => {
                                setCartActionLoading(false);
                                if (res?.data?.status) {
                                    Toast.show('Removed from cart');
                                } else {
                                    Toast.show(res?.data?.message || 'Remove failed');
                                }
                            }
                        )
                    );
                }
            }, 500, { trailing: false }),
            [mergedItem, dispatch, userId, cartActionLoading]
        );

        const handleIncrease = useCallback(
            throttle(() => {
                if (cartActionLoading) return;

                setCartActionLoading(true);
                const step = safeNumber(mergedItem?.size, 1);
                const currentQty = safeNumber(mergedItem?.itemQuantity);
                const newQty = currentQty + step;
                const maxQty = safeNumber(mergedItem?.maxQuantity || mergedItem?.quantity);
                console.log('maxQty=====>', maxQty);
                console.log('newQty=====>', newQty);
                if (newQty <= maxQty) {
                    dispatch(
                        updateCartItemAction(
                            {
                                action: 'update',
                                user_id: userId,
                                product_id: mergedItem.product_id || mergedItem.id,
                                variant_id: mergedItem?.variant_id || 0,
                                itemQuantity: newQty,
                            },
                            res => {
                                setCartActionLoading(false);
                                if (!res?.data?.status) {
                                    Toast.show(res?.data?.message || 'Update failed');
                                }
                            }
                        )
                    );
                } else {
                    setCartActionLoading(false);
                    Toast.show('Maximum stock limit reached');
                }
            }, 500, { trailing: false }),
            [mergedItem, dispatch, userId, cartActionLoading]
        );

        // Cleanup throttled functions
        useEffect(() => {
            return () => {
                handleDecrease.cancel();
                handleIncrease.cancel();
            };
        }, [handleDecrease, handleIncrease]);

        // Memoize styles
        const styles = useMemo(() => StyleSheet.create({
            productContainer: {
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopColor: COLORS.greyOpacity(1),
                overflow: 'hidden',
                paddingVertical: verticalScale(5),
            },
            imageContainer: {
                width: '40%',
                position: 'relative',
            },
            productImage: {
                width: '100%',
                height: verticalScale(100),
            },
            bestProductBadge: {
                position: 'absolute',
                top: verticalScale(-5),
                zIndex: 10,
                flexDirection: 'row',
                alignItems: 'center',
            },
            outOfStockCard: {
                position: 'absolute',
                top: verticalScale(-5),
                backgroundColor: 'rgba(255,255,255,0.5)',
                justifyContent: 'center',
                zIndex: 10,
                alignItems: 'center',
                flex: 1,
                width: '100%',
                height: '100%',
            },
            badgeIcon: {
                height: verticalScale(25),
                width: verticalScale(25),
            },
            outOfStocks: {
                width: '100%',
                height: verticalScale(80),
            },
            detailsContainer: {
                flex: 1,
            },
            headerRow: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
            },
            textContainer: {
                flex: 1,
                paddingLeft: 5,
                justifyContent: 'center',
            },
            brandText: {
                fontSize: scale(12),
                marginTop: scale(3),
                color: COLORS.secondaryAppColor,
            },
            productName: {
                fontSize: scale(12),
                fontWeight: '800',
                color: COLORS.secondaryAppColor,
                marginBottom: scale(5),
                marginTop: scale(5)
            },
            priceRow: {
                flexDirection: 'row',
                justifyContent: 'space-between',
            },
            priceText: {
                fontSize: scale(15),
                fontWeight: '900',
                color: COLORS.secondaryAppColor,
            },
            rupeeSymbol: {
                fontSize: scale(11),
                fontWeight: '700',
                color: COLORS.secondaryAppColor,
            },
            taxText: {
                fontSize: scale(8),
                color: COLORS.secondaryAppColor,
                marginBottom: scale(5),
            },
            cartButton: {
                backgroundColor: COLORS.black,
                position: 'absolute',
                right: -15,
                borderRadius: scale(30),
                height: scale(30),
                width: scale(80),
                alignItems: 'center',
                justifyContent: 'center',
                // borderWidth: 1,
                // borderColor: 'red'
            },
            cartButtonText: {
                fontSize: scale(10),
                color: COLORS.white,
            },
            cartMinusButton: {
                padding: 8,
                height: 45,
                width: 45,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                left: 0,
            },
            cartPlusButton: {
                padding: 8,
                height: 45,
                width: 45,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                right: 0,
            },
            cartQuantityContainer: {
                position: 'absolute',
                alignSelf: 'center',
            },
            variantInfo: {
                flexDirection: 'row',
                alignItems: 'center',
            },
            sizeText: {
                fontSize: scale(12),
                color: COLORS.secondaryAppColor,
                maxWidth: '60%',
            },
            moreText: {
                marginLeft: scale(6),
                fontSize: scale(12),
                color: COLORS.blue,
                fontWeight: '800',
            },
            heartButton: {
                marginRight: 10,
                marginTop: verticalScale(10),
            },
            stockLimitTag: {
                padding: scale(4),
                borderRadius: scale(4),
                marginTop: scale(5),
                alignSelf: 'flex-start',
            },
            stockLimitText: {
                color: '#FFA500',
                fontSize: scale(10),
                fontWeight: '600',
            },
        }), []);

        // Memoize itemInCart check
        const itemInCart = useMemo(() => cartItems.some(cartItem => String(cartItem.product_id) === String(item.id)), [cartItems, item.id]);
        const isOutOfStock = mergedItem?.variants?.length <= 0 && mergedItem?.quantity < 1;
        const isVariantProduct = mergedItem?.variants?.length > 0;

        return (
            <View style={styles.productContainer}>
                <TouchableOpacity onPress={handlePress} style={styles.imageContainer}>
                    <FastImage
                        style={styles.productImage}
                        resizeMode={FastImage.resizeMode.contain}
                        source={
                            mergedItem?.display_image
                                ? {
                                    uri: mergedItem.display_image,
                                    priority: FastImage.priority.high,
                                    cache: FastImage.cacheControl.immutable,
                                }
                                : IMAGES.NO_PRODUCT_IMG
                        }
                    />
                    {mergedItem?.new_products && (
                        <View style={styles.bestProductBadge}>
                            <Image source={IMAGES.NEW_PRODUCT_ICON} style={styles.badgeIcon} resizeMode="contain" />
                        </View>
                    )}
                    {isOutOfStock && (
                        <View style={styles.outOfStockCard}>
                            <Image source={IMAGES.outOfStock} style={styles.outOfStocks} resizeMode="contain" />
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.detailsContainer}>
                    <View style={styles.headerRow}>
                        <View style={styles.textContainer}>
                            <TextComp style={styles.brandText}>{mergedItem?.brand?.name}</TextComp>
                            <TextComp numberOfLines={2} style={styles.productName}>{mergedItem?.product_name}</TextComp>

                            <View style={styles.priceRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                    <TextComp style={styles.rupeeSymbol}>₹</TextComp>
                                    <TextComp style={styles.priceText}>
                                        {showPrice
                                            ? isVariantProduct
                                                ? getPriceWithTax(mergedItem.variants[0])
                                                : getPriceWithTax()
                                            : '...'}
                                    </TextComp>
                                </View>

                                {!itemInCart ? (
                                    <TouchableOpacity
                                        disabled={isOutOfStock || buttonLoading}
                                        onPress={handleAddToCart}
                                        style={[
                                            styles.cartButton,
                                            {
                                                backgroundColor: isOutOfStock
                                                    ? 'rgba(0,0,0,0.5)'
                                                    : COLORS.black,
                                            },
                                        ]}
                                    >
                                        {buttonLoading ? (
                                            <ActivityIndicator size="small" color={COLORS.white} />
                                        ) : (
                                            <TextComp style={styles.cartButtonText}>Add to Cart</TextComp>
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                    isVariantProduct ? (
                                        <TouchableOpacity
                                            disabled={isOutOfStock || buttonLoading}
                                            onPress={handleAddToCart}
                                            style={[
                                                styles.cartButton,
                                                {
                                                    backgroundColor: isOutOfStock
                                                        ? 'rgba(0,0,0,0.5)'
                                                        : COLORS.black,
                                                },
                                            ]}
                                        >
                                            {buttonLoading ? (
                                                <ActivityIndicator size="small" color={COLORS.white} />
                                            ) : (
                                                <TextComp style={styles.cartButtonText}>Add to Cart</TextComp>
                                            )}
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.cartButton, { width: 120 }]}>
                                            <TouchableOpacity
                                                onPress={handleDecrease}
                                                style={styles.cartMinusButton}
                                                disabled={cartActionLoading || isOutOfStock}
                                            >
                                                {/* {cartActionLoading ? (
                                                    <ActivityIndicator size="small" color={COLORS.white} />
                                                ) : (
                                                    <Icon type="AntDesign" name="minus" color={isOutOfStock ? 'rgba(255,255,255,0.5)' : COLORS.white} size={22} />
                                                )} */}
                                                <Icon type="AntDesign" name="minus" color={isOutOfStock ? 'rgba(255,255,255,0.5)' : COLORS.white} size={22} />
                                            </TouchableOpacity>
                                            <View style={styles.cartQuantityContainer}>
                                                {cartActionLoading ? (
                                                    <ActivityIndicator size="small" color={COLORS.white} />
                                                ) : (
                                                    <TextComp style={[styles.cartButtonText, { fontSize: scale(14), fontWeight: '700' }]}>
                                                        {mergedItem?.itemQuantity}
                                                    </TextComp>
                                                )}
                                            </View>
                                            <TouchableOpacity
                                                onPress={handleIncrease}
                                                style={styles.cartPlusButton}
                                                disabled={cartActionLoading || isOutOfStock}
                                            >
                                                {/* {cartActionLoading ? (
                                                    <ActivityIndicator size="small" color={COLORS.white} />
                                                ) : (
                                                    <Icon type="AntDesign" name="plus" color={isOutOfStock ? 'rgba(255,255,255,0.5)' : COLORS.white} size={22} />
                                                )} */}
                                                <Icon type="AntDesign" name="plus" color={isOutOfStock ? 'rgba(255,255,255,0.5)' : COLORS.white} size={22} />
                                            </TouchableOpacity>
                                        </View>
                                    )
                                )}
                            </View>

                            <TextComp style={styles.taxText}>Incl GST</TextComp>

                            {isVariantProduct ? (
                                <View style={styles.variantInfo}>
                                    <TextComp numberOfLines={1} style={styles.sizeText}>
                                        {`Size: ${mergedItem.variants[0]?.details?.size || 'N/A'}`}
                                    </TextComp>
                                    <TextComp onPress={handleMorePress} style={styles.moreText}>
                                        More
                                    </TextComp>
                                </View>
                            ) : mergedItem?.sizes ? (
                                <View style={styles.variantInfo}>
                                    <TextComp numberOfLines={1} style={styles.sizeText}>
                                        {`Size: ${mergedItem?.sizes || 'N/A'}`}
                                    </TextComp>
                                </View>
                            ) : null}

                            {mergedItem?.itemQuantity == mergedItem?.quantity && itemInCart && (
                                <View style={styles.stockLimitTag}>
                                    <TextComp style={styles.stockLimitText}>Maximum quantity reached</TextComp>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity onPress={handleToggleLike} style={styles.heartButton}>
                            {!isLiked ? <Icon
                                type="EvilIcons"
                                name="heart"
                                size={scale(22)}
                                color={COLORS.secondaryAppColor}
                            /> :
                                <Icon
                                    type="Entypo"
                                    name="heart"
                                    size={scale(22)}
                                    color={COLORS.primaryAppColor}
                                />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison for React.memo
        return (
            prevProps.item === nextProps.item &&
            prevProps.showPrice === nextProps.showPrice &&
            prevProps.onPress === nextProps.onPress &&
            prevProps.onMorePress === nextProps.onMorePress &&
            prevProps.toggleLike === nextProps.toggleLike &&
            prevProps.addToCart === nextProps.addToCart
        );
    }
);

export default ProductItem;