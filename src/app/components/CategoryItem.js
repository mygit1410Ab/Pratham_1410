import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from "@d11/react-native-fast-image";
import { scale } from 'react-native-size-matters';
import TextComp from './textComp';
import { COLORS } from '../../res/colors';
import { View } from 'react-native';
import { IMAGES } from '../../res/images';

const CategoryItem = React.memo(({ cat, onPress }) => {
    // Validate image source
    const imageSource = useMemo(() => {
        const validUri = cat?.image && typeof cat.image === 'string' && cat.image.startsWith('http');
        return validUri
            ? { uri: cat.image, priority: FastImage.priority.normal }
            : IMAGES.NO_PRODUCT_IMG;
    }, [cat?.image]);

    // Memoize onPress
    const handlePress = useCallback(() => {
        onPress(cat);
    }, [onPress, cat]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            style={styles.categoryItem}>
            <FastImage
                source={imageSource}
                style={styles.categoryImage}
                resizeMode={FastImage.resizeMode.cover}
            />
            <View style={{
                flex: 1,
                width: scale(100),
            }} >
                <TextComp
                    numberOfLines={2}
                    style={[styles.categoryText, { color: COLORS.textColor || '#000' }]}>
                    {cat?.name || 'Category'}
                </TextComp>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    categoryItem: {
        width: (100 - scale(13) * 2) / 4 - scale(4),
        alignItems: 'center',
        marginVertical: 5,
    },
    categoryImage: {
        height: scale(72),
        width: scale(70),
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
    },
    categoryText: {
        fontSize: scale(11),
        marginTop: scale(5),
        textAlign: 'center',
    },
});

export default CategoryItem;
