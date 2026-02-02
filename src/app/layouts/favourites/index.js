import {
  View,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { scale, verticalScale } from 'react-native-size-matters';
import Icon from '../../../utils/icon';
import { COLORS } from '../../../res/colors';
import { width } from '../../hooks/responsive';
import TextComp from '../../components/textComp';
import Wrapper from '../../components/wrapper';
import Toast from 'react-native-simple-toast';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { SCREEN } from '..';
import { IMAGES } from '../../../res/images';
import VariantModal from '../../VariantModal';
import { removeFromFavourites, addToFavourites } from '../../../redux/slices/favouritesSlice';
import ProductList from '../../components/productList';
import { useCartCheck, useCartOperations, useCartQuantity, useCartSync } from '../../hooks/useCartFunctions';
import ProductItem from '../../components/ProductItem';
import MemoizedRenderItem from '../../components/MemoizedRenderItem';

const Favourites = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Selectors with proper memoization
  const favorites = useSelector(state => state.favorites.items);
  const userData = useSelector(state => state.userData.userData);
  const showPrice = useSelector(state => state.togglePrice.showPrice);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cart synchronization hooks
  const { isSyncing, syncError, syncCartWithServer } = useCartSync();

  const {
    variantQuantities,
    setVariantQuantities,
    increaseQuantity,
    decreaseQuantity,
    getQuantity
  } = useCartQuantity();

  const { addToCart, handleVariantSubmit } = useCartOperations();
  const { isItemInCart } = useCartCheck();

  // Sync cart on component mount
  useEffect(() => {
    syncCartWithServer();
  }, [syncCartWithServer]);

  // Show sync errors
  useEffect(() => {
    if (syncError) {
      Toast.show(`Cart sync error: ${syncError}`, Toast.LONG);
    }
  }, [syncError]);

  // Refresh handler with cart sync
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Sync cart along with any other refresh operations
      await Promise.all([
        syncCartWithServer(),
        // Add other refresh operations here if needed
        new Promise(resolve => setTimeout(resolve, 500)), // Minimal delay for better UX
      ]);
      Toast.show('Favorites refreshed');
    } catch (error) {
      Toast.show('Failed to refresh favorites');
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [syncCartWithServer]);

  // Refresh control component
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      colors={[COLORS.primaryAppColor]}
      tintColor={COLORS.primaryAppColor}
      progressBackgroundColor={COLORS.white}
    />
  ), [refreshing, handleRefresh]);

  // Navigation handlers
  const navigateToSingleProductScreen = useCallback(
    (item) => {
      navigation.navigate(SCREEN.SINGLE_PRODUCT_SCREEN, { item });
    },
    [navigation]
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Favorite toggle with debouncing prevention
  const toggleLike = useCallback(
    (item) => {
      const isAlreadyInFavorites = favorites.some(fav => fav.id === item.id);
      if (isAlreadyInFavorites) {
        dispatch(removeFromFavourites(item.id));
        Toast.show('Item removed from favourites');
      } else {
        dispatch(addToFavourites(item));
        Toast.show('Item added to favourites');
      }
    },
    [dispatch, favorites]
  );

  // Cart addition handler with sync
  const handleAddToCart = useCallback(async (item) => {
    const result = await addToCart(item);
    if (result?.requiresVariantSelection) {
      setSelectedProduct(result.item);
      setShowVariantModal(true);
    } else if (result?.success) {
      // Sync cart after successful addition
      syncCartWithServer();
    }
  }, [addToCart, syncCartWithServer]);

  // Enhanced variant submit with sync
  const handleVariantSubmitWithSync = useCallback(async (selectedVariants) => {
    const result = await handleVariantSubmit(selectedVariants);
    if (result?.success) {
      // Sync cart after successful variant addition
      syncCartWithServer();
    }
    return result;
  }, [handleVariantSubmit, syncCartWithServer]);

  // Variant modal handlers
  const handleMorePress = useCallback((item) => {
    setSelectedProduct(item);
    setShowVariantModal(true);
  }, []);

  const handleCloseVariantModal = useCallback(() => {
    setShowVariantModal(false);
    setVariantQuantities({});
  }, [setVariantQuantities]);

  // Memoized render functions
  const renderVariantItem = useCallback(
    ({ item }) => {
      const key = `${selectedProduct?.id}_${item.id}`;
      return (
        <MemoizedRenderItem
          key={key}
          id={key}
          item={item}
          getQuantity={getQuantity}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
          selectedProduct={selectedProduct}
          showPrice={showPrice}
        />
      );
    },
    [selectedProduct, getQuantity, increaseQuantity, decreaseQuantity, showPrice]
  );

  const renderProductItem = useCallback(
    ({ item }) => (
      <ProductItem
        item={item}
        onPress={navigateToSingleProductScreen}
        onMorePress={handleMorePress}
        toggleLike={toggleLike}
        addToCart={handleAddToCart}
        showPrice={showPrice}
        isItemInCart={isItemInCart(item.id)}
        isSyncing={isSyncing}
      />
    ),
    [navigateToSingleProductScreen, handleMorePress, toggleLike, handleAddToCart, showPrice, isItemInCart, isSyncing]
  );

  // Sync indicator component
  const SyncIndicator = useMemo(() => (
    isSyncing && (
      <View style={styles.syncIndicator}>
        <ActivityIndicator size="small" color={COLORS.primaryAppColor} />
        <TextComp style={styles.syncText}>Syncing cart...</TextComp>
      </View>
    )
  ), [isSyncing]);

  // Memoized components
  const renderEmptyState = useMemo(() => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateContent}>
        <Image
          source={IMAGES.NO_PRODUCT}
          style={styles.emptyStateImage}
          resizeMode="contain"
        />
        <TextComp style={styles.emptyStateText}>
          No favorites yet. Start adding some!
        </TextComp>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing || isSyncing}
        >
          {refreshing || isSyncing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <TextComp style={styles.refreshButtonText}>
              Pull to Refresh
            </TextComp>
          )}
        </TouchableOpacity>
      </View>
    </View>
  ), [handleRefresh, refreshing, isSyncing]);

  const renderHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={handleGoBack}
        hitSlop={styles.hitSlop}
        style={styles.backButton}
      >
        <Icon
          name={'arrowleft'}
          color={COLORS.white}
          size={scale(22)}
          type="AntDesign"
        />
      </TouchableOpacity>
      <TextComp style={styles.headerTitle}>
        Favourites
        {/* ({favorites.length}) */}
      </TextComp>
      {favorites.length > 0 && (
        <TouchableOpacity
          style={styles.refreshIconButton}
          onPress={handleRefresh}
          disabled={refreshing || isSyncing}
        >
          <Icon
            name={refreshing || isSyncing ? 'loading1' : 'reload1'}
            color={refreshing || isSyncing ? COLORS.grey : COLORS.secondaryAppColor}
            size={scale(20)}
            type="AntDesign"
          />
        </TouchableOpacity>
      )}
    </View>
  ), [handleGoBack, favorites.length, handleRefresh, refreshing, isSyncing]);

  const productList = useMemo(() => (
    <ProductList
      data={favorites}
      renderItem={renderProductItem}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={renderEmptyState}
      refreshControl={refreshControl}
      initialNumToRender={8}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      // Additional props for better pull-to-refresh experience
      onScroll={({ nativeEvent }) => {
        // Optional: Add auto-sync when scrolling near bottom
        const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
        const paddingToBottom = 20;
        if (contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom) {
          if (!isSyncing && !refreshing) {
            syncCartWithServer();
          }
        }
      }}
      scrollEventThrottle={16}
    />
  ), [favorites, renderProductItem, renderEmptyState, refreshControl, isSyncing, refreshing, syncCartWithServer]);

  const variantModal = useMemo(() => (
    showVariantModal && (
      <VariantModal
        product={selectedProduct}
        quantities={variantQuantities}
        setVariantQuantities={setVariantQuantities}
        onClose={handleCloseVariantModal}
        renderItem={renderVariantItem}
        userData={userData}
        onSubmit={handleVariantSubmitWithSync}
        isSyncing={isSyncing}
      />
    )
  ), [showVariantModal, selectedProduct, variantQuantities, handleCloseVariantModal, renderVariantItem, userData, handleVariantSubmitWithSync, isSyncing]);

  return (
    <Wrapper childrenStyles={styles.wrapper}>
      {SyncIndicator}
      {renderHeader}
      {productList}
      {variantModal}
    </Wrapper>
  );
};

// Optimized styles
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    flex: 1,
    width,
  },
  headerContainer: {
    height: verticalScale(50),
    width,
    paddingHorizontal: scale(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hitSlop: {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
  },
  backButton: {
    backgroundColor: COLORS.secondaryAppColor,
    height: verticalScale(30),
    width: verticalScale(30),
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: COLORS.secondaryAppColor,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: scale(10),
  },
  refreshIconButton: {
    padding: scale(5),
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(20),
  },
  emptyStateContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateImage: {
    height: verticalScale(100),
    width: verticalScale(100),
    marginBottom: verticalScale(20),
  },
  emptyStateText: {
    fontSize: scale(16),
    color: COLORS.grey,
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  refreshButton: {
    backgroundColor: COLORS.primaryAppColor,
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    minWidth: scale(120),
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: scale(14),
    fontWeight: '600',
  },
  syncIndicator: {
    position: 'absolute',
    top: verticalScale(10),
    right: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: scale(8),
    borderRadius: scale(20),
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  syncText: {
    marginLeft: scale(6),
    fontSize: scale(12),
    color: COLORS.black,
    fontWeight: '500',
  },
});

export default React.memo(Favourites);