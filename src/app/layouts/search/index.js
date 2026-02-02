import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Wrapper from '../../components/wrapper';
import { getSearchAction } from '../../../redux/action';
import TextInputComp from '../../components/textInputComp';
import { scale, verticalScale } from 'react-native-size-matters';
import { width } from '../../hooks/responsive';
import { COLORS } from '../../../res/colors';
import Icon from '../../../utils/icon';
import { useNavigation } from '@react-navigation/native';
import TextComp from '../../components/textComp';
import { SCREEN } from '..';
import Toast from 'react-native-simple-toast';
import {
  addToFavourites,
  removeFromFavourites,
} from '../../../redux/slices/favouritesSlice';
import VariantModal from '../../VariantModal';
import MemoizedRenderItem from '../../components/MemoizedRenderItem';
import ProductItem from '../../components/ProductItem';
import {
  useCartQuantity,
  useCartOperations,
  useCartCheck,
  useCartSync,
} from '../../hooks/useCartFunctions';

const DEBOUNCE_DELAY = 500;

const SearchResults = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const userData = useSelector(state => state.userData.userData);
  const [searchText, setSearchText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef(null);

  const favorites = useSelector(state => state.favorites.items);
  const cartItems = useSelector(state => state.cart.items);
  const showPrice = useSelector(state => state.togglePrice.showPrice);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Cart hooks
  const {
    variantQuantities,
    setVariantQuantities,
    increaseQuantity,
    decreaseQuantity,
    getQuantity,
  } = useCartQuantity();

  const { addToCart, handleVariantSubmit } = useCartOperations();
  const { isItemInCart } = useCartCheck();

  // Cart synchronization
  const { isSyncing, syncError, syncCartWithServer } = useCartSync();

  // Show sync errors
  useEffect(() => {
    if (syncError) {
      Toast.show(`Cart sync error: ${syncError}`, Toast.LONG);
    }
  }, [syncError]);

  // Debounce search text
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedText(searchText);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timeout);
  }, [searchText]);

  // Perform search
  useEffect(() => {
    if (!debouncedText.trim()) {
      setResults([]);
      return;
    }

    const payload = { search: debouncedText };
    setLoading(true);

    dispatch(
      getSearchAction(payload, res => {
        try {
          if (res?.status) {
            const products = (res?.data?.products || []).map(item => ({
              ...item,
              type: 'product',
            }));
            setResults(products);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }),
    );
  }, [debouncedText]);

  // Refresh handler with cart sync
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        syncCartWithServer(),
        new Promise(resolve => {
          if (debouncedText.trim()) {
            const payload = { search: debouncedText };
            dispatch(
              getSearchAction(payload, res => {
                if (res?.status) {
                  const products = (res?.data?.products || []).map(item => ({
                    ...item,
                    type: 'product',
                  }));
                  setResults(products);
                }
                resolve();
              }),
            );
          } else {
            resolve();
          }
        }),
      ]);
      Toast.show('Search results refreshed');
    } catch (error) {
      Toast.show('Failed to refresh');
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [debouncedText, syncCartWithServer]);

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
    item => {
      navigation.navigate(SCREEN.SINGLE_PRODUCT_SCREEN, { item });
    },
    [navigation],
  );

  // Favorite toggle
  const toggleLike = useCallback(
    item => {
      const isAlreadyInFavorites = favorites.some(fav => fav.id === item.id);
      if (isAlreadyInFavorites) {
        dispatch(removeFromFavourites(item.id));
        Toast.show('Item removed from favourites');
      } else {
        dispatch(addToFavourites(item));
        Toast.show('Item added to favourites');
      }
    },
    [dispatch, favorites],
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

  // Render variant item
  const renderVariantItem = useCallback(
    ({ item, index }) => {
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
    [selectedProduct, getQuantity, increaseQuantity, decreaseQuantity, showPrice],
  );

  // Render product item
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
    [navigateToSingleProductScreen, handleMorePress, toggleLike, handleAddToCart, showPrice, isItemInCart, isSyncing],
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

  return (
    <Wrapper useTopInsets={true} childrenStyles={{
      width: width,
      flex: 1,
    }}>
      {SyncIndicator}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          height: verticalScale(55),
        }}>
        <TouchableOpacity
          onPress={navigation.goBack}
          style={{
            backgroundColor: COLORS.secondaryAppColor,
            height: verticalScale(30),
            width: verticalScale(30),
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 100,
          }}>
          <Icon
            type="AntDesign"
            name={'arrowleft'}
            size={23}
            color={COLORS.white}
          />
        </TouchableOpacity>
        <View style={{ width: 10 }} />
        <TextInputComp
          ref={inputRef}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={'Search products...'}
          style={{ flex: 1 }}
          customBorderColor={COLORS.secondaryAppColor}
          customContainerStyle={{ borderRadius: 100 }}
          autoFocus={true}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText('')}
            style={{ padding: 10, marginLeft: 5 }}
          >
            <Icon
              type="AntDesign"
              name="closecircle"
              size={20}
              color={COLORS.grey}
            />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondaryAppColor} />
          <TextComp style={styles.loadingText}>Searching...</TextComp>
        </View>
      )}

      {!loading && debouncedText && results.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <Icon
            type="MaterialIcons"
            name="search-off"
            size={scale(60)}
            color={COLORS.grey}
            style={{ marginBottom: 10 }}
          />
          <TextComp style={styles.emptyStateTitle}>
            Product Not Available
          </TextComp>
          <TextComp style={styles.emptyStateText}>
            Sorry, we couldn't find any products matching "{debouncedText}"
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
                Try Again
              </TextComp>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!loading && results.length > 0 && (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderProductItem}
          refreshControl={refreshControl}
          contentContainerStyle={{
            paddingBottom: verticalScale(100),
          }}
          // Auto-sync when scrolling near bottom
          onScroll={({ nativeEvent }) => {
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
      )}

      {showVariantModal && (
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
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: verticalScale(20),
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: scale(14),
    color: COLORS.grey,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: verticalScale(40),
  },
  emptyStateTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: COLORS.secondaryAppColor,
    marginBottom: verticalScale(5),
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: scale(14),
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
    top: verticalScale(60),
    right: scale(15),
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
  // Keep all other existing styles from your original code
  variantItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyOpacity(0.3),
    paddingVertical: verticalScale(10),
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
  productContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.greyOpacity(1),
    overflow: 'hidden',
    paddingVertical: verticalScale(5),
  },
  imageContainer: {
    width: width * 0.92 * 0.4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
  badgeText: {
    color: COLORS.black,
    fontSize: scale(10),
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
    paddingLeft: scale(5),
    justifyContent: 'center',
  },
  brandText: {
    fontSize: scale(12),
    marginTop: scale(3),
    color: COLORS.secondaryAppColor,
  },
  ouoFoStockText: {
    fontSize: scale(12),
    marginTop: scale(3),
    color: COLORS.red,
  },
  productName: {
    fontSize: scale(13),
    fontWeight: '900',
    color: COLORS.secondaryAppColor,
    marginBottom: scale(5),
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
  },
  cartButtonText: {
    fontSize: scale(10),
    color: COLORS.white,
  },
  variantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeText: {
    fontSize: scale(12),
    color: COLORS.secondaryAppColor,
    maxWidth: width * 0.25,
  },
  moreText: {
    marginLeft: scale(6),
    fontSize: scale(12),
    color: COLORS.blue,
    fontWeight: '800',
  },
  emptySpace: {
    height: 10,
    width: 60,
  },
  heartButton: {
    marginRight: scale(10),
    marginTop: verticalScale(10),
  },
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
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: scale(10),
    padding: scale(15),
    maxHeight: '70%',
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
  },
  buttonText: {
    textAlign: 'center',
    color: COLORS.white,
  },
});

export default SearchResults;