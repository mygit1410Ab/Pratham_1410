import {
  View,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import React, { useState } from 'react';
import Wrapper from '../../components/wrapper';
import { width } from '../../hooks/responsive';
import StaticeHeader from '../../components/staticeHeader';
import { SCREEN } from '..';
import { scale, verticalScale } from 'react-native-size-matters';
import TextComp from '../../components/textComp';
import { COLORS } from '../../../res/colors';
import { useDispatch, useSelector } from 'react-redux';
import { getProductsByCategoryAction } from '../../../redux/action';
import { useNavigation } from '@react-navigation/native';
import FastImage from '@d11/react-native-fast-image';

const Categories = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const categories = useSelector(state => state.category.categories) || [];
  const [data] = useState(categories);

  const renderCategoryItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate(SCREEN.CATEGORY_PRODUCT_SCREEN, {
            data: item,
          })
        }
        style={{
          width: (width - scale(13) * 2) / 3 - scale(4),
          alignItems: 'center',
          marginVertical: verticalScale(5),
          backgroundColor: '#FFF'
        }}>
        <FastImage
          source={{ uri: item.image }}
          style={{
            height: scale(92),
            width: scale(90),
            borderRadius: scale(8),
            aspectRatio: 1,
            borderRadius: scale(8),
            borderWidth: 1,
            borderColor: COLORS.borderColor || '#ccc',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: scale(4),
            elevation: 7,
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
          resizeMode="cover"
        />

        <TextComp
          numberOfLines={1}
          style={{
            fontSize: scale(11),
            marginTop: scale(5),
            textAlign: 'center',
          }}>
          {item.name}
        </TextComp>
      </TouchableOpacity>
    );
  };

  return (
    <Wrapper
      useTopInsets
      childrenStyles={{ width: width * 0.96 }}>

      <StaticeHeader showFilterIcon={false} />

      <FlatList
        data={data}
        renderItem={renderCategoryItem}
        keyExtractor={item => String(item.id)}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: verticalScale(16),
          paddingBottom: verticalScale(100),
        }}
        columnWrapperStyle={{
          justifyContent: 'space-between',
        }}
      />
    </Wrapper>
  );
};

export default Categories;
