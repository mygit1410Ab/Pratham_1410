import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import { clearCart } from '../redux/slices/cartSlice';
import { clearUserData } from '../redux/slices/userDataSlice';
import { logoutUser } from '../redux/slices/authSlice';
import { SCREEN } from '../app/layouts';



export const handleLogout = async (dispatch, navigation) => {
    try {
        dispatch(clearCart());
        dispatch(clearUserData());
        dispatch(logoutUser());
        dispatch({ type: 'LOGOUT' });

        await AsyncStorage.clear();
        Toast.show('User Logged out', Toast.SHORT);


        // navigation.reset({
        //     index: 0,
        //     routes: [{ name: SCREEN.LOGIN }],
        // });
    } catch (error) {
        console.error('Logout Error:', error);
        Toast.show('Logout Failed', Toast.SHORT);
    }
};
