import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, Image, TouchableOpacity } from 'react-native';
import { width, height } from '../hooks/responsive';

// Extract and memoize CarouselItem component outside
const CarouselItem = React.memo(({ item, index, onPressItem, borderRadius }) => (
  <View style={{ width: width, alignItems: 'center', justifyContent: 'center' }}>
    <TouchableOpacity onPress={() => onPressItem(item, index)} activeOpacity={0.8}>
      <Image
        source={{ uri: item.banner_image }}
        style={{
          width: width * 0.92,
          height: height * 0.2,
          borderRadius,
        }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  </View>
));

const Carousel = ({ data = [], onPressItem = () => { }, interval = 3000, borderRadius = 20 }) => {
  const flatListRef = useRef(null);
  const currentIndexRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);


  useEffect(() => {
    if (!data.length) return;

    const timer = setInterval(() => {
      let nextIndex = (currentIndexRef.current + 1) % data.length;
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, interval);

    return () => clearInterval(timer);
  }, [data.length, interval]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <CarouselItem
        item={item}
        index={index}
        onPressItem={onPressItem}
        borderRadius={borderRadius}
      />
    ),
    [onPressItem, borderRadius]
  );

  return (
    <View style={{ alignSelf: 'center' }}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          currentIndexRef.current = index;
          setCurrentIndex(index);
        }}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
    </View>
  );
};

export default React.memo(Carousel);
