import React from 'react';
import {
  FlatList,
  View,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { verticalScale } from 'react-native-size-matters';

import TextComp from './textComp';
import { IMAGES } from '../../res/images';
import { COLORS } from '../../res/colors';


const ProductList = React.forwardRef(
  (
    {
      data,
      renderItem,
      renderHeader,
      onScroll,
      ourBestLoading,
      refreshControl,
    },
    ref
  ) => {
    return (
      <FlatList
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        numColumns={1}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        data={data}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        windowSize={10}
        key={item => item.id}
        renderItem={renderItem}
        onScroll={onScroll}
        ref={ref}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: verticalScale(100) }}
        refreshControl={refreshControl}
        ListFooterComponent={() => (
          <View style={{ paddingBottom: 30 }}>
            {!ourBestLoading ? (
              <Image
                source={IMAGES.BLACK_LOGO_WITH_TEXT}
                style={{
                  height: verticalScale(500),
                  width: verticalScale(120),
                  alignSelf: 'center',
                  tintColor: COLORS.greyOpacity(1),
                }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          ourBestLoading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primaryAppColor}
              style={{ marginTop: 20 }}
            />
          ) : (
            <TextComp style={{ textAlign: 'center', marginTop: 20 }}>
              No products found
            </TextComp>
          )
        }
      />
    );
  }
);

ProductList.displayName = 'ProductList';

export default React.memo(ProductList);