import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Foundation from 'react-native-vector-icons/Foundation';
import Octicons from 'react-native-vector-icons/Octicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Zocial from 'react-native-vector-icons/Zocial';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const Icon = ({ name, size = 24, color = 'black', type = 'MaterialIcons', style }) => {
  const IconComponent = {
    MaterialIcons,
    FontAwesome,
    Ionicons,
    Entypo,
    Feather,
    AntDesign,
    EvilIcons,
    Foundation,
    Octicons,
    SimpleLineIcons,
    Zocial,
    MaterialCommunityIcons,
    FontAwesome6
  }[type];

  return IconComponent ? <IconComponent name={name} size={size} color={color} style={style} /> : null;
};

export default Icon;
