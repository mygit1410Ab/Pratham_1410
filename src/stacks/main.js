import React, { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREEN } from '../app/layouts';
import DrawerStack from './drawerStack';
import CategoryProductsScreen from '../app/layouts/CategoryProductsScreen';
import Search from '../app/layouts/search';
import OrderStatus from '../app/layouts/orderStatus';
import SingleProductScreen from '../app/layouts/singleProductScreen';
import CashPayment from '../app/layouts/Cashpayment/CashPayment';
import Cart from '../app/layouts/cart';
import OrderItemDetails from '../app/layouts/orderItemsDetails';
import Invoice from '../app/layouts/invoice/Invoice';



const Stack = createNativeStackNavigator();

const Main = () => {

  const screens = useMemo(
    () => [
      { name: SCREEN.HOME_TAB, component: DrawerStack },
      { name: SCREEN.SEARCH, component: Search },
      { name: SCREEN.CATEGORY_PRODUCT_SCREEN, component: CategoryProductsScreen },
      { name: SCREEN.ORDER_STATUS, component: OrderStatus },
      { name: SCREEN.SINGLE_PRODUCT_SCREEN, component: SingleProductScreen },
      { name: SCREEN.CashPayment, component: CashPayment },
      { name: SCREEN.ORDER_DETAILS, component: OrderStatus },
      { name: SCREEN.ORDER_ITEMS_DETAILS, component: OrderItemDetails },
      { name: SCREEN.INVOICE, component: Invoice },


    ],
    []
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {screens.map(({ name, component }) => (
        <Stack.Screen key={name} name={name} component={component} />
      ))}
    </Stack.Navigator>
  );
};

export default React.memo(Main);
Cart