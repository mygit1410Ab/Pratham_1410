import { combineReducers, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { persistReducer, persistStore } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import rootSaga from './sagas';
import authReducer from '../redux/slices/authSlice';
import categoryReducer from './reducer/category.reducer';
import cartReducer from '../redux/slices/cartSlice';
import favouritesReducer from '../redux/slices/favouritesSlice';
import userDataReducer from '../redux/slices/userDataSlice';
import brandsReducer from '../redux/slices/brandsSlice';
import togglePriceReducer from '../redux/slices/togglePriceSlice';
import accountStatusReducer from '../redux/slices/accountStatusSlice';


const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
  auth: authReducer,
  category: categoryReducer,
  cart: cartReducer,
  favorites: favouritesReducer,
  userData: userDataReducer,
  brands: brandsReducer,
  togglePrice: togglePriceReducer,
  accountStatus: accountStatusReducer,

});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['cart', 'favorites', 'userData', 'togglePrice', 'accountStatus'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: false,
    }).concat(sagaMiddleware), // Adding sagaMiddleware to the default middleware
});

sagaMiddleware.run(rootSaga); // Run the root saga (this is where you define your side effects)

export const persistor = persistStore(store);
export default store;
