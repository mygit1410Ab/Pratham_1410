import React, {useCallback} from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {COLORS} from '../res/colors';
import {scale} from 'react-native-size-matters';
import {GABRITO_MEDIUM} from '../../assets/fonts';
import TextComp from '../app/components/textComp';
import {drawerScreens} from './drawerScreens';
import CustomDrawerContent from './customDrawerContent';

const Drawer = createDrawerNavigator();

const DrawerStack = () => {
  const getDrawerLabel = useCallback(
    label =>
      ({color}) =>
        (
          <TextComp
            allowFontScaling={false}
            style={{
              fontSize: scale(15),
              fontFamily: GABRITO_MEDIUM,
              color,
            }}>
            {label}
          </TextComp>
        ),
    [],
  );

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: COLORS.primaryAppColorOpacity(0.3),
      }}
      initialRouteName="Home"
      drawerContent={props => <CustomDrawerContent {...props} />}>
      {drawerScreens.map(({name, component, label}) => (
        <Drawer.Screen
          key={name}
          name={name}
          component={component}
          options={{drawerLabel: getDrawerLabel(label)}}
        />
      ))}
    </Drawer.Navigator>
  );
};

export default React.memo(DrawerStack);
