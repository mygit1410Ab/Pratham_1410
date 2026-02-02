import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { COLORS } from '../../../res/colors';
import Wrapper from '../../components/wrapper';
import Icon from '../../../utils/icon';
import TextComp from '../../components/textComp';
import { cancelOrdersAction, trackOrdersAction } from '../../../redux/action';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { width } from '../../hooks/responsive';

/* ---------------- HELPERS ---------------- */
const isTrue = v => v === true || v === 1 || v === '1' || v === 'true';

/* ---------------- STATUS FLOW & CONFIG ---------------- */
// Updated STATUS_FLOW to match your order statuses
const STATUS_FLOW = ['pending', 'accepted', 'partially_billed', 'billed', 'complete'];

export const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: 'clockcircleo',
    color: '#FFA726',
    description: 'Your order is pending confirmation',
  },
  accepted: {
    label: 'Accepted',
    icon: 'checkcircle',
    color: '#29B6F6',
    description: 'Order has been accepted',
  },
  partially_billed: {
    label: 'Partially Billed',
    icon: 'FontAwesome5',
    name: 'file-invoice',
    color: '#AB47BC',
    description: 'Order is partially processed',
  },
  billed: {
    label: 'Billed',
    icon: 'check-square',
    color: '#7E57C2',
    description: 'Order has been fully billed',
  },
  complete: {
    label: 'Complete',
    icon: 'smileo',
    color: '#66BB6A',
    description: 'Order completed successfully',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'closecircleo',
    color: '#EF5350',
    description: 'Order has been cancelled',
  },

  'partially billed': {
    label: 'Partially Billed',
    icon: 'FontAwesome5',
    name: 'file-invoice',
    color: '#AB47BC',
    description: 'Order is partially processed',
  },
};

export default function OrderStatus() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const params = useRoute().params || {};
  const SUPPORT_PHONE = '+919342222373';

  // State management
  const [order, setOrder] = useState(params.order || null);
  console.log('order_number', order)
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // Extract order_id safely
  const order_id = params.order_id || params?.order?.order_id || params;

  /* ---------------- ANIMATIONS ---------------- */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  /* ---------------- LIVE TRACKING ---------------- */
  const refresh = useCallback(async (showLoader = false) => {
    if (!order_id) return;

    if (showLoader) {
      setRefreshing(true);
    }

    Animated.timing(rotationAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => rotationAnim.setValue(0));

    dispatch(trackOrdersAction({ order_id }, res => {
      if (showLoader) setRefreshing(false);

      if (res?.data?.status) {
        setOrder(res.data.data);
        Toast.showWithGravity('Order status updated', Toast.SHORT, Toast.BOTTOM);
      } else {
        Toast.showWithGravity(
          res?.data?.message || 'Unable to refresh order',
          Toast.LONG,
          Toast.BOTTOM
        );
      }
    }));
  }, [order_id]);

  // Initial load
  useEffect(() => {
    refresh(false);

    // Auto-refresh every 30 seconds if order is active (not complete or cancelled)
    if (order && order.status && !['complete', 'cancelled'].includes(order.status.toLowerCase())) {
      const interval = setInterval(() => {
        refresh(false);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [order_id, order?.status]);

  /* ---------------- CANCEL ORDER ---------------- */
  const cancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        {
          text: 'Go Back',
          style: 'cancel',
        },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => {
            setLoadingCancel(true);
            dispatch(cancelOrdersAction({ order_id }, res => {
              setLoadingCancel(false);
              if (res?.data?.status) {
                Toast.showWithGravity(
                  'Order cancelled successfully',
                  Toast.SHORT,
                  Toast.BOTTOM
                );
                // Update local order status to cancelled
                if (order) {
                  setOrder({
                    ...order,
                    status: 'cancelled'
                  });
                }
              } else {
                Alert.alert(
                  'Cancellation Failed',
                  res?.data?.message || 'Unable to cancel order. Please try again.'
                );
              }
            }));
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleCallSupport = async () => {
    const phoneUrl =
      Platform.OS === 'android'
        ? `tel:${SUPPORT_PHONE}`
        : `telprompt:${SUPPORT_PHONE}`;

    try {
      const supported = await Linking.canOpenURL(phoneUrl);

      if (!supported) {
        Alert.alert('Error', 'Calling is not supported on this device');
        return;
      }

      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('Call error:', error);
      Alert.alert('Error', 'Unable to make the call');
    }
  };

  /* ---------------- RENDER HELPERS ---------------- */
  if (!order) {
    return (
      <Wrapper childrenStyles={styles.wrapper}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondaryAppColor} />
          <TextComp style={styles.loadingText}>Loading order details...</TextComp>
        </View>
      </Wrapper>
    );
  }

  const status = order.status.toLowerCase();
  const isCancelled = status === 'cancelled';

  // Handle status mapping - convert "partially billed" to "partially_billed"
  const normalizedStatus = status.replace(/\s+/g, '_');

  // For cancelled orders, we show all steps but with cancelled styling
  let activeIndex = STATUS_FLOW.indexOf(normalizedStatus);

  // If status not found in flow, default to pending
  if (activeIndex === -1) {
    activeIndex = 0;
  }

  const canCancel = isTrue(order?.can_cancel) && !isCancelled && status === 'pending';
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;

  // For cancelled orders, stop at the step before cancelled
  const progressPercentage = isCancelled ?
    0 : // For cancelled orders, don't show progress
    ((activeIndex + 1) / STATUS_FLOW.length) * 100;

  const rotateInterpolate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Wrapper childrenStyles={styles.wrapper}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh(true)}
            colors={[COLORS.secondaryAppColor]}
            tintColor={COLORS.secondaryAppColor}
            progressBackgroundColor="#fff"
          />
        }
      >
        {/* HEADER */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: isCancelled ? COLORS.red : COLORS.secondaryAppColor
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" type="Feather" size={scale(20)} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <TextComp style={styles.headerTitle}>Order #{params.order.order_number}</TextComp>
            <TextComp style={styles.headerSubtitle}>
              {isCancelled ? 'Order Cancelled' : 'Track your order'}
            </TextComp>
          </View>

          {!isCancelled && (
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <TouchableOpacity
                onPress={() => refresh(true)}
                style={styles.refreshButton}
                activeOpacity={0.7}
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="refresh-cw" type="Feather" size={scale(18)} color="#fff" />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* STATUS SUMMARY WITH PROGRESS */}
        <Animated.View
          style={[
            styles.summaryCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              borderLeftWidth: isCancelled ? 4 : 0,
              borderLeftColor: isCancelled ? COLORS.red : 'transparent'
            }
          ]}
        >
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
            <View style={styles.statusInfo}>
              <TextComp style={styles.statusLabel}>{statusConfig.label}</TextComp>
              <TextComp style={styles.statusDescription}>{statusConfig.description}</TextComp>
              {isCancelled && order.cancelled_at && (
                <TextComp style={styles.cancelledTime}>
                  Cancelled on: {order.cancelled_at}
                </TextComp>
              )}
            </View>
          </View>

          {/* PROGRESS BAR - Hide for cancelled orders */}
          {!isCancelled && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: statusConfig.color
                    }
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <TextComp style={styles.progressText}>Order Placed</TextComp>
                <TextComp style={styles.progressText}>{progressPercentage.toFixed(0)}%</TextComp>
                <TextComp style={styles.progressText}>Complete</TextComp>
              </View>
            </View>
          )}

          {/* ORDER SUMMARY */}
          <TouchableOpacity
            onPress={() => setShowDetails(!showDetails)}
            style={styles.detailsToggle}
            activeOpacity={0.8}
            disabled={isCancelled}
          >
            <View style={styles.summaryRow}>
              <View>
                <TextComp style={[
                  styles.amount,
                  isCancelled && { color: COLORS.red, textDecorationLine: 'line-through' }
                ]}>
                  ₹{order.total_amount || order.grand_total || 0}
                </TextComp>
                <TextComp style={styles.subText}>
                  {order.total_items || 0} items • {order.payment_type || 'N/A'}
                </TextComp>
              </View>
              {!isCancelled && (
                <Icon
                  name={showDetails ? 'chevron-up' : 'chevron-down'}
                  type="Feather"
                  size={scale(20)}
                  color={COLORS.secondaryAppColor}
                />
              )}
            </View>
          </TouchableOpacity>

          {/* EXPANDABLE DETAILS */}
          {showDetails && !isCancelled && (
            <Animated.View
              style={[
                styles.expandedDetails,
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.detailRow}>
                <TextComp style={styles.detailLabel}>Order ID:</TextComp>
                <TextComp style={styles.detailValue}>{order.order_number || order_id}</TextComp>
              </View>
              <View style={styles.detailRow}>
                <TextComp style={styles.detailLabel}>Order Date:</TextComp>
                <TextComp style={styles.detailValue}>{order.order_date || 'N/A'}</TextComp>
              </View>
              <View style={styles.detailRow}>
                <TextComp style={styles.detailLabel}>Payment Method:</TextComp>
                <TextComp style={styles.detailValue}>{order.payment_type || 'N/A'}</TextComp>
              </View>
              {order.user_details?.address && (
                <View style={styles.detailRow}>
                  <TextComp style={styles.detailLabel}>Delivery Address:</TextComp>
                  <TextComp style={styles.detailValue}>{order.user_details.address}</TextComp>
                </View>
              )}
            </Animated.View>
          )}
        </Animated.View>

        {/* TIMELINE STEPS - Modified for cancelled orders */}
        <View style={styles.timelineContainer}>
          <TextComp style={styles.timelineTitle}>
            {isCancelled ? 'Order Journey (Cancelled)' : 'Order Journey'}
          </TextComp>

          {/* Show cancelled status first if order is cancelled */}
          {isCancelled && (
            <View style={[styles.timelineStep, styles.cancelledStep]}>
              <View style={styles.stepCircleContainer}>
                <View style={[styles.stepCircle, { borderColor: COLORS.red }]}>
                  <Icon
                    name="closecircleo"
                    type="AntDesign"
                    size={scale(14)}
                    color={COLORS.red}
                  />
                </View>
              </View>
              <View style={styles.stepContent}>
                <TextComp style={[styles.stepLabel, { color: COLORS.red }]}>
                  Cancelled
                </TextComp>
                <TextComp style={styles.stepDescription}>
                  This order has been cancelled
                </TextComp>
              </View>
            </View>
          )}

          {/* Show normal timeline steps for active orders */}
          {!isCancelled && STATUS_FLOW.map((step, index) => {
            const stepConfig = STATUS_CONFIG[step];
            const isActive = index <= activeIndex;
            const isCurrent = index === activeIndex;

            return (
              <View key={step} style={styles.timelineStep}>
                {/* CONNECTION LINE */}
                {index > 0 && (
                  <View
                    style={[
                      styles.connectorLine,
                      isActive && { backgroundColor: stepConfig.color }
                    ]}
                  />
                )}

                {/* STEP CIRCLE */}
                <View style={styles.stepCircleContainer}>
                  <View
                    style={[
                      styles.stepCircle,
                      isActive && { borderColor: stepConfig.color },
                      isCurrent && styles.stepCircleCurrent
                    ]}
                  >
                    <Icon
                      name={stepConfig.icon}
                      type="AntDesign"
                      size={scale(14)}
                      color={isActive ? stepConfig.color : '#ccc'}
                    />
                    {isCurrent && (
                      <View
                        style={[
                          styles.pulseRing,
                          { borderColor: stepConfig.color }
                        ]}
                      />
                    )}
                  </View>
                </View>

                {/* STEP CONTENT */}
                <View style={styles.stepContent}>
                  <TextComp style={[
                    styles.stepLabel,
                    isActive && { color: stepConfig.color, fontWeight: '700' }
                  ]}>
                    {stepConfig.label}
                  </TextComp>
                  <TextComp style={styles.stepDescription}>
                    {stepConfig.description}
                  </TextComp>
                  {isCurrent && order.estimated_time && (
                    <View style={styles.etaContainer}>
                      <Icon name="clock" type="Feather" size={12} color={stepConfig.color} />
                      <TextComp style={[styles.etaText, { color: stepConfig.color }]}>
                        ETA: {order.estimated_time}
                      </TextComp>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionButtons}>
          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelBtn, loadingCancel && styles.buttonDisabled]}
              onPress={cancelOrder}
              activeOpacity={0.7}
              disabled={loadingCancel}
            >
              {loadingCancel ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="closecircleo" type="AntDesign" size={16} color="#fff" />
              )}
              <TextComp style={styles.cancelText}>
                {loadingCancel ? 'Cancelling...' : 'Cancel Order'}
              </TextComp>
            </TouchableOpacity>
          )}

          {/* {!isCancelled && (status === 'billed' || normalizedStatus === 'billed') && (
            <TouchableOpacity
              style={styles.trackRiderBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('LiveTracking', { order_id })}
            >
              <Icon name="map-pin" type="Feather" size={16} color="#fff" />
              <TextComp style={styles.trackRiderText}>Track Delivery</TextComp>
            </TouchableOpacity>
          )} */}

          <TouchableOpacity
            style={styles.helpBtn}
            activeOpacity={0.7}
            onPress={handleCallSupport}
          >
            <Icon name="headphones" type="Feather" size={16} color={COLORS.secondaryAppColor} />
            <TextComp style={styles.helpText}>Need Help?</TextComp>
          </TouchableOpacity>

          {/* Reorder button for cancelled or completed orders */}
          {(isCancelled || status === 'complete') && isTrue(order?.can_reorder) && (
            <TouchableOpacity
              style={styles.reorderBtn}
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to reorder functionality
                Toast.showWithGravity('Reorder functionality coming soon!', Toast.SHORT, Toast.BOTTOM);
              }}
            >
              <Icon name="refresh" type="Feather" size={16} color="#fff" />
              <TextComp style={styles.reorderText}>Reorder</TextComp>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </Wrapper>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: width
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.greyOpacity(1),
    fontSize: scale(14),
  },
  header: {
    height: verticalScale(70),
    paddingHorizontal: moderateScale(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    height: verticalScale(40),
    width: verticalScale(40),
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: moderateScale(10),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: scale(12),
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    height: verticalScale(40),
    width: verticalScale(40),
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    margin: moderateScale(16),
    padding: moderateScale(20),
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  statusIndicator: {
    width: scale(12),
    height: scale(12),
    borderRadius: 6,
    marginRight: moderateScale(10),
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: scale(16),
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statusDescription: {
    fontSize: scale(12),
    color: COLORS.greyOpacity(1),
    marginTop: 2,
  },
  cancelledTime: {
    fontSize: scale(11),
    color: COLORS.red,
    marginTop: 4,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginBottom: moderateScale(20),
  },
  progressBackground: {
    height: verticalScale(8),
    backgroundColor: COLORS.greyOpacity(0.2),
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: moderateScale(8),
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: scale(10),
    color: COLORS.greyOpacity(0.8),
    fontWeight: '500',
  },
  detailsToggle: {
    marginTop: moderateScale(10),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: scale(24),
    fontWeight: '800',
    color: COLORS.secondaryAppColor,
  },
  subText: {
    color: COLORS.greyOpacity(1),
    fontSize: scale(12),
    marginTop: 4,
  },
  expandedDetails: {
    marginTop: moderateScale(20),
    paddingTop: moderateScale(15),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyOpacity(0.1),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  detailLabel: {
    fontSize: scale(12),
    color: COLORS.greyOpacity(0.8),
    fontWeight: '500',
  },
  detailValue: {
    fontSize: scale(12),
    color: COLORS.textDark,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: moderateScale(10),
  },
  timelineContainer: {
    backgroundColor: COLORS.white,
    margin: moderateScale(16),
    marginTop: 0,
    padding: moderateScale(20),
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  timelineTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: moderateScale(25),
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: moderateScale(30),
    minHeight: verticalScale(60),
  },
  cancelledStep: {
    marginBottom: moderateScale(20),
  },
  stepCircleContainer: {
    width: moderateScale(50),
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: 19,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.greyOpacity(0.3),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleCurrent: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: 25,
    borderWidth: 2,
    opacity: 0.4,
  },
  connectorLine: {
    position: 'absolute',
    top: moderateScale(38),
    left: moderateScale(25),
    width: 2,
    height: '100%',
    backgroundColor: COLORS.greyOpacity(0.2),
    zIndex: 1,
  },
  stepContent: {
    flex: 1,
    marginLeft: moderateScale(15),
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: scale(14),
    color: COLORS.greyOpacity(0.9),
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: scale(12),
    color: COLORS.greyOpacity(0.7),
    marginTop: 2,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(5),
  },
  etaText: {
    fontSize: scale(11),
    fontWeight: '600',
    marginLeft: moderateScale(5),
  },
  actionButtons: {
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(20),
    gap: moderateScale(12),
  },
  cancelBtn: {
    backgroundColor: '#EF5350',
    paddingVertical: verticalScale(16),
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(10),
    elevation: 6,
    shadowColor: '#EF5350',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  trackRiderBtn: {
    backgroundColor: COLORS.secondaryAppColor,
    paddingVertical: verticalScale(16),
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(10),
    elevation: 6,
    shadowColor: COLORS.secondaryAppColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  helpBtn: {
    backgroundColor: COLORS.white,
    paddingVertical: verticalScale(16),
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(10),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.greyOpacity(0.2),
  },
  reorderBtn: {
    backgroundColor: COLORS.green,
    paddingVertical: verticalScale(16),
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(10),
    elevation: 6,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cancelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: scale(14),
  },
  trackRiderText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: scale(14),
  },
  helpText: {
    color: COLORS.secondaryAppColor,
    fontWeight: '700',
    fontSize: scale(14),
  },
  reorderText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: scale(14),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});