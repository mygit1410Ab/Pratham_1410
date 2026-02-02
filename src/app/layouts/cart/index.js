import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Icon from '../../../utils/icon';
import { COLORS } from '../../../res/colors';
import { height, width } from '../../hooks/responsive';
import TextComp from '../../components/textComp';
import Wrapper from '../../components/wrapper';
import { IMAGES } from '../../../res/images';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { getProfileAction, postOrderAction } from '../../../redux/action';
import PaymentSuccessModal from '../../components/PaymentSuccessModal';
import { SCREEN } from '..';
import { useCartOperations, useCartSync } from '../../hooks/useCartFunctions';
import debounce from 'lodash.debounce';
import FastImage from '@d11/react-native-fast-image';

// Utility functions
const truncateTo2Decimals = num => Math.floor(num * 100) / 100;
const safeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  if (isNaN(num)) return defaultValue;
  return Math.round(num * 100) / 100;
};

// Helper function to check credit eligibility
const isCreditEligible = (meta) => {
  console.log('Credit eligibility check - userData:', meta);
  console.log('Credit eligibility check - by_users:', meta?.by_users);

  // Check if by_users exists and is truthy
  const eligible = meta?.by_users;
  console.log('User is credit eligible:', eligible);
  return eligible;
};

// Order Confirmation Modal Component
const OrderConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  paymentMethod,
  totalAmount,
  loading = false,
  isCreditEligible = true
}) => {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToCreditTerms, setAgreeToCreditTerms] = useState(false);

  const handleConfirm = () => {
    if (paymentMethod === 'cash' && !agreeToTerms) {
      Toast.show('Please agree to pay on delivery terms');
      return;
    }
    if (paymentMethod === 'credit' && !agreeToCreditTerms) {
      Toast.show('Please agree to credit terms and policy');
      return;
    }
    if (paymentMethod === 'credit' && !isCreditEligible) {
      Toast.show('Credit purchases are not available for your account');
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    setAgreeToTerms(false);
    setAgreeToCreditTerms(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={orderConfirmStyles.overlay}>
        <View style={orderConfirmStyles.modalContainer}>
          <View style={orderConfirmStyles.header}>
            <TextComp style={orderConfirmStyles.title}>Order Confirmation</TextComp>
            <TouchableOpacity onPress={handleClose} style={orderConfirmStyles.closeButton}>
              <Icon type="MaterialIcons" name="close" size={24} color={COLORS.primaryTextColor} />
            </TouchableOpacity>
          </View>

          <View style={orderConfirmStyles.content}>
            {paymentMethod === 'cash' && (
              <View style={orderConfirmStyles.section}>
                <TextComp style={[orderConfirmStyles.warningText, { color: COLORS.primaryTextColor }]}>
                  You need to make Immediate payment while accepting delivery. PDC will not be accepted.
                </TextComp>

                <TouchableOpacity
                  style={orderConfirmStyles.checkboxContainer}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    orderConfirmStyles.checkbox,
                    agreeToTerms && orderConfirmStyles.checkboxChecked
                  ]}>
                    {agreeToTerms && (
                      <Icon type="MaterialIcons" name="check" size={16} color={COLORS.white} />
                    )}
                  </View>
                  <TextComp style={orderConfirmStyles.checkboxLabel}>
                    Pay on Delivery
                  </TextComp>
                </TouchableOpacity>
              </View>
            )}

            {paymentMethod === 'credit' && (
              <View style={orderConfirmStyles.section}>
                {!isCreditEligible && (
                  <TextComp style={orderConfirmStyles.errorText}>
                    Credit purchases are not available for your account.
                  </TextComp>
                )}
                <TouchableOpacity
                  style={[
                    orderConfirmStyles.checkboxContainer,
                    !isCreditEligible && orderConfirmStyles.disabledCheckbox
                  ]}
                  onPress={() => isCreditEligible && setAgreeToCreditTerms(!agreeToCreditTerms)}
                  activeOpacity={isCreditEligible ? 0.7 : 1}
                  disabled={!isCreditEligible}
                >
                  <View style={[
                    orderConfirmStyles.checkbox,
                    agreeToCreditTerms && orderConfirmStyles.checkboxChecked,
                    !isCreditEligible && orderConfirmStyles.disabledCheckbox
                  ]}>
                    {agreeToCreditTerms && isCreditEligible && (
                      <Icon type="MaterialIcons" name="check" size={16} color={COLORS.white} />
                    )}
                  </View>
                  <TextComp style={[
                    orderConfirmStyles.checkboxLabel,
                    !isCreditEligible && orderConfirmStyles.disabledText
                  ]}>
                    I agree to credit terms and policy
                  </TextComp>
                </TouchableOpacity>
              </View>
            )}

            <View style={orderConfirmStyles.totalSection}>
              <TextComp style={orderConfirmStyles.totalLabel}>Total Amount:</TextComp>
              <TextComp style={orderConfirmStyles.totalAmount}>₹{totalAmount}</TextComp>
            </View>
          </View>

          <View style={orderConfirmStyles.footer}>
            <TouchableOpacity
              style={[
                orderConfirmStyles.confirmButton,
                ((paymentMethod === 'cash' && !agreeToTerms) ||
                  (paymentMethod === 'credit' && (!agreeToCreditTerms || !isCreditEligible)) ||
                  loading) && orderConfirmStyles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={
                (paymentMethod === 'cash' && !agreeToTerms) ||
                (paymentMethod === 'credit' && (!agreeToCreditTerms || !isCreditEligible)) ||
                loading
              }
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <TextComp style={orderConfirmStyles.confirmButtonText}>
                  Confirm Order
                </TextComp>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const orderConfirmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    width: '100%',
    maxWidth: scale(400),
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  title: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: COLORS.secondaryAppColor,
    flex: 1,
  },
  closeButton: {
    padding: scale(4),
  },
  content: {
    padding: moderateScale(16),
  },
  section: {
    marginBottom: verticalScale(16),
  },
  warningText: {
    fontSize: scale(14),
    color: COLORS.orange,
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: scale(18),
  },
  errorText: {
    fontSize: scale(14),
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: scale(18),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  disabledCheckbox: {
    opacity: 0.5,
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderWidth: 2,
    borderColor: COLORS.primaryTextColor,
    borderRadius: scale(4),
    marginRight: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primaryAppColor,
    borderColor: COLORS.primaryAppColor,
  },
  checkboxLabel: {
    fontSize: scale(14),
    color: COLORS.secondaryAppColor,
    flex: 1,
  },
  disabledText: {
    color: COLORS.primaryTextColor,
    opacity: 0.5,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  totalLabel: {
    fontSize: scale(16),
    fontWeight: '600',
    color: COLORS.secondaryAppColor,
  },
  totalAmount: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: COLORS.primaryAppColor,
  },
  footer: {
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  confirmButton: {
    backgroundColor: COLORS.primaryAppColor,
    paddingVertical: verticalScale(14),
    borderRadius: scale(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.primaryTextColor,
    opacity: 0.6,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: scale(16),
    fontWeight: 'bold',
  },
});

const Cart = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [showOrderConfirmModal, setShowOrderConfirmModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  const userData = useSelector(state => state.userData.userData);
  const cartItems = useSelector(state => state.cart?.items || []);
  const meta = useSelector(state => state.cart?.meta || {});
  const isCreditAllowed = meta?.by_users === true || meta?.by_users === 'true';
  console.log("meta data in cart:", meta);
  const SELLER_STATE = 'karnataka';

  // Debug logging
  const creditEligible = isCreditEligible(meta);
  console.log('Credit eligible:', creditEligible);

  const { clearCart, updateCartItem } = useCartOperations();
  const { isSyncing, syncError, syncCartWithServer } = useCartSync();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const init = useCallback(async (forceRefresh = false) => {
    // Only fetch profile if not initialized or forced refresh
    if (!isInitialized || forceRefresh) {
      return new Promise((resolve) => {
        dispatch(
          getProfileAction({}, res => {
            console.log('Profile refreshed - by_users:', res?.data?.by_users);
            console.log('Credit eligible after refresh:', isCreditEligible(res?.data));
            setIsInitialized(true);
            resolve();
          })
        );
      });
    }
    return Promise.resolve();
  }, [dispatch, isInitialized]);

  const debouncedUpdateCartItem = useRef(
    debounce((item, quantity) => updateCartItem(item, quantity), 300)
  ).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateCartItem.cancel();
    };
  }, [debouncedUpdateCartItem]);

  // Sync error handling
  useEffect(() => {
    if (syncError) {
      Toast.show(`Cart sync error: ${syncError}`, Toast.LONG);
    }
  }, [syncError]);

  // Reset payment method if user becomes ineligible for credit
  useEffect(() => {
    if (paymentMethod === 'credit' && !creditEligible) {
      setPaymentMethod('');
      Toast.show('Credit option is no longer available');
    }
  }, [creditEligible, paymentMethod]);

  // Initialize on mount only once
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (isMounted && !isInitialized) {
        try {
          await syncCartWithServer();
          await init();
        } catch (error) {
          console.error('Initialization error:', error);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once on mount

  // Refresh on focus - only sync cart, don't init profile again
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const syncOnFocus = async () => {
        if (isActive) {
          try {
            await syncCartWithServer();
          } catch (error) {
            console.error('Focus sync error:', error);
          }
        }
      };

      syncOnFocus();

      return () => {
        isActive = false;
      };
    }, [syncCartWithServer]) // Remove init from dependencies
  );

  // Refresh handler - only force refresh when explicitly called
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Only sync cart, don't force profile refresh unless needed
      await syncCartWithServer();
      Toast.show('Cart refreshed');
    } catch (error) {
      Toast.show('Failed to refresh cart');
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [syncCartWithServer]); // Remove init from dependencies

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      colors={[COLORS.primaryAppColor]}
      tintColor={COLORS.primaryAppColor}
      progressBackgroundColor={COLORS.white}
    />
  ), [refreshing, handleRefresh]);

  const SyncIndicator = useMemo(() => (
    isSyncing && (
      <Animated.View
        style={[
          styles.syncIndicator,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ActivityIndicator size="small" color={COLORS.primaryAppColor} />
        <TextComp style={styles.syncText}>Syncing cart...</TextComp>
      </Animated.View>
    )
  ), [isSyncing, fadeAnim, slideAnim]);

  // Memoized calculations
  const { subtotal, totalDiscount, taxBreakdown, finalTotal, roundOffTotal, amountRoundoff } = useMemo(() => {
    let subtotalCalc = 0;
    let totalDiscountCalc = 0;
    const taxSummary = { sgst: {}, cgst: {}, igst: {} };
    const getStockDiscount = (item) => {
      let discountPercent = 0;

      if (item.variant_details) {
        const stock = Number(item.variant_details?.stock || 0);
        const stockDiscount = Number(item.variant_details?.stock_discount || 0);

        if (item.itemQuantity >= stock && stockDiscount > 0) {
          discountPercent = stockDiscount;
        }
      } else {
        const stock = Number(item.stock || 0);
        const stockDiscount = Number(item.stock_discount || 0);

        if (item.itemQuantity >= stock && stockDiscount > 0) {
          discountPercent = stockDiscount;
        }
      }

      return discountPercent;
    };

    cartItems.forEach(item => {
      const price = safeNumber(
        item.variant_id ? item.variant_details?.price : item.price
      );
      const quantity = safeNumber(item.itemQuantity);
      const itemSubtotal = price * quantity;
      subtotalCalc += itemSubtotal;

      if (paymentMethod === 'cash') {
        const brandDiscount = safeNumber(item.brand_details?.discount);
        const stockDiscount = getStockDiscount(item);
        const discountAmount = (itemSubtotal * (brandDiscount + stockDiscount)) / 100;
        totalDiscountCalc += discountAmount;
      }

      const taxInfo = item.tax_details;
      if (!taxInfo) return;

      const baseAmount = paymentMethod === 'cash'
        ? itemSubtotal - (itemSubtotal * (safeNumber(item.brand_details?.discount) + getStockDiscount(item)) / 100)
        : itemSubtotal;

      if (userData?.state?.toLowerCase()?.trim() === SELLER_STATE) {
        const sgstPercent = safeNumber(taxInfo.sgst);
        const cgstPercent = safeNumber(taxInfo.cgst);

        if (sgstPercent > 0) {
          taxSummary.sgst[sgstPercent] = (taxSummary.sgst[sgstPercent] || 0) + (baseAmount * (sgstPercent / 100));
        }
        if (cgstPercent > 0) {
          taxSummary.cgst[cgstPercent] = (taxSummary.cgst[cgstPercent] || 0) + (baseAmount * (cgstPercent / 100));
        }
      } else {
        const igstPercent = safeNumber(taxInfo.igst);
        if (igstPercent > 0) {
          taxSummary.igst[igstPercent] = (taxSummary.igst[igstPercent] || 0) + (baseAmount * (igstPercent / 100));
        }
      }
    });

    Object.keys(taxSummary).forEach(taxType => {
      Object.keys(taxSummary[taxType]).forEach(percent => {
        taxSummary[taxType][percent] = parseFloat(taxSummary[taxType][percent].toFixed(2));
      });
    });

    const discountedSubtotal = subtotalCalc - totalDiscountCalc;
    const totalTax = Object.values(taxSummary).reduce((sum, tax) =>
      sum + Object.values(tax).reduce((s, v) => s + v, 0), 0
    );

    const finalTotalCalc = discountedSubtotal + totalTax;
    const roundOffTotalCalc = Math.round(finalTotalCalc);
    const amountRoundoffCalc = +(roundOffTotalCalc - finalTotalCalc).toFixed(2);

    return {
      subtotal: subtotalCalc,
      totalDiscount: totalDiscountCalc,
      taxBreakdown: taxSummary,
      finalTotal: finalTotalCalc,
      roundOffTotal: roundOffTotalCalc,
      amountRoundoff: amountRoundoffCalc
    };
  }, [cartItems, paymentMethod, userData?.is_from_karnataka]);


  const sortedTaxes = useMemo(() => {
    if (!taxBreakdown) return [];

    const userState = userData?.state?.toLowerCase()?.trim();
    const isSameState = userState === SELLER_STATE;

    const combined = [];

    if (isSameState) {
      // CGST + SGST ONLY
      ['cgst', 'sgst'].forEach(taxType => {
        Object.entries(taxBreakdown[taxType] || {}).forEach(([percent, amount]) => {
          combined.push({
            type: taxType.toUpperCase(),
            percent: parseFloat(percent),
            amount,
          });
        });
      });
    } else {
      // IGST ONLY
      Object.entries(taxBreakdown?.igst || {}).forEach(([percent, amount]) => {
        combined.push({
          type: 'IGST',
          percent: parseFloat(percent),
          amount,
        });
      });
    }

    return combined.sort((a, b) => a.percent - b.percent);
  }, [taxBreakdown, userData?.state]);


  const handleRemoveAll = useCallback(() => {
    Alert.alert(
      'Remove All Items',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove All',
          style: 'destructive',
          onPress: () => {
            clearCart();
            setPaymentMethod('');
            Toast.show('All items removed from cart');
          }
        },
      ]
    );
  }, [clearCart]);

  const cashHandler = useCallback(() => {
    setPaymentMethod('cash');
  }, []);

  const creditHandler = useCallback(() => {
    if (!creditEligible) {
      Alert.alert(
        'Credit Not Available',
        'Your account is not eligible for credit purchases. Please choose "Buy on Cash".',
      );
      return;
    }
    setPaymentMethod('credit');
  }, [creditEligible]);

  const toggleItemExpansion = useCallback((itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  const handleQuantityChange = useCallback((item, type) => {
    const currentQty = safeNumber(item.itemQuantity);
    const stepsize = safeNumber(
      item.variant_details !== null ? item.variant_details?.stepsize : item.size || 1
    );

    if (type === 'decrease') {
      const newQty = currentQty - stepsize;
      if (newQty <= 0) {
        Alert.alert(
          'Remove Item',
          'Are you sure you want to remove this item from cart?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => debouncedUpdateCartItem(item, 0)
            },
          ]
        );
      } else {
        debouncedUpdateCartItem(item, newQty);
      }
    } else {
      const stock = safeNumber(
        item?.variant_details?.quantity != null
          ? item.variant_details.quantity
          : item?.quantity
      );

      if (currentQty + stepsize > stock) {
        Toast.show('Maximum stock limit reached');
      } else {
        debouncedUpdateCartItem(item, currentQty + stepsize);
      }
    }
  }, [debouncedUpdateCartItem]);

  const buyHandler = useCallback(async () => {
    try {
      if (!paymentMethod) {
        Alert.alert('Select Payment Method', 'Please choose buy on CASH or buy on CREDIT .');
        return;
      }

      if (paymentMethod === 'credit' && !creditEligible) {
        Alert.alert(
          'Credit Not Available',
          'Your account is not eligible for credit purchases. Please choose "Buy on Cash".',
        );
        setPaymentMethod(''); // Reset payment method
        return;
      }

      // Show order confirmation modal instead of directly processing
      setShowOrderConfirmModal(true);

    } catch (error) {
      console.error('Order error:', error);
      Alert.alert(
        'Order Error',
        'Something went wrong while processing your order. Please try again.',
      );
    }
  }, [paymentMethod, creditEligible]);

  // New function to handle order confirmation
  const handleOrderConfirm = useCallback(async () => {
    try {
      setOrderLoading(true);

      const payload = {
        user_id: userData?.id,
        transaction_id: null,
        banner_ids: [1, 2],
        category_ids: cartItems
          .map(item => item.category_id)
          .filter(Boolean),
        product_ids: cartItems.map(item => item.product_id),
        variants_ids: cartItems.map(item => item.variant_id),
        payment_type: paymentMethod,
        tax: cartItems.map(item => safeNumber(item.tax_details?.igst)),
        unit: cartItems.map(item => item.unit_id || null),
        warranty: cartItems.map(item => item.warranty || 'No Warranty'),
        product_image: cartItems.map(item => item.display_image || ''),
        product_quantity: cartItems.map(item => safeNumber(item.itemQuantity)),
        amount: roundOffTotal,
      };

      await new Promise((resolve, reject) => {
        dispatch(
          postOrderAction(payload, response => {
            if (response?.data) {
              setPaymentStatus(response.data.status);
              if (response.data.status) {
                clearCart();
                setPaymentMethod('');
                Toast.show('Order placed successfully!');
                syncCartWithServer();

                // Show success modal

                setShowModal(true);
                setOrderId(response?.data?.branch_order_id);
                setShowOrderConfirmModal(false);
                // Auto close success modal after 3 seconds
                setTimeout(() => {
                  setShowModal(false);
                  setOrderId('');
                }, 3000);
              }
              resolve();
            } else {
              setPaymentStatus(false);
              setShowModal(true);
              reject(new Error('Order failed'));
            }
          })
        );
      });
    } catch (error) {
      console.error('Order confirmation error:', error);
      setPaymentStatus(false);
      setShowModal(true);
    } finally {
      setOrderLoading(false);
    }
  }, [paymentMethod, userData, cartItems, roundOffTotal, dispatch, clearCart, syncCartWithServer]);

  const renderProductItem = useCallback(({ item, index }) => {
    console.log('Rendering item:', item?.cart_id); // Log item being rendered
    if (!item?.cart_id) {
      return null
    }
    const isVariant = !!item.variant_id;
    const price = safeNumber(isVariant ? item.variant_details?.price : item.price);
    const quantity = safeNumber(item.itemQuantity);
    const taxRate = safeNumber(item.tax_details?.igst);
    const isExpanded = expandedItems[item.cart_id];

    const brandDiscount = safeNumber(item.brand_details?.discount);
    const getStockDiscount = (item) => {
      let discountPercent = 0;

      if (item.variant_details) {
        const stock = Number(item.variant_details?.stock || 0);
        const stockDiscount = Number(item.variant_details?.stock_discount || 0);

        if (item.itemQuantity >= stock && stockDiscount > 0) {
          discountPercent = stockDiscount;
        }
      } else {
        const stock = Number(item.stock || 0);
        const stockDiscount = Number(item.stock_discount || 0);

        if (item.itemQuantity >= stock && stockDiscount > 0) {
          discountPercent = stockDiscount;
        }
      }

      return discountPercent;
    };

    const stockDiscount = getStockDiscount(item);
    const totalDiscountPercent = paymentMethod === 'cash' ? brandDiscount + stockDiscount : 0;

    const discountedPrice = price - (price * totalDiscountPercent / 100);
    const taxAmount = (discountedPrice * taxRate) / 100;
    const finalPrice = discountedPrice + taxAmount;

    const originalTaxAmount = (price * taxRate) / 100;
    const originalFinalPrice = price + originalTaxAmount;

    const handleRemove = () => {
      Alert.alert(
        'Remove Item',
        'Are you sure you want to remove this item from cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => debouncedUpdateCartItem(item, 0)
          },
        ]
      );
    };

    return (
      <Animated.View
        style={[
          styles.itemContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 20 * index]
                })
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => toggleItemExpansion(item.cart_id)}
          activeOpacity={0.7}
        >
          <View style={styles.imageContainer}>
            <FastImage
              style={styles.productImage}
              resizeMode={FastImage.resizeMode.contain}
              source={
                item?.display_image
                  ? {
                    uri: item.display_image,
                    priority: FastImage.priority.high,
                    cache: FastImage.cacheControl.immutable,
                  }
                  : IMAGES.NO_PRODUCT_IMG
              }
            />
            {item?.itemQuantity == item?.quantity && (
              <View style={styles.stockLimitTag}>
                <TextComp style={styles.stockLimitText}>Maximum quantity reached</TextComp>
              </View>
            )}
            {totalDiscountPercent > 0 && paymentMethod === 'cash' && (
              <View style={styles.discountBadge}>
                <TextComp style={styles.discountBadgeText}>
                  {totalDiscountPercent}% OFF
                </TextComp>
              </View>
            )}
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.itemHeader}>
              <TextComp style={styles.brandText} numberOfLines={1}>
                {item.brand_details?.name}
              </TextComp>
              <Icon
                type="MaterialIcons"
                name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={20}
                color={COLORS.primaryTextColor}
              />
            </View>
            <TextComp style={styles.productName} numberOfLines={2}>
              {item.product_name}
            </TextComp>
            {isVariant && (
              <TextComp style={styles.sizeText}>
                Size: {item.variant_details?.size}
              </TextComp>
            )}

            <View style={styles.priceSection}>
              <View style={styles.priceRow}>
                <View style={styles.priceContainer}>
                  <TextComp
                    style={[
                      styles.originalPrice,
                      paymentMethod === 'cash' && totalDiscountPercent > 0 && styles.strikethrough,
                    ]}
                  >
                    ₹{(Math.round(truncateTo2Decimals(originalFinalPrice) * 100) / 100).toFixed(2)} x {quantity}
                  </TextComp>
                  <TextComp style={[styles.totalText, paymentMethod === 'cash' && totalDiscountPercent > 0 && styles.strikethrough]}>
                    ₹{(Math.round(originalFinalPrice * quantity * 100) / 100).toFixed(2)}
                  </TextComp>
                </View>
              </View>
              {paymentMethod === 'cash' && totalDiscountPercent > 0 && (
                <View style={styles.discountedRow}>
                  <TextComp style={styles.discountedPrice}>
                    ₹{(Math.round(truncateTo2Decimals(finalPrice) * 100) / 100).toFixed(2)} x {quantity}
                  </TextComp>
                  <TextComp style={styles.discountedTotal}>
                    ₹{(Math.round(finalPrice * quantity * 100) / 100).toFixed(2)}
                  </TextComp>
                </View>
              )}
            </View>

            {isExpanded && (
              <Animated.View
                style={[
                  styles.expandedDetails,
                  {
                    opacity: fadeAnim,
                  }
                ]}
              >
                <View style={styles.detailRow}>
                  <TextComp style={styles.detailLabel}>Base Price:</TextComp>
                  <TextComp style={styles.detailValue}>₹{price.toFixed(2)}</TextComp>
                </View>
                {paymentMethod === 'cash' && brandDiscount > 0 && (
                  <View style={styles.detailRow}>
                    <TextComp style={styles.detailLabel}>Discount:</TextComp>
                    <TextComp style={styles.discountValue}>-{brandDiscount}%</TextComp>
                  </View>
                )}
                {paymentMethod === 'cash' && stockDiscount > 0 && (
                  <View style={styles.detailRow}>
                    <TextComp style={styles.detailLabel}>Bulk Discount:</TextComp>
                    <TextComp style={styles.discountValue}>-{stockDiscount}%</TextComp>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <TextComp style={styles.detailLabel}>Tax ({taxRate}%):</TextComp>
                  <TextComp style={styles.detailValue}>₹{taxAmount.toFixed(2)}</TextComp>
                </View>
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.quantityControls}>
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeButton}
            disabled={isSyncing}
          >
            <Icon type="EvilIcons" name="trash" color={COLORS.white} size={20} />
            <TextComp style={styles.cartButtonText}>Remove</TextComp>
          </TouchableOpacity>

          <View style={styles.quantitySection}>
            <TextComp style={styles.quantityLabel}>Qty:</TextComp>
            <View style={styles.quantityButtons}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(item, 'decrease')}
                style={styles.quantityButton}
                disabled={isSyncing}
              >
                <Icon type="AntDesign" name="minus" color={COLORS.white} size={16} />
              </TouchableOpacity>
              {isSyncing ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <View style={styles.quantityDisplay}>
                  <TextComp style={styles.quantityText}>
                    {quantity}
                  </TextComp>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleQuantityChange(item, 'increase')}
                style={styles.quantityButton}
                disabled={isSyncing}
              >
                <Icon type="AntDesign" name="plus" color={COLORS.white} size={16} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }, [paymentMethod, debouncedUpdateCartItem, handleQuantityChange, isSyncing, expandedItems, toggleItemExpansion, fadeAnim, slideAnim]);

  const renderFooter = useCallback(() => (
    <Animated.View
      style={[
        styles.footerContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Payment Method Section */}
      <View style={styles.paymentCard}>
        <TextComp style={styles.sectionTitle}>Select Payment Method</TextComp>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            onPress={cashHandler}
            style={[
              styles.paymentOption,
              paymentMethod === 'cash' && styles.paymentOptionSelected
            ]}
            disabled={isSyncing}
          >
            <View style={styles.paymentOptionContent}>
              <Icon
                type="MaterialIcons"
                name={paymentMethod === 'cash' ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={paymentMethod === 'cash' ? COLORS.white : COLORS.primaryTextColor}
              />
              <TextComp style={[
                styles.paymentText,
                paymentMethod === 'cash' && styles.paymentTextSelected
              ]}>Buy on Cash</TextComp>
            </View>
            {paymentMethod === 'cash' && totalDiscount > 0 && (
              <View style={styles.discountTag}>
                <TextComp style={styles.discountTagText}>You have saved ₹{totalDiscount.toFixed(2)}</TextComp>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isCreditAllowed ? creditHandler : null}
            style={[
              styles.paymentOption,
              paymentMethod === 'credit' && styles.paymentOptionSelected,
              !isCreditAllowed && styles.disabledPaymentOption
            ]}
            disabled={!isCreditAllowed || isSyncing}
          >
            <View style={styles.paymentOptionContent}>
              <Icon
                type="MaterialIcons"
                name={paymentMethod === 'credit'
                  ? 'radio-button-checked'
                  : 'radio-button-unchecked'}
                size={20}
                color={
                  !isCreditAllowed
                    ? COLORS.disabledText
                    : paymentMethod === 'credit'
                      ? COLORS.white
                      : COLORS.primaryTextColor
                }
              />

              <TextComp style={[
                styles.paymentText,
                paymentMethod === 'credit' && styles.paymentTextSelected,
                !isCreditAllowed && styles.disabledPaymentText
              ]}>
                Buy on Credit
              </TextComp>
            </View>

            {!isCreditAllowed && (
              <View style={styles.creditLockedTag}>
                <TextComp style={styles.creditLockedText}>Not Available</TextComp>
              </View>
            )}
          </TouchableOpacity>

        </View>
      </View>

      {/* Price Breakdown Section */}
      <View style={styles.priceCard}>
        <TextComp style={styles.sectionTitle}>Price Details</TextComp>

        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <TextComp style={styles.priceLabel}>Subtotal ({cartItems.length} items)</TextComp>
            <TextComp style={styles.priceValue}>₹{truncateTo2Decimals(subtotal).toFixed(2)}</TextComp>
          </View>

          {totalDiscount > 0 && (
            <View style={styles.priceRow}>
              <TextComp style={styles.priceLabel}>Discount</TextComp>
              <TextComp style={styles.discountValue}>-₹{totalDiscount.toFixed(2)}</TextComp>
            </View>
          )}

          {sortedTaxes.map((item, index) => (
            <View key={`${item.type}-${item.percent}-${index}`} style={styles.priceRow}>
              <TextComp style={styles.priceLabel}>{item.type} ({item.percent}%)</TextComp>
              <TextComp style={styles.taxValue}>₹{item.amount.toFixed(2)}</TextComp>
            </View>
          ))}

          {amountRoundoff !== 0 && (
            <View style={styles.priceRow}>
              <TextComp style={styles.priceLabel}>Roundoff</TextComp>
              <TextComp style={styles.roundoffValue}>
                {amountRoundoff >= 0 ? '+' : '-'}₹{Math.abs(amountRoundoff).toFixed(2)}
              </TextComp>
            </View>
          )}
        </View>

        <View style={styles.finalTotal}>
          <TextComp style={styles.finalTotalLabel}>Total Amount</TextComp>
          <TextComp style={styles.finalTotalValue}>₹{roundOffTotal}</TextComp>
        </View>
      </View>


    </Animated.View>
  ), [
    subtotal, totalDiscount, sortedTaxes, amountRoundoff, roundOffTotal,
    paymentMethod, cashHandler, creditHandler, isSyncing,
    cartItems.length, fadeAnim, slideAnim, meta?.by_users
  ]);

  const renderEmptyCart = useCallback(() => (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Image
        source={IMAGES.EMPTY_CART}
        resizeMode="contain"
        style={styles.emptyImage}
      />
      <TextComp style={styles.noItemText}>Your cart is empty</TextComp>
      <TextComp style={styles.emptySubtext}>
        Looks like you haven't added anything to your cart yet
      </TextComp>
      <View style={styles.emptyButtons}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.primaryButton}
        >
          <Icon type="MaterialIcons" name="arrow-back" size={16} color={COLORS.white} />
          <TextComp style={styles.primaryButtonText}>Continue Shopping</TextComp>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate(SCREEN.MY_ORDERS)}
          style={styles.secondaryButton}
        >
          <Icon type="MaterialIcons" name="receipt-long" size={16} color={COLORS.primaryAppColor} />
          <TextComp style={styles.secondaryButtonText}>View Orders</TextComp>
        </TouchableOpacity>
      </View>
    </Animated.View>
  ), [navigation, fadeAnim, slideAnim]);

  return (
    <Wrapper
      useBottomInset={false}
      childrenStyles={styles.wrapper}
    >
      {SyncIndicator}

      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon type="MaterialIcons" name="arrow-back" color={COLORS.secondaryAppColor} size={24} />
          </TouchableOpacity>
          <View>
            <TextComp style={styles.headerTitle}>Shopping Cart</TextComp>
            <TextComp style={styles.itemCount}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </TextComp>
          </View>
        </View>
        {cartItems.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.iconButton}
              disabled={isSyncing}
            >
              <Icon type="MaterialIcons" name="refresh" color={COLORS.primaryAppColor} size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRemoveAll}
              style={styles.iconButton}
              disabled={isSyncing}
            >
              <Icon type="MaterialIcons" name="delete-sweep" color={COLORS.red} size={22} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {cartItems.length > 0 ? (
        <FlatList
          data={cartItems}
          renderItem={renderProductItem}
          keyExtractor={item => `cart-${item.cart_id}`}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <TextComp style={styles.listHeaderText}>
                Review your items
              </TextComp>
            </View>
          }
        />
      ) : (
        renderEmptyCart()
      )}

      {cartItems.length > 0 && (
        <Animated.View
          style={[
            styles.bottomBar,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.bottomBarContent}>
            <View style={styles.totalSection}>
              <TextComp style={styles.totalLabel}>Total:</TextComp>
              <TextComp style={styles.totalAmount}>₹{roundOffTotal}</TextComp>
            </View>
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                (isSyncing || loading) && styles.disabledButton
              ]}
              onPress={buyHandler}
              disabled={isSyncing || loading}
            >
              {loading || isSyncing ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <View style={styles.checkoutContent}>
                  <TextComp style={styles.checkoutText}>
                    Proceed
                  </TextComp>
                  <Icon
                    type="MaterialIcons"
                    name="arrow-forward"
                    color={COLORS.white}
                    size={16}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        visible={showOrderConfirmModal}
        onClose={() => setShowOrderConfirmModal(false)}
        onConfirm={handleOrderConfirm}
        paymentMethod={paymentMethod}
        totalAmount={roundOffTotal}
        loading={orderLoading}
        isCreditEligible={creditEligible}
      />

      <PaymentSuccessModal
        visible={showModal}
        orderId={orderId}
        onClose={() => setShowModal(false)}
        paymentStatus={paymentStatus}
        loading={loading}
      />
    </Wrapper>
  );
};


const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    flex: 1,
    width: width,
  },
  header: {
    height: verticalScale(70),
    width: width,
    paddingHorizontal: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  backButton: {
    padding: moderateScale(4),
  },
  headerTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: COLORS.secondaryAppColor,
  },
  itemCount: {
    fontSize: scale(12),
    color: COLORS.primaryTextColor,
    marginTop: scale(2),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  iconButton: {
    padding: moderateScale(6),
  },
  listHeader: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: COLORS.greyOpacity(0.1),
  },
  listHeaderText: {
    fontSize: scale(14),
    color: COLORS.primaryTextColor,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: verticalScale(100),
  },
  itemContainer: {
    marginHorizontal: moderateScale(16),
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  itemContent: {
    padding: moderateScale(16),
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: scale(8),
  },
  stockLimitTag: {
    position: 'absolute',
    top: scale(6),
    right: scale(0),
    backgroundColor: COLORS.white,
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  stockLimitText: {
    color: '#FFA500',
    fontSize: scale(10),
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: scale(-8),
    left: scale(-8),
    backgroundColor: COLORS.green,
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  discountBadgeText: {
    fontSize: scale(8),
    color: COLORS.white,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scale(4),
  },
  brandText: {
    fontSize: scale(12),
    color: COLORS.secondaryAppColor,
    fontWeight: '600',
    flex: 1,
  },
  productName: {
    fontSize: scale(14),
    color: COLORS.secondaryAppColor,
    fontWeight: '500',
    marginBottom: scale(4),
  },
  sizeText: {
    fontSize: scale(12),
    color: COLORS.primaryTextColor,
    marginBottom: scale(8),
  },
  priceSection: {
    marginTop: scale(4),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  originalPrice: {
    fontSize: scale(12),
    fontWeight: '500',
    color: COLORS.secondaryAppColor,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: COLORS.primaryTextColor,
  },
  totalText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: COLORS.green,
  },
  discountedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(2),
  },
  discountedPrice: {
    fontSize: scale(13),
    fontWeight: '600',
    color: COLORS.green,
  },
  discountedTotal: {
    fontSize: scale(13),
    fontWeight: '600',
    color: COLORS.green,
  },
  expandedDetails: {
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyOpacity(0.3),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  detailLabel: {
    fontSize: scale(11),
    color: COLORS.primaryTextColor,
  },
  detailValue: {
    fontSize: scale(11),
    color: COLORS.secondaryAppColor,
    fontWeight: '500',
  },
  discountValue: {
    fontSize: scale(11),
    color: COLORS.green,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    backgroundColor: COLORS.primaryAppColor,
    borderBottomLeftRadius: scale(12),
    borderBottomRightRadius: scale(12),
    paddingVertical: scale(8)
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  cartButtonText: {
    fontSize: scale(12),
    color: COLORS.white,
    fontWeight: '500',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  quantityLabel: {
    fontSize: scale(12),
    color: COLORS.white,
    fontWeight: '500',
  },
  quantityButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: scale(20),
    padding: scale(2),
  },
  quantityButton: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: COLORS.primaryAppColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    minWidth: scale(30),
    alignItems: 'center',
  },
  quantityText: {
    fontSize: scale(14),
    color: COLORS.primaryAppColor,
    fontWeight: '600',
  },
  footerContainer: {
    padding: moderateScale(16),
    gap: verticalScale(16),
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    padding: moderateScale(16),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: scale(16),
  },
  paymentOptions: {
    gap: scale(12),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(12),
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: scale(8),
  },
  paymentOptionSelected: {
    borderColor: COLORS.primaryAppColor,
    backgroundColor: COLORS.primaryAppColor + '10',
  },
  disabledPaymentOption: {
    opacity: 0.5,
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentText: {
    marginLeft: scale(10),
    fontSize: scale(14),
    color: COLORS.secondaryAppColor,
    fontWeight: '500',
  },
  paymentTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  disabledPaymentText: {
    color: COLORS.primaryTextColor,
    opacity: 0.5,
  },
  discountTag: {
    backgroundColor: COLORS.green,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(4),
  },
  discountTagText: {
    fontSize: scale(10),
    color: COLORS.white,
    fontWeight: 'bold',
  },
  creditLockedTag: {
    backgroundColor: COLORS.lightRed,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(4),

  },
  creditLockedText: {
    fontSize: scale(10),
    color: COLORS.red,
    fontWeight: 'bold',
  },
  priceCard: {
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    padding: moderateScale(16),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  priceBreakdown: {
    gap: scale(8),
    marginBottom: scale(16),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: scale(14),
    color: COLORS.primaryTextColor,
  },
  priceValue: {
    fontSize: scale(14),
    color: COLORS.black,
    fontWeight: '500',
  },
  discountValue: {
    fontSize: scale(14),
    color: COLORS.green,
    fontWeight: '500',
  },
  taxValue: {
    fontSize: scale(14),
    color: COLORS.secondaryTextColor,
    fontWeight: '500',
  },
  roundoffValue: {
    fontSize: scale(14),
    color: COLORS.secondaryTextColor,
    fontWeight: '500',
  },
  finalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  finalTotalLabel: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: COLORS.black,
  },
  finalTotalValue: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: COLORS.primaryAppColor,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    padding: scale(12),
  },
  securityText: {
    fontSize: scale(12),
    color: COLORS.primaryTextColor,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: moderateScale(16),
    paddingVertical: scale(12),
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: scale(14),
    color: COLORS.primaryTextColor,
    marginBottom: scale(2),
  },
  totalAmount: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: COLORS.primaryAppColor,
  },
  checkoutButton: {
    backgroundColor: COLORS.primaryAppColor,
    paddingVertical: scale(14),
    paddingHorizontal: scale(24),
    borderRadius: scale(25),
    minWidth: scale(140),
  },
  checkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
  },
  checkoutText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  disabledButton: {
    backgroundColor: COLORS.primaryTextColor,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(32),
  },
  emptyImage: {
    height: scale(200),
    width: scale(200),
    marginBottom: scale(24),
  },
  noItemText: {
    color: COLORS.secondaryAppColor,
    fontSize: scale(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  emptySubtext: {
    color: COLORS.primaryTextColor,
    fontSize: scale(14),
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: scale(32),
  },
  emptyButtons: {
    gap: scale(12),
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primaryAppColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(14),
    borderRadius: scale(25),
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(14),
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: COLORS.primaryAppColor,
  },
  secondaryButtonText: {
    color: COLORS.primaryAppColor,
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  syncIndicator: {
    position: 'absolute',
    top: verticalScale(80),
    right: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.greyOpacity(0.2),
  },
  syncText: {
    marginLeft: scale(6),
    fontSize: scale(12),
    color: COLORS.black,
    fontWeight: '500',
  },
});

export default React.memo(Cart); styles