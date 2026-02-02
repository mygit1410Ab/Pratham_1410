import React, { useMemo, useCallback } from 'react';
import { Platform, Animated, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { scale, verticalScale } from 'react-native-size-matters';
import { SCREEN } from '../app/layouts';
import Home from '../app/layouts/home';
import Categories from '../app/layouts/categories';
import Cart from '../app/layouts/cart';
import TextComp from '../app/components/textComp';
import Icon from '../utils/icon';
import { COLORS } from '../res/colors';
import { useSelector } from 'react-redux';

const Tab = createBottomTabNavigator();

const BottomStack = () => {
  const cartItems = useSelector(state => state.cart.items);

  // Memoize cart count to avoid recalculations
  const cartCount = useMemo(() => cartItems?.length || 0, [cartItems]);

  // Tab Icon Renderer
  const renderTabIcon = useCallback(
    (route, focused, color) => {
      let iconName = '';
      let iconType = 'Feather';

      switch (route.name) {
        case SCREEN.HOME_TAB:
          iconName = 'home';
          iconType = 'Entypo';
          break;
        case SCREEN.CATEGORIES:
          iconName = 'format-list-bulleted-square';
          iconType = 'MaterialCommunityIcons';
          break;
        case SCREEN.CART:
          iconName = 'shopping-cart';
          iconType = 'Foundation';
          break;
        default:
          iconName = 'circle';
      }

      return (
        <>
          <Icon
            name={iconName}
            type={iconType}
            size={scale(24)}
            color={focused ? COLORS.white : COLORS.black}
          />
          {route.name === SCREEN.CART && cartCount > 0 && (
            <Animated.View style={styles.cartBadge}>
              <TextComp style={styles.cartBadgeText}>{cartCount}</TextComp>
            </Animated.View>
          )}
        </>
      );
    },
    [cartCount]
  );

  // Tab Label Renderer
  const renderTabLabel = useCallback(
    (route, focused, color) => (
      <TextComp
        allowFontScaling={false}
        style={[
          styles.tabLabel,
          { fontWeight: focused ? '700' : '400', color },
        ]}
      >
        {route.name}
      </TextComp>
    ),
    []
  );

  return (
    <Tab.Navigator
      initialRouteName={SCREEN.HOME_TAB}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) =>
          renderTabIcon(route, focused, color),
        tabBarLabel: ({ focused, color }) =>
          renderTabLabel(route, focused, color),
        tabBarStyle: styles.tabBar,
        headerShown: false,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen
        name={SCREEN.HOME_TAB}
        component={Home}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name={SCREEN.CATEGORIES}
        component={Categories}
        options={{ title: 'Categories' }}
      />
      <Tab.Screen
        name={SCREEN.CART}
        component={Cart}
        options={{ title: 'Cart' }}
      />
    </Tab.Navigator>
  );
};

export default BottomStack;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.primaryAppColor,
    paddingTop: scale(8),
  },
  tabLabel: {
    fontSize: scale(12),
  },
  cartBadge: {
    position: 'absolute',
    top: verticalScale(0),
    right: scale(-30),
    height: verticalScale(25),
    width: verticalScale(25),
    backgroundColor: COLORS.white,
    borderRadius: verticalScale(12.5),
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.primaryAppColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
