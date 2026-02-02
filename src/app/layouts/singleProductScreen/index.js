import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Share,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { WebView } from 'react-native-webview';
import Wrapper from '../../components/wrapper';
import TextComp from '../../components/textComp';
import { COLORS } from '../../../res/colors';
import Icon from '../../../utils/icon';
import { useNavigation, useRoute } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import { IMAGES } from '../../../res/images';
import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  addToFavourites,
  removeFromFavourites,
} from '../../../redux/slices/favouritesSlice';
import { height } from '../../hooks/responsive';
import VariantModal from '../../VariantModal';
import MemoizedRenderItem from '../../components/MemoizedRenderItem';
import {
  useCartCheck,
  useCartOperations,
  useCartQuantity,
  useProductPricing,
  useCartItemManagement,
  useCartSync
} from '../../hooks/useCartFunctions';

const { width } = Dimensions.get('window');
const screenHeight = Dimensions.get('window').height;
const maxHeight = screenHeight * 0.3;
const minHeight = screenHeight * 0.1;

const SingleProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { item: routeItem } = route?.params || {};
  const [item, setItem] = useState(routeItem);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  console.log('item', item);
  const favorites = useSelector(state => state.favorites.items);
  const userData = useSelector(state => state.userData.userData);
  const showPrice = useSelector(state => state.togglePrice.showPrice);

  const scrollY = useRef(new Animated.Value(0)).current;

  const [showAttributes, setShowAttributes] = useState(true);
  const [showDes, setShowDes] = useState(true);
  const [showExtraDes, setShowExtraDes] = useState(true);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Cart hooks
  const {
    variantQuantities,
    setVariantQuantities,
    increaseQuantity,
    decreaseQuantity,
    getQuantity
  } = useCartQuantity();

  const { addToCart, handleVariantSubmit } = useCartOperations();
  const { isItemInCart, getCartItem } = useCartCheck();
  const { getPriceWithTax, getStockStatus } = useProductPricing();
  const { increaseCartItem, decreaseCartItem, pendingActions } = useCartItemManagement();

  // Cart synchronization
  const { isSyncing, syncError, syncCartWithServer } = useCartSync();

  // Show sync errors
  useEffect(() => {
    if (syncError) {
      Toast.show(`Cart sync error: ${syncError}`, Toast.LONG);
    }
  }, [syncError]);

  // Memoized derived states
  const isLiked = useMemo(
    () => favorites.some(fav => fav.id === item?.id),
    [favorites, item]
  );

  const cartItem = useMemo(() =>
    item ? getCartItem(item.id) : null,
    [item, getCartItem]
  );

  const isInCart = useMemo(() =>
    item ? isItemInCart(item.id) : false,
    [item, isItemInCart]
  );

  // Get pending action key for current item
  const pendingActionKey = useMemo(() => {
    if (!item) return '';
    return `${item.product_id || item.id}_${item?.variant_id || 0}`;
  }, [item]);

  const isCartActionPending = useMemo(() =>
    pendingActions[pendingActionKey],
    [pendingActions, pendingActionKey]
  );

  // Initialize media and merge cart data
  useEffect(() => {
    if (routeItem) {
      const updatedItem = { ...routeItem };
      setItem(updatedItem);

      // Initialize media
      const mediaItems = [
        ...(updatedItem?.display_image
          ? [{ type: 'image', uri: updatedItem.display_image }]
          : []),
        ...(updatedItem?.more_images || []).map(uri => ({ type: 'image', uri })),
        ...(updatedItem?.video_link
          ? [{ type: 'video', uri: updatedItem.video_link }]
          : []),
      ];

      setSelectedMedia(mediaItems[0] || null);
    }
  }, [routeItem]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        syncCartWithServer(),
        new Promise(resolve => setTimeout(resolve, 500)), // Simulate refresh delay
      ]);
      Toast.show('Product refreshed');
    } catch (error) {
      Toast.show('Failed to refresh');
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

  // Memoized handlers
  const toggleLike = useCallback(
    (productItem) => {
      const isAlreadyInFavorites = favorites.some(fav => fav.id === productItem.id);
      if (isAlreadyInFavorites) {
        dispatch(removeFromFavourites(productItem.id));
        Toast.show('Item removed from favourites');
      } else {
        dispatch(addToFavourites(productItem));
        Toast.show('Item added to favourites');
      }
    },
    [dispatch, favorites]
  );

  const handleAddToCart = useCallback(async (productItem) => {
    setLoading(true);
    try {
      const result = await addToCart(productItem);
      if (result?.requiresVariantSelection) {
        setSelectedProduct(result.item);
        setShowVariantModal(true);
      } else if (result?.success) {
        // Sync cart after successful addition
        syncCartWithServer();
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setLoading(false);
    }
  }, [addToCart, syncCartWithServer]);

  const handleLongPress = useCallback(() => {
    const code = item?.hsn_code || '';
    if (code) {
      Clipboard.setString(code);
      Toast.show('HSN Code copied!');
    }
  }, [item]);

  const handleShare = useCallback(async () => {
    if (!item) return;
    try {
      await Share.share({
        message: `${item.product_name} - Check it out: ${item.display_image}`,
      });
    } catch (error) {
      console.log('Error sharing:', error.message);
    }
  }, [item]);

  const handleMorePress = useCallback(() => {
    setSelectedProduct(item);
    setShowVariantModal(true);
  }, [item]);

  const handleCloseVariantModal = useCallback(() => {
    setShowVariantModal(false);
    setVariantQuantities({});
  }, [setVariantQuantities]);

  // Enhanced variant submit with sync
  const handleVariantSubmitWithSync = useCallback(async (selectedVariants) => {
    const result = await handleVariantSubmit(selectedVariants);
    if (result?.success) {
      // Sync cart after successful variant addition
      syncCartWithServer();
    }
    return result;
  }, [handleVariantSubmit, syncCartWithServer]);

  // Memoized interpolations and styles
  const mediaHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [maxHeight, minHeight],
    extrapolate: 'clamp',
  });

  const stickyMediaContainerStyle = useMemo(
    () => ({
      height: mediaHeight,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      zIndex: 99,
      overflow: 'visible',
    }),
    [mediaHeight]
  );

  const mediaItems = useMemo(
    () => [
      ...(item?.display_image
        ? [{ type: 'image', uri: item.display_image }]
        : []),
      ...(item?.more_images || []).map(uri => ({ type: 'image', uri })),
      ...(item?.video_link ? [{ type: 'video', uri: item.video_link }] : []),
    ],
    [item]
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

  // Memoized render functions
  const renderVariantItem = useCallback(
    ({ item: variant, index }) => {
      const key = `${selectedProduct?.id}_${variant.id}`;
      return (
        <MemoizedRenderItem
          key={key}
          id={key}
          item={variant}
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

  const renderStickyMedia = useCallback(() => {
    if (!selectedMedia) {
      return (
        <Animated.View style={stickyMediaContainerStyle}>
          <Image
            source={IMAGES.NO_PRODUCT_IMG}
            style={styles.stickyMedia}
            resizeMode="contain"
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View style={stickyMediaContainerStyle}>
        {selectedMedia.type === 'image' ? (
          <Image
            source={{ uri: selectedMedia.uri }}
            style={styles.stickyMedia}
            resizeMode="contain"
          />
        ) : (
          <WebView
            source={{ uri: selectedMedia.uri }}
            style={styles.stickyMedia}
            javaScriptEnabled
            domStorageEnabled
          />
        )}
      </Animated.View>
    );
  }, [selectedMedia, stickyMediaContainerStyle]);

  const renderAttributes = useCallback(() => {
    if (!item?.attributes?.length) return null;

    return (
      <View style={styles.attributesContainer}>
        <TouchableOpacity
          onPress={() => setShowAttributes(prev => !prev)}
          style={styles.attributesHeader}>
          <TextComp style={styles.sectionTitle}>Specifications</TextComp>
          <Icon
            type="AntDesign"
            name={showAttributes ? 'up' : 'down'}
            size={scale(16)}
            color={COLORS.black}
          />
        </TouchableOpacity>

        {showAttributes && (
          <View style={{ paddingHorizontal: verticalScale(8) }}>
            {item.attributes.map((attr, idx) => (
              <View key={idx} style={styles.attributeRow}>
                <TextComp style={styles.attributeLabel}>
                  {attr?.label}:
                </TextComp>
                <TextComp style={styles.attributeValue}>{attr?.value}</TextComp>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }, [item, showAttributes]);

  const renderThumbnails = useCallback(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailRow}>
        {mediaItems.map((media, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedMedia(media)}
            style={[
              styles.thumbnailWrapper,
              selectedMedia?.uri === media.uri && styles.activeThumbnail,
            ]}>
            {media.type === 'image' ? (
              <Image
                source={{ uri: media.uri }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.videoThumb}>
                <Icon type="Entypo" name="video" color="white" size={20} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    ),
    [mediaItems, selectedMedia]
  );

  const renderBottomBar = useCallback(() => {
    if (!item) return null;

    const { isOutOfStock } = getStockStatus(item);

    // Variant products
    if (item?.variants?.length > 0) {
      return (
        <TouchableOpacity
          style={[styles.addToCartBtn, (loading || isSyncing) && styles.disabledButton]}
          onPress={() => handleAddToCart(item)}
          disabled={loading || isSyncing}
        >
          {loading || isSyncing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <TextComp style={styles.addToCartText}>
              {'Add to Cart'}
            </TextComp>
          )}
        </TouchableOpacity>
      );
    }

    // Non-variant products in cart
    if (cartItem) {
      return (
        <View style={styles.quantityControls}>
          <TouchableOpacity
            onPress={() => decreaseCartItem({
              ...item,
              itemQuantity: cartItem?.itemQuantity
            })}
            style={styles.quantityButton}
            disabled={isCartActionPending || isSyncing}
          >
            <Icon
              type="AntDesign"
              name="minus"
              color={COLORS.white}
              size={22}
            />
          </TouchableOpacity>

          {
            isCartActionPending || isSyncing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <TextComp style={styles.quantityText}>
                {cartItem.itemQuantity}
              </TextComp>
            )
          }

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => increaseCartItem({
              ...item,
              itemQuantity: cartItem?.itemQuantity
            })}
            disabled={isCartActionPending || isSyncing}
          >
            <Icon type="AntDesign" name="plus" color={COLORS.white} size={22} />
          </TouchableOpacity>
        </View>
      );
    }

    // Add to cart button for non-variant
    return (
      <TouchableOpacity
        style={[
          styles.addToCartBtn,
          (loading || isOutOfStock || isSyncing) && styles.disabledButton,
        ]}
        onPress={() => handleAddToCart(item)}
        disabled={loading || isOutOfStock || isSyncing}
      >
        {loading || isSyncing ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <TextComp style={styles.addToCartText}>
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </TextComp>
        )}
      </TouchableOpacity>
    );
  }, [item, cartItem, loading, isCartActionPending, isSyncing, handleAddToCart, increaseCartItem, decreaseCartItem, getStockStatus]);

  if (!item) {
    return (
      <Wrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondaryAppColor} />
        </View>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      bottomInsetBgColor={COLORS.secondaryAppColor}
      childrenStyles={{
        backgroundColor: COLORS.white,
        flex: 1,
        width,
      }}>

      {SyncIndicator}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon
            name="arrowleft"
            color={COLORS.white}
            size={scale(22)}
            type="AntDesign"
          />
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={handleRefresh}
            style={{ padding: 15 }}
            disabled={refreshing || isSyncing}
          >
            <Icon
              type="AntDesign"
              name={refreshing || isSyncing ? 'loading1' : 'reload1'}
              color={refreshing || isSyncing ? COLORS.grey : COLORS.secondaryAppColor}
              size={22}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={{ padding: 15 }}>
            <Icon
              type="Entypo"
              name="share"
              color={COLORS.secondaryAppColor}
              size={22}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleLike(item)}
            style={{ padding: 15 }}
          >
            <Icon
              type="FontAwesome"
              name="heart"
              color={isLiked ? COLORS.primaryAppColor : COLORS.secondaryAppColor}
              size={22}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {renderStickyMedia()}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.container}
          scrollEventThrottle={16}
          refreshControl={refreshControl}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          contentContainerStyle={{ paddingBottom: verticalScale(80) }}>
          {renderThumbnails()}

          {/* Product Info */}
          <View style={styles.infoContainer}>
            <View style={{ alignItems: 'center', justifyContent: 'center', gap: scale(5), flexDirection: 'row' }}>
              {item?.image && <Image
                style={{ height: scale(25), width: scale(25) }}
                source={{ uri: item?.image }}
              />}
              <TextComp style={{ fontWeight: '700', color: COLORS.primaryTextColor }}>
                {item?.brand?.name}
              </TextComp>
            </View>

            {/* Fixed stock limit check - using cartItem instead of item */}
            {isInCart && cartItem && cartItem?.itemQuantity >= cartItem?.quantity && (
              <View style={styles.stockLimitTag}>
                <TextComp style={styles.stockLimitText}>Maximum quantity reached</TextComp>
              </View>
            )}

            <View style={styles.priceRow}>
              <View style={{ width: '60%', }}>
                <TextComp style={styles.title} numberOfLines={2}>
                  {item.product_name}
                </TextComp>
              </View>
              <View style={styles.hsnContainer}>
                {item?.warranty && item?.warranty !== 'null' && (
                  <Image
                    source={{ uri: item?.warranty?.image }}
                    style={styles.warrantyImage}
                    resizeMode="contain"
                  />
                )}
                <View>
                  {(item?.mrp !== null && item?.mrp !== undefined && item?.mrp !== '' && Number(item?.mrp) > 0) && (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <TextComp style={styles.mrp}>MRP: </TextComp>
                        <TextComp style={[styles.rupeeSymbol, { fontSize: scale(9) }]}>₹</TextComp>
                        <TextComp style={[styles.priceText, {
                          fontSize: scale(12),
                          textDecorationLine: 'line-through',
                          color: COLORS.red,
                        }]}>
                          {item?.mrp}
                        </TextComp>
                      </View>
                    </View>
                  )}

                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <TextComp style={[styles.rupeeSymbol]}>₹</TextComp>
                      <TextComp style={styles.priceText}>
                        {showPrice
                          ? getPriceWithTax(item, item.variants[0])
                          : '...'}
                      </TextComp>
                    </View>
                    <TextComp style={[styles.rupeeSymbol, { marginTop: 0, fontWeight: '500' }]}>
                      {'  incl GST'}
                    </TextComp>
                  </View>
                </View>
              </View>
            </View>

            {item.variants?.length > 0 ? (
              <View style={[styles.variantInfo, { width: '100%', justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row' }}>
                  <TextComp numberOfLines={1} style={styles.sizeText}>
                    {`Size: ${item.variants[0]?.details?.size || 'N/A'}`}
                  </TextComp>
                  <TouchableOpacity onPress={handleMorePress}>
                    <TextComp style={styles.moreText}>More</TextComp>
                  </TouchableOpacity>
                </View>
                <Pressable
                  style={{ marginTop: scale(5) }}
                  onLongPress={handleLongPress}>
                  <View style={styles.hsnCodeContainer}>
                    <TextComp style={styles.hsnText}>
                      {item?.hsn_code || ''}
                    </TextComp>
                  </View>
                </Pressable>
              </View>
            ) : item?.sizes ? (
              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                <TextComp numberOfLines={1} style={styles.sizeText}>
                  {`Size: ${item.sizes}`}
                </TextComp>
                <Pressable onLongPress={handleLongPress}>
                  <View style={styles.hsnCodeContainer}>
                    <TextComp style={styles.hsnText}>
                      {item?.hsn_code || ''}
                    </TextComp>
                  </View>
                </Pressable>
              </View>
            ) : <View style={{ width: '100%', alignItems: 'flex-end' }}>

              <Pressable onLongPress={handleLongPress}>
                <View style={styles.hsnCodeContainer}>
                  <TextComp style={styles.hsnText}>
                    {item?.hsn_code || ''}
                  </TextComp>
                </View>
              </Pressable>
            </View>}
          </View>

          {renderAttributes()}

          {item?.description && (
            <>
              <TouchableOpacity
                onPress={() => setShowDes(prev => !prev)}
                style={styles.attributesHeader}>
                <TextComp style={styles.sectionTitle}>Description</TextComp>
                <Icon
                  type="AntDesign"
                  name={showDes ? 'up' : 'down'}
                  size={scale(16)}
                  color={COLORS.black}
                />
              </TouchableOpacity>
              {showDes && (
                <View style={styles.descriptionContainer}>
                  <RenderHtml
                    source={{ html: item.description }}
                    baseStyle={styles.descriptionText}
                    contentWidth={width}
                  />
                </View>
              )}
            </>
          )}

          {item?.extra_description && (
            <>
              <TouchableOpacity
                onPress={() => setShowExtraDes(prev => !prev)}
                style={styles.attributesHeader}>
                <TextComp style={styles.sectionTitle}>
                  Extra Description
                </TextComp>
                <Icon
                  type="AntDesign"
                  name={showExtraDes ? 'up' : 'down'}
                  size={scale(16)}
                  color={COLORS.black}
                />
              </TouchableOpacity>

              {showExtraDes && (
                <View style={[styles.descriptionContainer, { marginTop: 0 }]}>
                  <RenderHtml
                    source={{ html: item.extra_description }}
                    baseStyle={styles.descriptionText}
                    contentWidth={width}
                  />
                </View>
              )}
            </>
          )}
        </Animated.ScrollView>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>{renderBottomBar()}</View>

      {showVariantModal && selectedProduct && (
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: verticalScale(50),
    width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    backgroundColor: COLORS.white,
    zIndex: 100,
  },
  backButton: {
    backgroundColor: COLORS.secondaryAppColor,
    height: verticalScale(30),
    width: verticalScale(30),
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  thumbnailRow: {
    height: scale(80),
    paddingLeft: moderateScale(10),
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    marginTop: screenHeight * 0.3,
  },
  thumbnailWrapper: {
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    width: scale(70),
    height: scale(70),
  },
  activeThumbnail: {
    borderColor: COLORS.secondaryAppColor,
    borderWidth: 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingHorizontal: scale(10),
    paddingVertical: 5,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#222',
    marginBottom: scale(5),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  mrp: {
    fontSize: scale(12),
    color: COLORS.black,
  },
  hsnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warrantyImage: {
    height: verticalScale(30),
    width: verticalScale(30),
    marginRight: moderateScale(5),
  },
  hsnCodeContainer: {
    backgroundColor: '#ccc',
    paddingHorizontal: verticalScale(8),
    paddingVertical: verticalScale(3),
    borderRadius: 5,
  },
  attributesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(5),
    borderColor: COLORS.grey,
    paddingHorizontal: verticalScale(8),
    marginBottom: scale(25)
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  attributeLabel: {
    fontWeight: '600',
    color: COLORS.black,
    width: '40%',
    fontSize: scale(14),
  },
  attributeValue: {
    color: COLORS.black,
    flex: 1,
    fontSize: scale(14),
  },
  descriptionContainer: {
    marginTop: -40,
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginBottom: verticalScale(10),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    marginBottom: verticalScale(10),
  },
  stickyMedia: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.secondaryAppColor,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  addToCartBtn: {
    backgroundColor: COLORS.primaryAppColor,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addToCartText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginRight: moderateScale(10),
    marginTop: verticalScale(10),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: height,
    width: width,
    zIndex: 200,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: scale(10),
    padding: scale(15),
    maxHeight: height * 0.75,
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
  quantityControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryAppColor,
    borderRadius: scale(6),
    paddingVertical: verticalScale(0),
  },
  quantityButton: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(5),
  },
  quantityText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: scale(16),
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  descriptionText: {
    fontSize: scale(14),
    color: COLORS.secondaryAppColor,
    lineHeight: scale(20),
  },
  rupeeSymbol: {
    fontSize: scale(11),
    fontWeight: '700',
    color: COLORS.secondaryAppColor,
  },
  priceText: {
    fontSize: scale(15),
    fontWeight: '900',
    color: COLORS.secondaryAppColor,
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
  stockLimitTag: {
    backgroundColor: COLORS.redOpacity(0.1),
    borderColor: COLORS.red,
    borderWidth: 1,
    borderRadius: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    alignSelf: 'flex-start',
    marginTop: scale(5),
  },
  stockLimitText: {
    color: COLORS.red,
    fontSize: scale(10),
    fontWeight: '600',
  },
});

export default SingleProductScreen;