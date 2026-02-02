import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';
import debounce from 'lodash.debounce';
import {
    addToCartAction,
    removeCartItemAction,
    updateCartItemAction,
    updateMultipleCartItemsAction,
    syncCartAction,
    clearCartAction, // ✅ new action
} from '../../redux/action';

// Utility function to safely parse numbers
export const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
};

// Hook for cart quantity management
export const useCartQuantity = () => {
    const cartItems = useSelector(state => state.cart.items);
    const [variantQuantities, setVariantQuantities] = useState({});

    const increaseQuantity = useMemo(
        () =>
            debounce((key, stepsize = 1, maxQuantity = 0) => {
                console.log("increaseQuantity called with key:", key, "stepsize:", stepsize, "maxQuantity:", maxQuantity);
                console.log("Calculated step:", safeNumber(stepsize));
                const step = safeNumber(stepsize);
                setVariantQuantities(prev => {
                    const currentChange = prev[key] || 0;
                    const [productId, variantId] = key.split('_');

                    const baseOrderQty = cartItems.find(
                        item =>
                            String(item.product_id) === String(productId) &&
                            String(item.variant_id) === String(variantId),
                    )?.itemQuantity || 0;
                    console.log("baseOrderQty:", baseOrderQty, "currentChange:", currentChange, "step:", step);
                    const newTotal = safeNumber(baseOrderQty) + safeNumber(currentChange) + safeNumber(step);
                    console.log("baseOrderQty:", baseOrderQty, "currentChange:", currentChange, "newTotal:", newTotal);
                    console.log("maxQuantity:", maxQuantity);
                    if (maxQuantity > 0 && newTotal > maxQuantity) {
                        Toast.show('Maximum stock limit reached!');
                        return prev;
                    }

                    return {
                        ...prev,
                        [key]: currentChange + step,
                    };
                });
            }, 300, { leading: true, trailing: false }),
        [cartItems]
    );

    const decreaseQuantity = useMemo(
        () =>
            debounce((key, stepsize = 1) => {
                const step = Math.max(safeNumber(stepsize), 1);

                setVariantQuantities(prev => {
                    const currentChange = prev[key] || 0;
                    const [productId, variantId] = key.split('_');

                    const baseOrderQty = cartItems.find(
                        item =>
                            String(item.product_id) === String(productId) &&
                            String(item.variant_id) === String(variantId),
                    )?.itemQuantity || 0;

                    return {
                        ...prev,
                        [key]: currentChange - step,
                    };
                });
            }, 300, { leading: true, trailing: false }),
        [cartItems]
    );

    const getQuantity = useCallback(
        key => {
            const [productId, variantId] = key.split('_');
            const baseOrderQty = cartItems.find(
                item =>
                    String(item.product_id) === String(productId) &&
                    String(item.variant_id) === String(variantId),
            )?.itemQuantity || 0;

            const localChange = variantQuantities[key] || 0;
            return Math.max(0, Number(baseOrderQty) + Number(localChange));
        },
        [variantQuantities, cartItems]
    );

    return {
        variantQuantities,
        setVariantQuantities,
        increaseQuantity,
        decreaseQuantity,
        getQuantity,
    };
};

// Hook for cart synchronization
export const useCartSync = () => {
    const dispatch = useDispatch();
    const userData = useSelector(state => state.userData.userData);
    const { isSyncing, syncError } = useSelector(state => state.cart);

    const syncCartWithServer = useCallback(() => {
        if (!userData?.id) {
            Toast.show('Please log in to sync cart');
            return;
        }
        dispatch(
            syncCartAction(
                { user_id: userData.id },
                response => {
                    if (response?.data?.status) {
                        // Toast.show('Cart synced successfully');
                    } else {
                        Toast.show(`Cart sync failed: ${response?.data?.message || 'Unknown error'}`);
                    }
                }
            )
        );
    }, [dispatch, userData]);

    // Auto-sync on user login
    useEffect(() => {
        if (userData?.id) {
            syncCartWithServer();
        }
    }, [userData?.id, syncCartWithServer]);

    return {
        syncCartWithServer,
        isSyncing,
        syncError,
    };
};

// Hook for cart operations
export const useCartOperations = () => {
    const dispatch = useDispatch();
    const userData = useSelector(state => state.userData.userData);
    const cartItems = useSelector(state => state.cart.items);

    const syncCart = useCallback(() => {
        if (userData?.id) {
            dispatch(
                syncCartAction(
                    { user_id: userData.id },
                    response => {
                        if (!response?.data?.status) {
                            Toast.show(`Sync failed: ${response?.data?.message || 'Unknown error'}`);
                        }
                    }
                )
            );
        }
    }, [dispatch, userData]);

    const addToCart = useCallback(
        (item) => {
            console.log('item------>', item)
            console.log('item------>', userData)
            console.log('item------>', userData?.id)
            if (item?.variants?.length > 0) {
                return { requiresVariantSelection: true, item };
            }

            const availableStock = safeNumber(item.quantity || item.stock);
            const step = safeNumber(item?.size, 1);

            if (availableStock < step) {
                Toast.show('Product is out of stock');
                return { success: false };
            }

            const productToAdd = {
                user_id: userData?.id,
                product_id: item.id,
                variant_id: 0,
                itemQuantity: step,
                stepsize: step,
                maxQuantity: availableStock,
            };

            dispatch(
                addToCartAction(productToAdd, (res) => {
                    if (res?.data?.status) {
                        Toast.show('Added to cart');
                        syncCart();
                    } else {
                        console.log('res------>', res)
                        Toast.show(res?.data?.message || 'Failed to add to cart');
                    }
                })
            );

            return { success: true };
        },
        [dispatch, userData, syncCart]
    );

    const updateCartItem = useCallback(
        (item, newQuantity) => {
            const productId = item.product_id || item.id;
            const variantId = item.variant_id || 0;

            if (newQuantity <= 0) {
                dispatch(
                    removeCartItemAction(
                        {
                            user_id: userData?.id,
                            product_id: productId,
                            variant_id: variantId,
                        },
                        (res) => {
                            if (res?.data?.status) {
                                Toast.show('Removed from cart');
                                syncCart();
                            } else {
                                Toast.show(res?.data?.message || 'Failed to remove from cart');
                            }
                        }
                    )
                );
            } else {
                dispatch(
                    updateCartItemAction(
                        {
                            user_id: userData?.id,
                            product_id: productId,
                            variant_id: variantId,
                            itemQuantity: newQuantity,
                        },
                        (res) => {
                            if (res?.data?.status) {
                                Toast.show('Updated');
                                syncCart();
                            } else {
                                Toast.show(res?.data?.message || 'Failed to update cart');
                            }
                        }
                    )
                );
            }
        },
        [dispatch, userData, syncCart]
    );

    const handleVariantSubmit = useCallback(
        (product, quantities, onClose, setVariantQuantities) => {
            if (!product?.variants?.length) return;

            let hasQuantity = false;
            const cartUpdates = [];
            const cartItemsMap = new Map();

            cartItems.forEach(item => {
                const key = `${item.product_id}_${item.variant_id}`;
                cartItemsMap.set(key, item);
            });

            product.variants.forEach(variant => {
                const key = `${product.id}_${variant.id}`;
                const localChange = quantities[key] || 0;
                const cartItem = cartItemsMap.get(key);
                const baseOrderQty = cartItem?.itemQuantity || 0;
                const totalQty = baseOrderQty + localChange;

                if (totalQty > 0 || baseOrderQty) hasQuantity = true;
                if (!cartItem && totalQty === 0) return;

                cartUpdates.push({
                    product_id: product.id,
                    variant_id: variant.id,
                    itemQuantity: totalQty,
                    stepsize: safeNumber(variant.details?.stepsize, 1),
                    maxQuantity: safeNumber(variant.details?.quantity),
                    action: !cartItem ? 'add' : totalQty <= 0 ? 'remove' : 'update',
                });
            });

            if (!hasQuantity) {
                Toast.show('Please select at least one variant');
                return;
            }

            dispatch(
                updateMultipleCartItemsAction(
                    {
                        user_id: userData?.id,
                        updates: cartUpdates,
                    },
                    (res) => {
                        if (res?.data?.status) {
                            Toast.show('Cart updated successfully');
                            syncCart();
                        } else {
                            Toast.show(res?.data?.message || 'Failed to update cart');
                        }
                        setVariantQuantities({});
                        onClose();
                    }
                )
            );
        },
        [dispatch, userData, cartItems, syncCart]
    );

    // ✅ Clear cart
    const clearCart = useCallback(() => {
        if (!userData?.id) {
            Toast.show('Please log in to clear cart');
            return;
        }

        dispatch(
            clearCartAction(
                { user_id: userData.id },
                (res) => {
                    if (res?.data?.status) {
                        Toast.show('Cart cleared successfully');
                        syncCart();
                    } else {
                        Toast.show(res?.data?.message || 'Failed to clear cart');
                    }
                }
            )
        );
    }, [dispatch, userData, syncCart]);

    return {
        addToCart,
        updateCartItem,
        handleVariantSubmit,
        syncCartWithServer: syncCart,
        clearCart, // ✅ exposed here
    };
};

// Hook for product price calculations
export const useProductPricing = () => {
    const getPriceWithTax = useCallback((item, variant = null) => {
        const basePrice = parseFloat(variant?.details?.price || item.price || 0);
        const taxRate = safeNumber(item?.tax?.igst);
        const taxAmount = (basePrice * taxRate) / 100;
        return (basePrice + taxAmount).toFixed(2);
    }, []);

    const getStockStatus = useCallback((item) => {
        const availableStock = safeNumber(item.quantity || item.stock);
        const step = safeNumber(item?.size, 1);
        return {
            isOutOfStock: availableStock < step,
            availableStock,
            stepSize: step,
        };
    }, []);

    return {
        getPriceWithTax,
        getStockStatus,
    };
};

// Hook for cart item management
export const useCartItemManagement = () => {
    const dispatch = useDispatch();
    const userData = useSelector(state => state.userData.userData);
    const [pendingActions, setPendingActions] = useState({});

    const syncCart = useCallback(() => {
        if (userData?.id) {
            dispatch(
                syncCartAction(
                    { user_id: userData.id },
                    response => {
                        if (!response?.data?.status) {
                            Toast.show(`Sync failed: ${response?.data?.message || 'Unknown error'}`);
                        }
                    }
                )
            );
        }
    }, [dispatch, userData]);

    const increaseCartItem = useCallback(
        debounce((item) => {
            const step = safeNumber(item?.stepsize || item?.size, 1);
            const currentQty = safeNumber(item?.itemQuantity);
            const newQty = currentQty + step;
            const maxQty = safeNumber(item?.quantity);
            const key = `${item.product_id || item.id}_${item?.variant_id || 0}`;
            console.log("increaseCartItem=======>", item?.size)
            console.log("step=======>", step)
            console.log("currentQty=======>", currentQty)
            console.log("newQty=======>", newQty)

            if (pendingActions[key]) {
                return;
            }

            if (newQty > maxQty) {
                Toast.show('Maximum stock limit reached');
                return;
            }

            setPendingActions(prev => ({ ...prev, [key]: true }));

            dispatch(
                updateCartItemAction(
                    {
                        action: 'update',
                        user_id: userData?.id,
                        product_id: item.product_id || item.id,
                        variant_id: item?.variant_id || 0,
                        itemQuantity: newQty,
                    },
                    res => {
                        setPendingActions(prev => ({ ...prev, [key]: false }));
                        if (res?.data?.status) {
                            syncCart();
                        } else {
                            Toast.show(res?.data?.message || 'Failed to update cart');
                        }
                    }
                )
            );
        }, 300),
        [dispatch, userData, pendingActions, syncCart]
    );

    const decreaseCartItem = useCallback(
        debounce((item) => {
            console.log("decreaseCartItem=======>", item?.size)
            const step = safeNumber(item?.stepsize || item?.size, 1);
            console.log("step=======>", step)
            const currentQty = safeNumber(item?.itemQuantity);
            console.log("currentQty=======>", currentQty)
            const key = `${item.product_id || item.id}_${item?.variant_id || 0}`;

            if (pendingActions[key]) {
                return;
            }
            console.log("currentQty - step=======>", currentQty - step)
            setPendingActions(prev => ({ ...prev, [key]: true }));

            if (currentQty > step) {
                dispatch(
                    updateCartItemAction(
                        {
                            action: 'update',
                            user_id: userData?.id,
                            product_id: item.product_id || item.id,
                            variant_id: item?.variant_id || 0,
                            itemQuantity: currentQty - step,
                        },
                        res => {
                            setPendingActions(prev => ({ ...prev, [key]: false }));
                            if (res?.data?.status) {
                                syncCart();
                            } else {
                                Toast.show(res?.data?.message || 'Failed to update cart');
                            }
                        }
                    )
                );
            } else {
                dispatch(
                    removeCartItemAction(
                        {
                            action: 'remove',
                            user_id: userData?.id,
                            product_id: item.product_id || item.id,
                            variant_id: item?.variant_id || 0,
                        },
                        res => {
                            setPendingActions(prev => ({ ...prev, [key]: false }));
                            if (res?.data?.status) {
                                Toast.show('Removed from cart');
                                syncCart();
                            } else {
                                Toast.show(res?.data?.message || 'Failed to remove from cart');
                            }
                        }
                    )
                );
            }
        }, 300),
        [dispatch, userData, pendingActions, syncCart]
    );

    // ✅ also expose clearCart here
    const clearCart = useCallback(() => {
        if (!userData?.id) {
            Toast.show('Please log in to clear cart');
            return;
        }

        dispatch(
            clearCartAction(
                { user_id: userData.id },
                res => {
                    if (res?.data?.status) {
                        Toast.show('Cart cleared successfully');
                        syncCart();
                    } else {
                        Toast.show(res?.data?.message || 'Failed to clear cart');
                    }
                }
            )
        );
    }, [dispatch, userData, syncCart]);

    return {
        increaseCartItem,
        decreaseCartItem,
        pendingActions,
        clearCart, // ✅ here too
    };
};

// Utility function to check if item is in cart
export const useCartCheck = () => {
    const cartItems = useSelector(state => state.cart.items);

    const isItemInCart = useCallback((itemId, variantId = 0) => {
        return cartItems.some(item =>
            String(item.product_id) === String(itemId) &&
            Number(item.variant_id) === Number(variantId)
        );
    }, [cartItems]);

    const getCartItem = useCallback((itemId, variantId = 0) => {
        return cartItems.find(item =>
            String(item.product_id) === String(itemId) &&
            Number(item.variant_id) === Number(variantId)
        );
    }, [cartItems]);

    return {
        isItemInCart,
        getCartItem,
    };
};
