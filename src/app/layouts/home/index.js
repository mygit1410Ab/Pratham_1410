import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
} from 'react-native';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { COLORS } from '../../../res/colors';
import Wrapper from '../../components/wrapper';
import { height, width } from '../../hooks/responsive';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Icon from '../../../utils/icon';
import TextComp from '../../components/textComp';
import StaticeHeader from '../../components/staticeHeader';
import Carousel from '../../components/carousel';
import { GABRITO_MEDIUM } from '../../../../assets/fonts';
import { useNavigation } from '@react-navigation/native';
import { SCREEN } from '..';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAccountStatusAction,
  getBannersAction,
  getBrandsAction,
  getCategoriesAction,
  getProductsAction,
  getProfileAction,
} from '../../../redux/action';
import Toast from 'react-native-simple-toast';
import {
  addToFavourites,
  removeFromFavourites,
} from '../../../redux/slices/favouritesSlice';
import FilterModal from '../../components/filter';
import { setBrandsRedux } from '../../../redux/slices/brandsSlice';
import ProductList from '../../components/productList';
import VariantModal from '../../VariantModal';
import MemoizedRenderItem from '../../components/MemoizedRenderItem';
import CategoryItem from '../../components/CategoryItem';
import ProductItem from '../../components/ProductItem';
import {
  useCartQuantity,
  useCartOperations,
  useCartCheck,
  useCartSync,
} from '../../hooks/useCartFunctions';
import { handleLogout } from '../../../utils/handleLogout';

const Home = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const flatListRef = useRef(null);
  const userData = useSelector(state => state.userData.userData);
  const showPrice = useSelector(state => state.togglePrice.showPrice);
  const brands = useSelector(state => state.brands.list);
  const favorites = useSelector(state => state.favorites.items);
  const categories = useSelector(state => state.category?.categories);

  const [products, setProducts] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedBrandsObj, setSelectedBrandsObj] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [bannerImages, setBannerImages] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [filterPayload, setFilterPayload] = useState({});
  const [ourBestLoading, setourBestLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const init = useCallback(async () => {
    // dispatch(
    //   getProfileAction({ userId: userData?.id }, res => {
    //     console.log('Profile refreshed :', res?.data?.user?.by_users);
    //     if (!res?.data?.user?.is_active) {
    //       handleLogout(dispatch, navigation)
    //     }
    //   })
    // );
  }, [dispatch]);

  useEffect(() => {
    SystemNavigationBar.setNavigationColor(COLORS.primaryAppColor, 'dark');
    initializeData();
    init();
  }, [initializeData, init]);

  useEffect(() => {
    if (syncError) {
      Toast.show(`Cart sync error: ${syncError}`, Toast.LONG);
    }
  }, [syncError]);

  const initializeData = useCallback(async () => {
    try {
      await Promise.all([
        fetchCategories(),
        fetchBanner(),
        fetchProducts(),
        fetchbrand(),
        syncCartWithServer(),
        fetchAcountStatus(),
      ]);
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }, [fetchCategories, fetchBanner, fetchProducts, fetchbrand, syncCartWithServer, fetchAcountStatus]);

  const fetchBanner = useCallback(() => {
    return new Promise((resolve) => {
      dispatch(
        getBannersAction(response => {
          if (response?.data?.status) {
            setBannerImages(response?.data?.data || []);
          } else {
            Toast.show(
              response?.data?.message || 'Banner fetch failed',
              Toast.LONG,
            );
          }
          resolve();
        }),
      );
    });
  }, [dispatch]);

  const fetchbrand = useCallback(() => {
    return new Promise((resolve) => {
      dispatch(
        getBrandsAction(response => {
          if (response?.data?.status) {
            const brands = response?.data?.data || [];
            dispatch(setBrandsRedux(brands));
          }
          resolve();
        }),
      );
    });
  }, [dispatch]);

  const fetchCategories = useCallback(() => {
    return new Promise((resolve) => {
      dispatch(
        getCategoriesAction(response => {
          if (response?.data?.status) {
            // setCategories(response?.data?.data);
          } else {
            Toast.show(
              response?.data?.message || 'Category fetch failed',
              Toast.LONG,
            );
          }
          resolve();
        }),
      );
    });
  }, [dispatch]);

  const fetchAcountStatus = useCallback(
    () => {
      return new Promise((resolve) => {
        setourBestLoading(true);
        dispatch(
          getAccountStatusAction(response => {
            console.log('Account status response:', response);
            // setProducts(response?.data?.data || []);
            setourBestLoading(false);
            resolve();
          }),
        );
      });
    },
    [dispatch],
  );

  const fetchProducts = useCallback(
    (customPayload = {}) => {
      return new Promise((resolve) => {
        const payload = customPayload || filterPayload;
        setourBestLoading(true);
        dispatch(
          getProductsAction(payload, response => {
            setProducts(response?.data?.data || []);
            setourBestLoading(false);
            resolve();
          }),
        );
      });
    },
    [dispatch, filterPayload],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        init(),
        fetchCategories(),
        fetchBanner(),
        fetchProducts(),
        fetchbrand(),
        syncCartWithServer(),
        fetchAcountStatus(),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }

  }, [fetchCategories, fetchBanner, fetchProducts, fetchbrand, syncCartWithServer, init, fetchAcountStatus]);

  const handleScroll = useCallback(
    event => {
      const y = event.nativeEvent.contentOffset.y;
      setShowScrollToTop(y > 300);

      const contentHeight = event.nativeEvent.contentSize.height;
      const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

      if (y + scrollViewHeight >= contentHeight - 100 && !isSyncing && !refreshing) {
        syncCartWithServer();
      }
    },
    [isSyncing, syncCartWithServer, refreshing],
  );

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const navigateToSingleProductScreen = useCallback(
    item => {
      navigation.navigate(SCREEN.SINGLE_PRODUCT_SCREEN, { item });
    },
    [navigation],
  );

  const handleCategoryPress = useCallback(
    cat => {
      navigation.navigate(SCREEN.CATEGORY_PRODUCT_SCREEN, { data: cat });
    },
    [navigation],
  );

  const toggleLike = useCallback(
    item => {
      console.log('toggleLike', item?.id)
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

  const handleAddToCart = useCallback(
    async (item) => {
      const result = await addToCart(item);
      if (result?.requiresVariantSelection) {
        setSelectedProduct(result.item);
        setShowVariantModal(true);
      }
    },
    [addToCart, setSelectedProduct, setShowVariantModal],
  );

  const renderVariantItem = useCallback(
    ({ item, index }) => {
      const key = `${selectedProduct?.id}_${item.id}`;
      return (
        <MemoizedRenderItem
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

  const renderProductItem = useCallback(
    ({ item }) => (
      <ProductItem
        item={item}
        onPress={navigateToSingleProductScreen}
        onMorePress={item => {
          setSelectedProduct(item);
          setShowVariantModal(true);
        }}
        toggleLike={toggleLike}
        addToCart={handleAddToCart}
        dispatch={dispatch}
        showPrice={showPrice}
        isItemInCart={isItemInCart}
      />
    ),
    [navigateToSingleProductScreen, toggleLike, handleAddToCart, showPrice, isItemInCart],
  );

  const memoizedHeader = useMemo(
    () => (
      <View>
        {bannerImages.length > 0 && (
          <View style={styles.carouselContainer}>
            <Carousel
              data={bannerImages}
              onPressItem={item =>
                navigation.navigate(SCREEN.CATEGORY_PRODUCT_SCREEN, {
                  data: item,
                  bannerClick: true,
                })
              }
              interval={4000}
              height={height * 0.2}
            />
          </View>
        )}
        <View style={styles.categoryContainer}>
          <TextComp style={styles.categoryTitle}>Shop by category</TextComp>
          {categories.length > 0 && (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <CategoryItem cat={item} onPress={handleCategoryPress} />
              )}
              numColumns={3}
              columnWrapperStyle={styles.categoryGrid}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {products.length > 0 && (
          <TextComp style={styles.bestProductsTitle}>
            Explore our best products
          </TextComp>
        )}
      </View>
    ),
    [bannerImages, categories, products, navigation, handleCategoryPress],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={[COLORS.primaryAppColor]}
        tintColor={COLORS.primaryAppColor}
      />
    ),
    [refreshing, onRefresh],
  );

  const renderFilter = useCallback(
    ({ item }) => {
      const removeFilter = () => {
        if (String(item.id) === 'price') {
          setSelectedPrice(null);
        } else {
          const numericId = Number(item.id);
          setSelectedBrands((prev) => prev.filter((b) => b !== numericId));
          setSelectedBrandsObj((prev) => prev.filter((b) => b.id !== String(item.id)));
        }
      };

      return (
        <TouchableOpacity
          onPress={removeFilter}
          disabled
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
          }}>
          <TextComp style={{ color: COLORS.primaryAppColor, fontSize: scale(13) }}>
            {item.name}
          </TextComp>
          {/* <Text style={{ color: COLORS.black, marginLeft: 5 }}>×</Text> */}
        </TouchableOpacity>
      );
    },
    [setSelectedBrands, setSelectedBrandsObj, setSelectedPrice, COLORS, scale, TextComp],
  );

  const handleApplyFilters = useCallback(
    (filters) => {
      setIsFilterVisible(false);
      setFilterPayload(filters);
      fetchProducts(filters);
    },
    [fetchProducts],
  );

  const handleClearAll = useCallback(() => {
    setSelectedBrands([]);
    setSelectedBrandsObj([]);
    setSelectedPrice(null);
    fetchProducts({ brands: [], price_range: null });
  }, [setSelectedBrands, setSelectedBrandsObj, setSelectedPrice, fetchProducts]);

  // Moved useMemo outside conditional to fix hook warning
  const filterData = useMemo(
    () => [
      ...selectedBrandsObj,
      ...(selectedPrice ? [{ id: 'price', name: selectedPrice }] : []),
    ],
    [selectedBrandsObj, selectedPrice],
  );

  return (
    <Wrapper
      useTopInsets={true}
      childrenStyles={{ width }}
      safeAreaContainerStyle={{}}
    >
      <StaticeHeader onpressFilter={() => setIsFilterVisible(true)} />

      {isSyncing && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color={COLORS.primaryAppColor} />
          <TextComp style={styles.syncText}>Syncing cart...</TextComp>
        </View>
      )}
      {(selectedBrandsObj.length > 0 || selectedPrice) && (
        <View
          style={{
            paddingVertical: scale(5),
            flexDirection: 'row',
            alignItems: 'center',
          }}>
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
            }}>
            <TextComp style={{ fontWeight: '600', color: COLORS.primaryAppColor }}>
              Clear All
            </TextComp>
          </TouchableOpacity>
        </View>
      )}

      <ProductList
        ref={flatListRef}
        data={products}
        renderItem={renderProductItem}
        renderHeader={memoizedHeader}
        onScroll={handleScroll}
        ourBestLoading={ourBestLoading}
        refreshControl={refreshControl}
      />
      {showScrollToTop && (
        <TouchableOpacity onPress={scrollToTop} style={styles.scrollTopButton}>
          <Icon name="arrowup" size={20} color="#fff" type="AntDesign" />
          <TextComp style={styles.scrollTopText}>Scroll to top</TextComp>
        </TouchableOpacity>
      )}
      {showVariantModal && (
        <VariantModal
          product={selectedProduct}
          quantities={variantQuantities}
          setVariantQuantities={setVariantQuantities}
          onClose={() => {
            setShowVariantModal(false);
            setVariantQuantities({});
          }}
          renderItem={renderVariantItem}
          userData={userData}
          onSubmit={handleVariantSubmit}
        />
      )}
      <FilterModal
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        brands={brands}
        onApply={handleApplyFilters}
        setSelectedBrandsObj={setSelectedBrandsObj}
        selectedBrandsObj={selectedBrandsObj}
        setSelectedBrands={setSelectedBrands}
        selectedBrands={selectedBrands}
        selectedPrice={selectedPrice}
        setSelectedPrice={setSelectedPrice}
      />
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    height: height * 0.2,
    marginTop: verticalScale(12),
  },
  categoryContainer: {
    marginTop: verticalScale(15),
    paddingHorizontal: scale(13),
  },
  categoryTitle: {
    fontSize: scale(14),
    fontFamily: GABRITO_MEDIUM,
    marginLeft: scale(13),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
    fontWeight: '900',
    color: COLORS.black,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  bestProductsTitle: {
    fontSize: scale(14),
    fontFamily: GABRITO_MEDIUM,
    marginLeft: scale(13),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
    fontWeight: '900',
    color: COLORS.black,
  },
  scrollTopButton: {
    position: 'absolute',
    justifyContent: 'center',
    top: verticalScale(60),
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 30,
    zIndex: 100,
    elevation: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollTopText: {
    paddingHorizontal: 5,
    color: COLORS.white,
  },
  syncIndicator: {
    position: 'absolute',
    top: verticalScale(10),
    right: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: scale(5),
    borderRadius: 5,
    zIndex: 100,
    elevation: 5,
  },
  syncText: {
    marginLeft: scale(5),
    fontSize: scale(12),
    color: COLORS.black,
  },
});

export default Home;