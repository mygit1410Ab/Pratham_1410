import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  FlatList,
  RefreshControl,
  Alert,
  StyleSheet
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { moderateScale, scale } from 'react-native-size-matters';
import Icon from '../../../utils/icon';
import { COLORS } from '../../../res/colors';
import TextComp from '../../components/textComp';
import Wrapper from '../../components/wrapper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-simple-toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getNotificationsAction,
  markNotificationReadAction,
  deleteNotificationAction,
  markAllReadAction
} from '../../../redux/action';
import { height } from '../../hooks/responsive';

const Notifications = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  // Filter options
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'read', label: 'Read' },
    { id: 'offers', label: 'Offers' },
  ];

  // Check authentication
  const checkAuth = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token;
    } catch {
      return false;
    }
  }, []);

  // Get API filter param
  const getFilterParam = useCallback(() => {
    switch (activeFilter) {
      case 'unread': return 'unread';
      case 'read': return 'read';
      case 'offers': return 'promotion';
      default: return 'all';
    }
  }, [activeFilter]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!isRefresh) setLoading(true);
      if (isRefresh) setRefreshing(true);

      const params = {
        action: 'list',
        filter: getFilterParam(),
      };

      dispatch(getNotificationsAction(params, (res) => {
        setLoading(false);
        setRefreshing(false);

        if (res?.data?.status) {
          const data = res.data.data || {};
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        } else {
          Toast.show('Failed to load notifications', Toast.SHORT);
        }
      }));
    } catch (error) {
      setLoading(false);
      setRefreshing(false);
      Toast.show('Error loading notifications', Toast.SHORT);
    }
  }, [checkAuth, dispatch, getFilterParam]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // Refresh when filter changes
  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Mark as read
  const markAsRead = useCallback((notificationId) => {
    dispatch(markNotificationReadAction({
      action: 'mark_read',
      notification_id: notificationId,
    }, (res) => {
      if (res?.data?.status) {
        setNotifications(prev =>
          prev.map(item =>
            item.id === notificationId
              ? { ...item, is_read: true }
              : item
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        Toast.show('Marked as read', Toast.SHORT);
      }
    }));
  }, [dispatch]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    if (unreadCount === 0) {
      Toast.show('No unread notifications', Toast.SHORT);
      return;
    }

    dispatch(markAllReadAction({ action: 'mark_all_read' }, (res) => {
      if (res?.data?.status) {
        setNotifications(prev =>
          prev.map(item => ({ ...item, is_read: true }))
        );
        setUnreadCount(0);
        Toast.show('All marked as read', Toast.SHORT);
      }
    }));
  }, [dispatch, unreadCount]);

  // Delete notification
  const handleDelete = useCallback((notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotification(notification)
        }
      ]
    );
  }, []);

  // Actual delete function
  const deleteNotification = useCallback((notification) => {
    setDeletingId(notification.id);

    dispatch(deleteNotificationAction({
      action: 'delete',
      notification_id: notification.id,
    }, (res) => {
      setDeletingId(null);

      if (res?.data?.status) {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        if (!notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        Toast.show('Notification deleted', Toast.SHORT);
      } else {
        Toast.show('Failed to delete notification', Toast.SHORT);
      }
    }));
  }, [dispatch]);

  // Quick delete (without confirmation)
  const handleQuickDelete = useCallback((notification, e) => {
    e?.stopPropagation?.();
    deleteNotification(notification);
  }, [deleteNotification]);

  // Handle notification press
  const handlePress = useCallback((notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.action_url) {
      // Handle navigation
      console.log('Navigate to:', notification.action_url);
    }
  }, [markAsRead]);

  // Get icon based on notification type
  const getIcon = useCallback((type) => {
    if (!type) return { name: 'bell', color: COLORS.secondaryTextColor };

    const lowerType = type.toLowerCase();
    if (lowerType.includes('promotion') || lowerType.includes('offer')) {
      return { name: 'tag', color: COLORS.yellow };
    } else if (lowerType.includes('order')) {
      return { name: 'package', color: COLORS.blue };
    } else if (lowerType.includes('payment')) {
      return { name: 'credit-card', color: COLORS.green };
    } else {
      return { name: 'bell', color: COLORS.primaryAppColor };
    }
  }, []);

  // Filter notifications locally for offers (if needed)
  const filteredNotifications = useCallback(() => {
    if (activeFilter === 'offers') {
      return notifications.filter(item => {
        const type = item.type?.toLowerCase() || '';
        return type.includes('promotion') || type.includes('offer');
      });
    }
    return notifications;
  }, [notifications, activeFilter]);

  // Render notification item
  const renderItem = useCallback(({ item }) => {
    const icon = getIcon(item.type);
    const isDeleting = deletingId === item.id;

    return (
      <Pressable
        style={[
          styles.itemContainer,
          !item.is_read && styles.unreadItem
        ]}
        onPress={() => handlePress(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: icon.color + '20' }
        ]}>
          <Icon
            name={icon.name}
            type="Feather"
            size={scale(18)}
            color={icon.color}
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <TextComp style={[
              styles.title,
              !item.is_read && styles.unreadTitle
            ]} numberOfLines={1}>
              {item.title || 'Notification'}
            </TextComp>
            {!item.is_read && (
              <View style={styles.unreadBadge}>
                <TextComp style={styles.unreadBadgeText}>NEW</TextComp>
              </View>
            )}
          </View>

          <TextComp style={styles.message} numberOfLines={2}>
            {item.message || 'No message'}
          </TextComp>

          <View style={styles.footer}>
            <TextComp style={styles.time}>
              {item.created_at || 'Recently'}
            </TextComp>
            {item.type && (
              <TextComp style={styles.type}>
                {item.type}
              </TextComp>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={(e) => handleQuickDelete(item, e)}
          style={styles.deleteButton}
          disabled={isDeleting}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={COLORS.red} />
          ) : (
            <Icon
              name="trash-2"
              type="Feather"
              size={scale(16)}
              color={COLORS.red}
            />
          )}
        </TouchableOpacity>
      </Pressable>
    );
  }, [getIcon, handlePress, handleDelete, handleQuickDelete, deletingId]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon
          name="bell"
          type="Feather"
          size={scale(60)}
          color={COLORS.secondaryTextColor}
        />
        <TextComp style={styles.emptyTitle}>
          {activeFilter === 'all' ? 'No notifications' : 'No matching notifications'}
        </TextComp>
        <TextComp style={styles.emptyText}>
          {activeFilter === 'unread'
            ? 'You have no unread notifications'
            : activeFilter === 'read'
              ? 'You have no read notifications'
              : activeFilter === 'offers'
                ? 'You have no promotional notifications'
                : 'You don\'t have any notifications yet'}
        </TextComp>
      </View>
    );
  }, [loading, activeFilter]);

  // Render filter tabs
  const renderFilters = useCallback(() => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterButton,
            activeFilter === filter.id && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter(filter.id)}
        >
          <TextComp style={[
            styles.filterText,
            activeFilter === filter.id && styles.activeFilterText
          ]}>
            {filter.label}
          </TextComp>
          {filter.id === 'unread' && unreadCount > 0 && activeFilter !== filter.id && (
            <View style={styles.filterBadge}>
              <TextComp style={styles.filterBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </TextComp>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  ), [activeFilter, unreadCount]);

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon
            name="arrow-left"
            type="Feather"
            size={scale(22)}
            color={COLORS.white}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <TextComp style={styles.headerTitle}>Notifications</TextComp>
          {unreadCount > 0 && (
            <TextComp style={styles.unreadCount}>
              {unreadCount} unread
            </TextComp>
          )}
        </View>

        <TouchableOpacity
          onPress={markAllAsRead}
          style={styles.markAllButton}
          disabled={unreadCount === 0}
        >
          <Icon
            name="check-all"
            type="MaterialCommunityIcons"
            size={scale(20)}
            color={unreadCount > 0 ? COLORS.white : COLORS.whiteOpacity(0.5)}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {renderFilters()}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryAppColor} />
          <TextComp style={styles.loadingText}>Loading notifications...</TextComp>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications()}
          renderItem={renderItem}
          keyExtractor={item => item.id?.toString()}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primaryAppColor]}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: moderateScale(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    backgroundColor: COLORS.secondaryAppColor,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerCenter: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  headerTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  unreadCount: {
    fontSize: scale(12),
    color: COLORS.whiteOpacity(0.9),
    marginTop: moderateScale(2),
  },
  markAllButton: {
    padding: moderateScale(8),
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  filterContent: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    height: moderateScale(70),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    marginRight: moderateScale(8),
  },
  activeFilterButton: {
    backgroundColor: COLORS.primaryAppColor,
    borderColor: COLORS.primaryAppColor,
  },
  filterText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: COLORS.primaryTextColor,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  filterBadge: {
    marginLeft: moderateScale(6),
    backgroundColor: COLORS.red,
    borderRadius: 10,
    minWidth: scale(18),
    height: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(4),
  },
  filterBadgeText: {
    fontSize: scale(10),
    color: COLORS.white,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  loadingText: {
    fontSize: scale(14),
    color: COLORS.secondaryTextColor,
    marginTop: moderateScale(16),
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: moderateScale(20),
    height: height,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    backgroundColor: COLORS.white,
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  unreadItem: {
    backgroundColor: COLORS.primaryAppColorOpacity(0.05),
    borderColor: COLORS.primaryAppColorOpacity(0.2),
  },
  iconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(4),
  },
  title: {
    fontSize: scale(14),
    fontWeight: '600',
    color: COLORS.secondaryAppColor,
    flex: 1,
  },
  unreadTitle: {
    color: COLORS.secondaryAppColor,
  },
  unreadBadge: {
    backgroundColor: COLORS.red,
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: 4,
  },
  unreadBadgeText: {
    fontSize: scale(10),
    color: COLORS.white,
    fontWeight: '700',
  },
  message: {
    fontSize: scale(12),
    color: COLORS.primaryTextColor,
    lineHeight: scale(16),
    marginBottom: moderateScale(8),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: scale(11),
    color: COLORS.secondaryTextColor,
  },
  type: {
    fontSize: scale(11),
    color: COLORS.primaryAppColor,
    backgroundColor: COLORS.primaryAppColorOpacity(0.1),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: 4,
  },
  deleteButton: {
    marginLeft: moderateScale(8),
    padding: moderateScale(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
    minHeight: moderateScale(300),
    top: -150
  },
  emptyTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    color: COLORS.secondaryAppColor,
    marginTop: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  emptyText: {
    fontSize: scale(14),
    color: COLORS.secondaryTextColor,
    textAlign: 'center',
    lineHeight: scale(20),
  },
});