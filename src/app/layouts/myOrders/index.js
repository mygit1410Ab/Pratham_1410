import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  Animated,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Icon from '../../../utils/icon';
import { COLORS } from '../../../res/colors';
import { width } from '../../hooks/responsive';
import TextComp from '../../components/textComp';
import Wrapper from '../../components/wrapper';
import { IMAGES } from '../../../res/images';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SCREEN } from '..';
import { useDispatch } from 'react-redux';
import { cancelOrdersAction, getOrdersAction } from '../../../redux/action';
import Toast from 'react-native-simple-toast';
// import LottieView from 'lottie-react-native';

/* ------------------------------ BACKEND STATUS MAP ------------------------------ */

const ORDER_STATUS = {
  pending: {
    label: 'Pending',
    color: '#F59E0B',
    icon: 'clock',
    iconType: 'Feather',
    gradient: ['#FEF3C7', '#FBBF24'],
  },

  accepted: {
    label: 'Confirmed',
    color: '#2563EB',
    icon: 'checkcircle',
    iconType: 'AntDesign',
    gradient: ['#DBEAFE', '#60A5FA'],
  },

  partially_billed: {
    label: 'Processing',
    color: '#F97316',
    icon: 'loading1',
    iconType: 'AntDesign',
    gradient: ['#FED7AA', '#FB923C'],
  },

  billed: {
    label: 'Shipped',
    color: '#8B5CF6',
    icon: 'truck-fast',
    iconType: 'MaterialCommunityIcons',
    gradient: ['#E9D5FF', '#A855F7'],
  },

  complete: {
    label: 'Delivered',
    color: '#16A34A',
    icon: 'check-circle',
    iconType: 'Feather',
    gradient: ['#DCFCE7', '#4ADE80'],
  },

  cancelled: {
    label: 'Cancelled',
    color: '#DC2626',
    icon: 'x-circle',
    iconType: 'Feather',
    gradient: ['#FEE2E2', '#F87171'],
  },
};


/* ------------------------------ HELPERS ------------------------------ */

// Statuses where tracking should be shown
const TRACKABLE_STATUSES = ['accepted', 'partially_billed', 'billed'];

// Statuses that are currently active
const CURRENT_STATUSES = ['pending', 'accepted', 'partially_billed', 'billed'];

const normalizeOrder = (o) => ({
  ...o,
  total_items: o.order_summary?.total_items || o.items?.length || 0,
  total_amount: o.order_summary?.grand_total || o.amount || 0,
  order_date: o.order_date || o.created_at || new Date().toLocaleDateString(),
  status: o.status?.toLowerCase() || 'pending',
});

const formatDate = (dateString) => {
  try {
    if (!dateString) return 'N/A';

    // Handle different date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If it's in DD.MM.YYYY format
      const [day, month, year] = dateString.split('.').map(Number);
      return `${String(day).padStart(2, '0')} ${new Date(year, month - 1).toLocaleString('default', { month: 'short' })}, ${year}`;
    }

    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const getRelativeTime = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  } catch {
    return formatDate(dateString);
  }
};

/* ------------------------------ FILTER BUTTON ------------------------------ */

const FilterButton = React.memo(({ label, isActive, onPress, icon }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const labelText = {
    all: 'All Orders',
    current: 'Active',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }[label] || label;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.filterButton,
          isActive && styles.filterButtonActive,
        ]}
        activeOpacity={0.8}
      >
        {icon && (
          <Icon
            name={icon}
            type="Feather"
            size={scale(14)}
            color={isActive ? COLORS.white : COLORS.primaryAppColor}
            style={styles.filterIcon}
          />
        )}
        <TextComp
          style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}
          numberOfLines={1}
        >
          {labelText}
        </TextComp>
      </TouchableOpacity>
    </Animated.View>
  );
});

/* ------------------------------ ORDER CARD ------------------------------ */

const OrderCard = React.memo(({ item, isExpanded, onToggle, onView, onTrack, onCancel }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Normalize status (handle spaces)
  const normalizedStatus = item.status?.toLowerCase().replace(/\s+/g, '_');
  const status = ORDER_STATUS[normalizedStatus] || ORDER_STATUS.pending;

  const isCurrent = CURRENT_STATUSES.includes(normalizedStatus);
  const canTrack = TRACKABLE_STATUSES.includes(normalizedStatus);
  const canCancel = item.can_cancel === true || item.can_cancel === 'true' || item.can_cancel === 1;
  const showActions = isCurrent && isExpanded;

  const animatePress = useCallback((toValue) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateExpand = useCallback((show) => {
    Animated.timing(fadeAnim, {
      toValue: show ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    animateExpand(isExpanded);
  }, [isExpanded]);

  const handlePress = () => {
    if (isCurrent) {
      onToggle(item.order_id);
    } else {
      onView(item);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => animatePress(0.98)}
        onPressOut={() => animatePress(1)}
        style={({ pressed }) => [
          styles.orderCard,
          !isCurrent && styles.pastOrderCard,
          pressed && styles.cardPressed,
        ]}
      >
        {/* Order Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderIdContainer}>
              <Icon name="tag" type="Feather" size={scale(14)} color={COLORS.greyOpacity(0.7)} />
              <TextComp style={styles.orderId}>Order #{item.order_number}</TextComp>
            </View>
            <TextComp style={styles.orderTime}>{item.payment_type.toUpperCase()}</TextComp>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Icon name={status.icon} type={status.iconType} color={status.color} size={scale(12)} />
            <TextComp style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </TextComp>
          </View>
        </View>

        {/* Order Content */}
        <View style={styles.orderContent}>
          <View style={styles.orderImageContainer}>
            <Image
              source={item.items?.[0]?.display_image ? { uri: item.items[0].display_image } : IMAGES.box}
              style={styles.orderImage}
              defaultSource={IMAGES.box}
            />
            {item.total_items > 1 && (
              <View style={styles.itemCountBadge}>
                <TextComp style={styles.itemCountText}>+{item.total_items - 1}</TextComp>
              </View>
            )}
          </View>

          <View style={styles.orderDetails}>
            <TextComp style={styles.itemNames} numberOfLines={2}>
              {item.items?.map(i => i.product_name).slice(0, 2).join(', ')}
              {item.items?.length > 2 ? '...' : ''}
            </TextComp>

            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Icon name="package" type="Feather" size={scale(12)} color={COLORS.greyOpacity(0.7)} />
                <TextComp style={styles.metaText}>{item.total_items} items</TextComp>
              </View>

              <View style={styles.metaItem}>
                <Icon name="calendar" type="Feather" size={scale(12)} color={COLORS.greyOpacity(0.7)} />
                <TextComp style={styles.metaText}>{formatDate(item.order_date)}</TextComp>
              </View>
            </View>

            <View style={styles.amountContainer}>
              <TextComp style={styles.amountLabel}>Total Amount</TextComp>
              <TextComp style={styles.amount}>₹{item.total_amount.toLocaleString()}</TextComp>
            </View>
          </View>
        </View>

        {/* Expandable Actions */}
        <Animated.View style={[styles.actionContainer, { opacity: fadeAnim, height: showActions ? 'auto' : 0 }]}>
          {showActions && (
            <View style={styles.actionButtons}>
              {/* Track Order Button - Show only for trackable statuses */}
              {canTrack && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.trackButton]}
                  onPress={() => onTrack(item)}
                  activeOpacity={0.7}
                >
                  <Icon name="map-pin" type="Feather" size={scale(14)} color="#fff" />
                  <TextComp style={styles.actionButtonText}>Track Order</TextComp>
                </TouchableOpacity>
              )}

              {/* View Details Button - Always show for active orders */}
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => onView(item)}
                activeOpacity={0.7}
              >
                <Icon name="eye" type="Feather" size={scale(14)} color="#fff" />
                <TextComp style={styles.actionButtonText}>View Details</TextComp>
              </TouchableOpacity>

              {/* Cancel Button - Show only for cancellable orders */}
              {canCancel && isCurrent && normalizedStatus === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => onCancel(item)}
                  activeOpacity={0.7}
                >
                  <Icon name="x-circle" type="Feather" size={scale(14)} color="#fff" />
                  <TextComp style={styles.actionButtonText}>Cancel</TextComp>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

/* ------------------------------ EMPTY STATE ------------------------------ */

const EmptyOrders = React.memo(({ onShopNow }) => (
  <View style={styles.emptyContainer}>
    {/* <LottieView
      source={require('../../../assets/animations/empty-cart.json')}
      autoPlay
      loop
      style={styles.emptyAnimation}
    /> */}
    <TextComp style={styles.emptyTitle}>No Orders Yet</TextComp>
    <TextComp style={styles.emptyText}>
      Your order history will appear here. Start shopping to see your orders!
    </TextComp>
    <TouchableOpacity
      style={styles.shopButton}
      onPress={onShopNow}
      activeOpacity={0.7}
    >
      <TextComp style={styles.shopButtonText}>Start Shopping</TextComp>
    </TouchableOpacity>
  </View>
));

/* ------------------------------ LOADING SKELETON ------------------------------ */

const LoadingSkeleton = React.memo(() => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.skeletonCard}>
        <View style={styles.skeletonHeader}>
          <View style={[styles.skeletonLine, { width: '40%' }]} />
          <View style={[styles.skeletonBadge, { width: '25%' }]} />
        </View>
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonDetails}>
            <View style={[styles.skeletonLine, { width: '80%' }]} />
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '50%' }]} />
          </View>
        </View>
      </View>
    ))}
  </View>
));

/* ------------------------------ MAIN SCREEN ------------------------------ */

export default function MyOrders() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback((refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);

    dispatch(getOrdersAction(res => {
      refresh ? setRefreshing(false) : setLoading(false);

      if (res?.data?.status) {
        const normalizedOrders = (res.data.data?.orders || []).map(normalizeOrder);
        setOrders(normalizedOrders);

        if (normalizedOrders.length === 0 && !refresh) {
          Toast.show('No orders found', Toast.SHORT);
        }
      } else {
        Toast.show(res?.data?.message || 'Failed to load orders', Toast.LONG);
      }
    }));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      return () => setExpanded(null);
    }, [])
  );

  const handleCancelOrder = useCallback((order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  }, []);

  const confirmCancelOrder = useCallback(() => {
    if (!selectedOrder) return;

    setCancellingOrder(selectedOrder.order_id);
    setShowCancelModal(false);

    dispatch(cancelOrdersAction({ order_id: selectedOrder.order_id }, res => {
      setCancellingOrder(null);

      if (res?.data?.status) {
        Toast.show('Order cancelled successfully', Toast.SHORT);

        // Update local state
        setOrders(prev => prev.map(order =>
          order.order_id === selectedOrder.order_id
            ? { ...order, status: 'cancelled' }
            : order
        ));

        // Close expanded view if it's the cancelled order
        if (expanded === selectedOrder.order_id) {
          setExpanded(null);
        }
      } else {
        Alert.alert(
          'Cancellation Failed',
          res?.data?.message || 'Unable to cancel order. Please try again.'
        );
      }
    }));
  }, [selectedOrder, dispatch, expanded]);

  const filteredOrders = useMemo(() => {
    if (filter === 'current') {
      return orders.filter(o => CURRENT_STATUSES.includes(o.status?.toLowerCase().replace(/\s+/g, '_')));
    }
    if (filter === 'delivered') {
      return orders.filter(o => o.status?.toLowerCase() === 'complete');
    }
    if (filter === 'cancelled') {
      return orders.filter(o => o.status?.toLowerCase() === 'cancelled');
    }
    return orders;
  }, [orders, filter]);

  const stats = useMemo(() => ({
    total: orders.length,
    active: orders.filter(o => CURRENT_STATUSES.includes(o.status?.toLowerCase().replace(/\s+/g, '_'))).length,
    delivered: orders.filter(o => o.status?.toLowerCase() === 'complete').length,
    cancelled: orders.filter(o => o.status?.toLowerCase() === 'cancelled').length,
  }), [orders]);

  const onToggle = useCallback((id) => {
    setExpanded(prev => prev === id ? null : id);
  }, []);

  const onView = useCallback((item) => {
    navigation.navigate(SCREEN.ORDER_ITEMS_DETAILS, {
      order_id: item.order_id,
      order: item,
    });
  }, [navigation]);

  const onTrack = useCallback((item) => {
    console.log('item', item)
    navigation.navigate(SCREEN.ORDER_STATUS, {
      order_id: item.order_id,
      order: item,
    });
  }, [navigation]);

  const onShopNow = useCallback(() => {
    navigation.navigate(SCREEN.HOME);
  }, [navigation]);

  const filterButtons = [
    { key: 'all', icon: 'layers', count: stats.total },
    { key: 'current', icon: 'clock', count: stats.active },
    { key: 'delivered', icon: 'check-circle', count: stats.delivered },
    { key: 'cancelled', icon: 'x-circle', count: stats.cancelled },
  ];

  return (
    <Wrapper childrenStyles={[styles.wrapper, { width: width }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" type="Feather" size={scale(20)} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <TextComp style={styles.headerTitle}>My Orders</TextComp>
          <TextComp style={styles.headerSubtitle}>
            {stats.total} order{stats.total !== 1 ? 's' : ''} • {stats.active} active
          </TextComp>
        </View>

        <TouchableOpacity
          onPress={() => fetchOrders(true)}
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
      </View>

      {/* Filter Stats */}
      <View style={styles.filterStats}>
        {filterButtons.map(({ key, icon, count }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            style={[
              styles.statButton,
              filter === key && styles.statButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <Icon
              name={icon}
              type="Feather"
              size={scale(14)}
              color={filter === key ? COLORS.white : COLORS.primaryAppColor}
            />
            <TextComp style={[
              styles.statCount,
              filter === key && styles.statCountActive,
            ]}>
              {count}
            </TextComp>
            <TextComp style={[
              styles.statLabel,
              filter === key && styles.statLabelActive,
            ]}>
              {key === 'current' ? 'Active' : key.charAt(0).toUpperCase() + key.slice(1)}
            </TextComp>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order List */}
      {loading && !refreshing ? (
        <LoadingSkeleton />
      ) : filteredOrders.length === 0 ? (
        <EmptyOrders onShopNow={onShopNow} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.order_id.toString()}
          renderItem={({ item }) => (
            <OrderCard
              item={item}
              isExpanded={expanded === item.order_id}
              onToggle={onToggle}
              onView={onView}
              onTrack={onTrack}
              onCancel={handleCancelOrder}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true)}
              colors={[COLORS.secondaryAppColor]}
              tintColor={COLORS.secondaryAppColor}
              progressBackgroundColor="#fff"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon
              name="alert-triangle"
              type="Feather"
              size={scale(50)}
              color="#EF4444"
              style={styles.modalIcon}
            />

            <TextComp style={styles.modalTitle}>Cancel Order</TextComp>

            <TextComp style={styles.modalText}>
              Are you sure you want to cancel Order #{selectedOrder?.order_id}?
              This action cannot be undone.
            </TextComp>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCancelModal(false)}
                activeOpacity={0.7}
              >
                <TextComp style={styles.modalButtonText}>Go Back</TextComp>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmCancelOrder}
                activeOpacity={0.7}
                disabled={cancellingOrder === selectedOrder?.order_id}
              >
                {cancellingOrder === selectedOrder?.order_id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <TextComp style={[styles.modalButtonText, styles.modalButtonConfirmText]}>
                    Yes, Cancel Order
                  </TextComp>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Wrapper>
  );
}

/* ------------------------------ STYLES ------------------------------ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondaryAppColor,
  },
  wrapper: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  header: {
    height: verticalScale(70),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.secondaryAppColor,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    paddingHorizontal: moderateScale(5),
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: verticalScale(42),
    width: verticalScale(42),
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: moderateScale(15),
  },
  headerTitle: {
    fontSize: scale(22),
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: scale(12),
    color: 'rgba(255,255,255,0.9)',
    marginTop: verticalScale(2),
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: verticalScale(42),
    width: verticalScale(42),
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: moderateScale(16),
    marginTop: verticalScale(16),
    borderRadius: 20,
    padding: moderateScale(12),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  statButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    borderRadius: 12,
    marginHorizontal: moderateScale(4),
  },
  statButtonActive: {
    backgroundColor: COLORS.primaryAppColor,
  },
  statCount: {
    fontSize: scale(18),
    fontWeight: '800',
    color: COLORS.primaryTextColor,
    marginTop: verticalScale(4),
  },
  statCountActive: {
    color: COLORS.white,
  },
  statLabel: {
    fontSize: scale(10),
    color: COLORS.greyOpacity(0.8),
    marginTop: verticalScale(2),
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statLabelActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: verticalScale(30),
    paddingTop: verticalScale(8),
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: verticalScale(12),
    padding: moderateScale(18),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primaryAppColor,
  },
  pastOrderCard: {
    borderLeftColor: '#CBD5E1',
    opacity: 0.9,
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(15),
  },
  orderInfo: {
    flex: 1,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  orderId: {
    fontSize: scale(15),
    fontWeight: '700',
    color: COLORS.primaryTextColor,
    marginLeft: moderateScale(6),
  },
  orderTime: {
    fontSize: scale(11),
    color: COLORS.greyOpacity(0.8),
    fontWeight: '800',
    left: scale(20)
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: 20,
  },
  statusText: {
    fontSize: scale(11),
    fontWeight: '700',
    marginLeft: moderateScale(5),
  },
  orderContent: {
    flexDirection: 'row',
  },
  orderImageContainer: {
    position: 'relative',
  },
  orderImage: {
    width: verticalScale(70),
    height: verticalScale(70),
    borderRadius: 12,
    marginRight: moderateScale(15),
    backgroundColor: COLORS.greyOpacity(0.1),
  },
  itemCountBadge: {
    position: 'absolute',
    top: -verticalScale(5),
    right: moderateScale(5),
    backgroundColor: COLORS.primaryAppColor,
    width: verticalScale(22),
    height: verticalScale(22),
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  itemCountText: {
    color: COLORS.white,
    fontSize: scale(10),
    fontWeight: '800',
  },
  orderDetails: {
    flex: 1,
  },
  itemNames: {
    fontSize: scale(14),
    fontWeight: '600',
    color: COLORS.primaryTextColor,
    marginBottom: verticalScale(6),
    lineHeight: scale(18),
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(10),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(15),
  },
  metaText: {
    fontSize: scale(11),
    color: COLORS.greyOpacity(0.8),
    marginLeft: moderateScale(4),
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: scale(12),
    color: COLORS.greyOpacity(0.7),
    fontWeight: '500',
  },
  amount: {
    fontSize: scale(18),
    fontWeight: '800',
    color: COLORS.secondaryAppColor,
  },
  actionContainer: {
    overflow: 'hidden',
    marginTop: verticalScale(15),
    paddingTop: verticalScale(15),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyOpacity(0.1),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(10),
    borderRadius: 25,
    minWidth: '30%',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  trackButton: {
    backgroundColor: '#10B981',
  },
  viewButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: scale(12),
    fontWeight: '700',
    marginLeft: moderateScale(6),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(40),
  },
  emptyAnimation: {
    width: verticalScale(200),
    height: verticalScale(200),
    marginBottom: verticalScale(20),
  },
  emptyTitle: {
    fontSize: scale(22),
    fontWeight: '800',
    color: COLORS.primaryTextColor,
    marginBottom: verticalScale(8),
  },
  emptyText: {
    fontSize: scale(14),
    color: COLORS.greyOpacity(0.8),
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: verticalScale(30),
  },
  shopButton: {
    backgroundColor: COLORS.primaryAppColor,
    paddingHorizontal: moderateScale(30),
    paddingVertical: verticalScale(14),
    borderRadius: 25,
    elevation: 8,
    shadowColor: COLORS.primaryAppColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: scale(14),
    fontWeight: '700',
  },
  skeletonContainer: {
    paddingHorizontal: moderateScale(16),
  },
  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: moderateScale(18),
    marginBottom: verticalScale(12),
    elevation: 4,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(15),
  },
  skeletonLine: {
    height: verticalScale(12),
    backgroundColor: COLORS.greyOpacity(0.1),
    borderRadius: 6,
  },
  skeletonBadge: {
    height: verticalScale(20),
    backgroundColor: COLORS.greyOpacity(0.1),
    borderRadius: 10,
  },
  skeletonContent: {
    flexDirection: 'row',
  },
  skeletonImage: {
    width: verticalScale(70),
    height: verticalScale(70),
    borderRadius: 12,
    marginRight: moderateScale(15),
    backgroundColor: COLORS.greyOpacity(0.1),
  },
  skeletonDetails: {
    flex: 1,
    justifyContent: 'space-around',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: moderateScale(25),
    width: '100%',
    maxWidth: moderateScale(350),
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
  },
  modalIcon: {
    marginBottom: verticalScale(15),
  },
  modalTitle: {
    fontSize: scale(20),
    fontWeight: '800',
    color: COLORS.primaryTextColor,
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
  modalText: {
    fontSize: scale(14),
    color: COLORS.greyOpacity(0.9),
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: verticalScale(25),
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: moderateScale(12),
  },
  modalButton: {
    flex: 1,
    paddingVertical: verticalScale(14),
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.greyOpacity(0.1),
    borderWidth: 1,
    borderColor: COLORS.greyOpacity(0.2),
  },
  modalButtonConfirm: {
    backgroundColor: '#EF4444',
    elevation: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalButtonText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: COLORS.primaryTextColor,
  },
  modalButtonConfirmText: {
    color: COLORS.white,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginHorizontal: moderateScale(4),
    minWidth: moderateScale(80),
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primaryAppColor,
  },
  filterIcon: {
    marginRight: moderateScale(4),
  },
  filterButtonText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: COLORS.secondaryAppColor,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
});