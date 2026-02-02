import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Text
} from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Wrapper from '../../components/wrapper';
import StaticeHeader from '../../components/staticeHeader';
import { useNavigation, useRoute } from '@react-navigation/native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { height, width } from '../../hooks/responsive';
import { COLORS } from '../../../res/colors';
import Icon from '../../../utils/icon';
import TextComp from '../../components/textComp';
import { useDispatch, useSelector } from 'react-redux';
import {
  getBannerProductsAction,
  getProductsByCategoryAction,
} from '../../../redux/action';
import Toast from 'react-native-simple-toast';
import { IMAGES } from '../../../res/images';
import { SCREEN } from '..';
import {
  addToFavourites,
  removeFromFavourites,
} from '../../../redux/slices/favouritesSlice';
import FilterModal from '../../components/filter';
import ProductItem from '../../components/ProductItem';
import VariantModal from '../../VariantModal';
import ProductList from '../../components/productList';
import MemoizedRenderItem from '../../components/MemoizedRenderItem';
import {
  useCartCheck,
  useCartOperations,
  useCartQuantity,
  useCartSync,
} from '../../hooks/useCartFunctions';

const CategoryProductsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { data, bannerClick = false } = route?.params || {};

  const brands = useSelector(state => state.brands.list);
  const favorites = useSelector(state => state.favorites.items);
  const userData = useSelector(state => state.userData.userData);
  const showPrice = useSelector(state => state.togglePrice.showPrice);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterPayload, setFilterPayload] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedBrandsObj, setSelectedBrandsObj] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(null);

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
  const { isSyncing, syncError, syncCartWithServer } = useCartSync();

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

  // Memoized navigation handlers
  const navigateToSingleProductScreen = useCallback(
    (item) => {
      navigation.navigate(SCREEN.SINGLE_PRODUCT_SCREEN, { item });
    },
    [navigation]
  );

  // Memoized favorite toggle
  const toggleLike = useCallback(
    (item) => {
      const itemId = String(item?.id); // ✅ Convert number to string
      console.log('toggleLik-CategoryProductsScreene', itemId);

      const isAlreadyInFavorites = favorites.some(fav => String(fav.id) === itemId);

      if (isAlreadyInFavorites) {
        dispatch(removeFromFavourites(itemId));
        Toast.show('Item removed from favourites');
      } else {
        dispatch(addToFavourites({ ...item, id: itemId })); // ensure stored as string
        Toast.show('Item added to favourites');
      }
    },
    [dispatch, favorites]
  );


  // Memoized cart addition handler with sync
  const handleAddToCart = useCallback(
    async (item) => {
      const result = await addToCart(item);
      if (result?.requiresVariantSelection) {
        setSelectedProduct(result.item);
        setShowVariantModal(true);
      } else if (result?.success) {
        syncCartWithServer();
      }
    },
    [addToCart, syncCartWithServer]
  );

  // Enhanced variant submit with sync
  const handleVariantSubmitWithSync = useCallback(
    async (selectedVariants) => {
      const result = await handleVariantSubmit(selectedVariants);
      if (result?.success) {
        syncCartWithServer();
      }
      return result;
    },
    [handleVariantSubmit, syncCartWithServer]
  );

  // Memoized variant modal handlers
  const handleMorePress = useCallback((item) => {
    setSelectedProduct(item);
    setShowVariantModal(true);
  }, []);

  const handleCloseVariantModal = useCallback(() => {
    setShowVariantModal(false);
    setVariantQuantities({});
  }, [setVariantQuantities]);

  // Refresh handler with cart sync
  const handleRefresh = useCallback(
    async () => {
      setRefreshing(true);
      try {
        await Promise.all([
          syncCartWithServer(),
          new Promise((resolve) => {
            if (bannerClick) {
              fetchBannerProducts(filterPayload, resolve);
            } else {
              fetchProducts(filterPayload, resolve);
            }
          }),
        ]);
        Toast.show('Products refreshed');
      } catch (error) {
        Toast.show('Failed to refresh products');
        console.error('Refresh error:', error);
      } finally {
        setRefreshing(false);
      }
    },
    [bannerClick, filterPayload, syncCartWithServer, fetchBannerProducts, fetchProducts]
  );

  // Refresh control component
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        colors={[COLORS.primaryAppColor]}
        tintColor={COLORS.primaryAppColor}
        progressBackgroundColor={COLORS.white}
      />
    ),
    [refreshing, handleRefresh]
  );

  // Memoized fetch functions
  const fetchProducts = useCallback(
    (customPayload = null, onComplete) => {
      setLoading(true);
      const basePayload = { category_id: data.id };
      const fullPayload = customPayload ? { ...basePayload, ...customPayload } : basePayload;

      dispatch(
        getProductsByCategoryAction(fullPayload, (response) => {
          console.log('getProductsByCategoryAction=====---->', response)
          if (response?.data?.status) {
            setProducts(response?.data?.data || []);
          } else {
            Toast.show(response?.data?.message || 'Product fetch failed', Toast.LONG);
          }
          setLoading(false);
          onComplete?.();
        })
      );
    },
    [data.id, dispatch]
  );

  const fetchBannerProducts = useCallback(
    (customPayload = null, onComplete) => {
      setLoading(true);
      const basePayload = { banners_id: data?.id };
      const fullPayload = customPayload ? { ...basePayload, ...customPayload } : basePayload;

      dispatch(
        getBannerProductsAction(fullPayload, (response) => {
          if (response?.data?.status) {
            setProducts(response?.data?.products || []);
          } else {
            Toast.show(response?.data?.message || 'Banner fetch failed', Toast.LONG);
          }
          setLoading(false);
          onComplete?.();
        })
      );
    },
    [data?.id, dispatch]
  );

  // Initial data fetch
  useEffect(() => {
    if (bannerClick) {
      fetchBannerProducts();
    } else {
      fetchProducts();
    }
  }, [bannerClick, fetchBannerProducts, fetchProducts]);

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

  // Filter chips render function
  const renderFilter = useCallback(
    ({ item }) => {
      const removeFilter = () => {
        if (String(item.id) === 'price') {
          setSelectedPrice(null);
          const newFilterPayload = { ...filterPayload, price_range: null };
          setFilterPayload(newFilterPayload);
          if (bannerClick) {
            fetchBannerProducts(newFilterPayload);
          } else {
            fetchProducts(newFilterPayload);
          }
        } else {
          const numericId = Number(item.id);
          setSelectedBrands((prev) => prev.filter((b) => b !== numericId));
          setSelectedBrandsObj((prev) => prev.filter((b) => b.id !== String(item.id)));
          const newFilterPayload = {
            ...filterPayload,
            brands: selectedBrands.filter((b) => b !== numericId),
          };
          setFilterPayload(newFilterPayload);
          if (bannerClick) {
            fetchBannerProducts(newFilterPayload);
          } else {
            fetchProducts(newFilterPayload);
          }
        }
      };

      return (
        <TouchableOpacity
          onPress={removeFilter}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name} filter`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: scale(5),
            borderRadius: scale(10),
            paddingHorizontal: scale(5),
            backgroundColor: COLORS.white,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <TextComp style={{ color: COLORS.primaryAppColor, fontSize: scale(13) }}>
            {item.name}
          </TextComp>
          <Text style={{ color: COLORS.black, marginLeft: scale(5) }}>×</Text>
        </TouchableOpacity>
      );
    },
    [
      setSelectedBrands,
      setSelectedBrandsObj,
      setSelectedPrice,
      selectedBrands,
      filterPayload,
      bannerClick,
      fetchBannerProducts,
      fetchProducts,
      COLORS,
      scale,
      TextComp,
    ]
  );

  // Handle clearing all filters
  const handleClearAll = useCallback(() => {
    setSelectedBrands([]);
    setSelectedBrandsObj([]);
    setSelectedPrice(null);
    const newFilterPayload = { brands: [], price_range: null };
    setFilterPayload(newFilterPayload);
    if (bannerClick) {
      fetchBannerProducts(newFilterPayload);
    } else {
      fetchProducts(newFilterPayload);
    }
  }, [setSelectedBrands, setSelectedBrandsObj, setSelectedPrice, bannerClick, fetchBannerProducts, fetchProducts]);

  // Filter data for chips
  const filterData = useMemo(
    () => [
      ...selectedBrandsObj,
      ...(selectedPrice ? [{ id: 'price', name: selectedPrice }] : []),
    ],
    [selectedBrandsObj, selectedPrice]
  );

  // Sync indicator component
  const SyncIndicator = useMemo(
    () =>
      isSyncing && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color={COLORS.primaryAppColor} />
          <TextComp style={styles.syncText}>Syncing cart...</TextComp>
        </View>
      ),
    [isSyncing]
  );

  // Memoized empty state component
  const renderEmptyState = useMemo(
    () => (
      <View style={styles.emptyStateContainer}>
        <Image
          source={IMAGES.NO_PRODUCT}
          style={styles.emptyStateImage}
          resizeMode="contain"
        />
        <TextComp style={styles.emptyStateText}>
          No products found in this category.
        </TextComp>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing || isSyncing}
          accessibilityRole="button"
          accessibilityLabel="Refresh products"
        >
          {refreshing || isSyncing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <TextComp style={styles.refreshButtonText}>Pull to Refresh</TextComp>
          )}
        </TouchableOpacity>
      </View>
    ),
    [handleRefresh, refreshing, isSyncing]
  );

  // Memoized loading component
  const renderLoading = useMemo(
    () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.secondaryAppColor} />
        <TextComp style={styles.loadingText}>Loading products...</TextComp>
      </View>
    ),
    []
  );

  // Memoized product list
  const productList = useMemo(
    () => (
      <ProductList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyState}
        refreshControl={refreshControl}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        onScroll={({ nativeEvent }) => {
          const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (
            contentOffset.y + layoutMeasurement.height >=
            contentSize.height - paddingToBottom
          ) {
            if (!isSyncing && !refreshing) {
              syncCartWithServer();
            }
          }
        }}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContentContainer}
      />
    ),
    [products, renderProductItem, renderEmptyState, refreshControl, isSyncing, refreshing, syncCartWithServer]
  );

  // Memoized variant modal
  const variantModal = useMemo(
    () =>
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
      ),
    [
      showVariantModal,
      selectedProduct,
      variantQuantities,
      setVariantQuantities,
      handleCloseVariantModal,
      renderVariantItem,
      userData,
      handleVariantSubmitWithSync,
      isSyncing,
    ]
  );

  // Memoized filter modal
  const filterModal = useMemo(
    () => (
      <FilterModal
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        brands={brands}
        onApply={(filters) => {
          setFilterPayload(filters);
          setIsFilterVisible(false);
          if (bannerClick) {
            fetchBannerProducts(filters);
          } else {
            fetchProducts(filters);
          }
        }}
        setSelectedBrandsObj={setSelectedBrandsObj}
        selectedBrandsObj={selectedBrandsObj}
        setSelectedBrands={setSelectedBrands}
        selectedBrands={selectedBrands}
        selectedPrice={selectedPrice}
        setSelectedPrice={setSelectedPrice}
      />
    ),
    [
      isFilterVisible,
      brands,
      bannerClick,
      fetchBannerProducts,
      fetchProducts,
      setSelectedBrandsObj,
      selectedBrandsObj,
      setSelectedBrands,
      selectedBrands,
      selectedPrice,
      setSelectedPrice,
    ]
  );

  return (
    <Wrapper
      useTopInsets={true}
      useBottomInset={true}
      childrenStyles={styles.wrapper}
      safeAreaContainerStyle={styles.safeArea}
    >
      {SyncIndicator}

      <StaticeHeader
        headerLabel={data.name}
        onpressFilter={() => setIsFilterVisible(true)}
        showFilter={true}
        goToDrawer={true}
      />

      {(selectedBrandsObj.length > 0 || selectedPrice) && (
        <View
          style={{
            paddingVertical: scale(5),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{ width: '80%' }}>
            <FlatList
              horizontal
              data={filterData}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderFilter}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ marginLeft: scale(10), marginVertical: scale(5) }}
            />
          </View>
          <TouchableOpacity
            onPress={handleClearAll}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            style={{
              backgroundColor: COLORS.white,
              padding: scale(5),
              borderRadius: scale(10),
            }}
          >
            <TextComp style={{ fontWeight: '600', color: COLORS.primaryAppColor }}>
              Clear All
            </TextComp>
          </TouchableOpacity>
        </View>
      )}

      {loading ? renderLoading : productList}

      {variantModal}
      {filterModal}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: width,
    backgroundColor: COLORS.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listContentContainer: {
    flexGrow: 1,
    paddingBottom: verticalScale(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.white,
  },
  emptyStateImage: {
    height: verticalScale(120),
    width: verticalScale(120),
    marginBottom: verticalScale(20),
  },
  emptyStateText: {
    fontSize: scale(16),
    color: COLORS.grey,
    textAlign: 'center',
    marginBottom: verticalScale(20),
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: COLORS.primaryAppColor,
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    minWidth: scale(140),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
  productContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.greyOpacity(0.3),
    overflow: 'hidden',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(15),
    backgroundColor: COLORS.white,
  },
  imageContainer: {
    width: width * 0.3,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: verticalScale(100),
    borderRadius: scale(8),
  },
  outOfStockCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(8),
    zIndex: 10,
  },
  outOfStocks: {
    width: '80%',
    height: verticalScale(60),
  },
  detailsContainer: {
    flex: 1,
    paddingLeft: scale(15),
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    marginRight: scale(10),
  },
  productName: {
    fontSize: scale(14),
    fontWeight: '700',
    color: COLORS.secondaryAppColor,
    marginBottom: scale(4),
  },
  brandText: {
    fontSize: scale(12),
    color: COLORS.grey,
    marginBottom: scale(4),
  },
  ouoFoStockText: {
    fontSize: scale(12),
    color: COLORS.red,
    fontWeight: '600',
    marginBottom: scale(4),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  rupeeSymbol: {
    fontSize: scale(12),
    fontWeight: '600',
    color: COLORS.secondaryAppColor,
  },
  priceText: {
    fontSize: scale(16),
    fontWeight: '800',
    color: COLORS.secondaryAppColor,
    marginLeft: scale(2),
  },
  taxText: {
    fontSize: scale(10),
    color: COLORS.grey,
    marginBottom: scale(6),
  },
  variantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  sizeText: {
    fontSize: scale(12),
    color: COLORS.grey,
    maxWidth: width * 0.25,
  },
  moreText: {
    marginLeft: scale(4),
    fontSize: scale(12),
    color: COLORS.primaryAppColor,
    fontWeight: '700',
  },
  cartButton: {
    backgroundColor: COLORS.primaryAppColor,
    borderRadius: scale(20),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(80),
  },
  cartButtonText: {
    fontSize: scale(11),
    color: COLORS.white,
    fontWeight: '600',
  },
  heartButton: {
    padding: scale(4),
  },
  badge: {
    position: 'absolute',
    top: scale(5),
    left: scale(5),
    backgroundColor: COLORS.secondaryAppColor,
    borderRadius: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    zIndex: 11,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: scale(9),
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    padding: scale(20),
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  modalTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: scale(8),
    color: COLORS.secondaryAppColor,
  },
  modalSubTitle: {
    fontSize: scale(12),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: scale(16),
    color: COLORS.grey,
  },
  modalImage: {
    width: verticalScale(60),
    height: verticalScale(60),
    alignSelf: 'center',
    marginBottom: scale(16),
    borderRadius: scale(8),
  },
  variantHeader: {
    flexDirection: 'row',
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyOpacity(0.3),
    marginBottom: scale(8),
  },
  variantHeaderText: {
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: COLORS.secondaryAppColor,
  },
  variantItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyOpacity(0.2),
    paddingVertical: scale(12),
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyOpacity(0.1),
    borderRadius: scale(20),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
  },
  quantityButton: {
    padding: scale(4),
  },
  quantityValue: {
    minWidth: scale(30),
    alignItems: 'center',
  },
  quantityText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: COLORS.secondaryAppColor,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(20),
    gap: scale(12),
  },
  cancelButton: {
    backgroundColor: COLORS.grey,
    paddingVertical: scale(12),
    borderRadius: scale(8),
    flex: 1,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.primaryAppColor,
    paddingVertical: scale(12),
    borderRadius: scale(8),
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: COLORS.white,
  },
  noVariantsText: {
    textAlign: 'center',
    marginVertical: scale(20),
    color: COLORS.red,
    fontSize: scale(14),
    fontWeight: '500',
  },
});

export default React.memo(CategoryProductsScreen);