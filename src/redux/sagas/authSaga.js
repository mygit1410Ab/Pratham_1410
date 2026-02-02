import { call, put, takeLatest } from 'redux-saga/effects';
import {
  ADD_TO_CART,
  CANCEL_ORDER,
  CLEAR_CART,
  EDIT_PROFILE,
  GET_BANNER_PRODUCTS,
  GET_BANNERS_ACTION,
  GET_BRANDS,
  GET_BRANDS_ACTION,
  GET_CART_ITEMS,
  GET_CATEGORIES_ACTION,
  GET_ORDERHISTORY,
  GET_PRODUCTS,
  GET_PRODUCTS_BY_CATEGORY,
  GET_SEARCH,
  LOGIN_ACTION,
  PLACE_ORDER,
  REMOVE_CART_ITEM,
  REQUEST_FORGET_PASSWORD_ACTION,
  RESET_PASSWORD_ACTION,
  SET_CATEGORIES,
  SIGNUP_ACTION,
  TRACK_ORDER,
  UPDATE_CART_ITEM,
  UPDATE_MULTIPLE_CART_ITEMS,
  VERIFY_EMAIL_ACTION,
  VERIFY_FORGET_PASSWORD_OTP_ACTION,
  SYNC_CART,
  GET_PROFILE,
  GET_POLICY,
  GET_ACCOUNT_STATUS,
  GET_NOTIFICATIONS_ACTION,
  MARK_NOTIFICATION_READ_ACTION,
  MARK_ALL_READ_ACTION,
  DELETE_NOTIFICATION_ACTION,
} from '../action/types';
import axios from '../../utils/axiosConfig';
import { BASE_URL, END_POINTS } from '../../utils/config';
import { setUserData } from '../slices/userDataSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAccountStatus, setAccountStatusLoading } from '../slices/accountStatusSlice';

// Utility function
const safeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

function* handleAccountInactive(res) {
  const data = res?.data || res?.response?.data;

  if (data?.error_type === 'account_inactive') {
    yield put({ type: 'cart/setLoading', payload: false });
    yield put({ type: 'cart/setSyncing', payload: false });

    yield put(setAccountStatus({
      is_active: false,
      status: 'inactive',
      raw_status: data.data,
    }));
    return true;
  }
  return false;
}

// ==================== AUTH SAGAS ====================

function* login(payload) {
  return yield axios.post(`${BASE_URL}${END_POINTS.LOGIN}`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function* loginSaga(action) {
  try {
    const response = yield call(login, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* signup(payload) {
  return yield axios.post(`${BASE_URL}${END_POINTS.SIGNUP}`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function* signupSaga(action) {
  try {
    const response = yield call(signup, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* resetPassword(payload) {
  return yield axios.post(`${BASE_URL}${END_POINTS.RESET_PASSWORD}`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function* resetPasswordSaga(action) {
  try {
    const response = yield call(resetPassword, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* verifyEmail(payload) {
  return yield axios.post(`${BASE_URL}${END_POINTS.VERIFY_EMAIL}`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function* verifyEmailSaga(action) {
  try {
    const response = yield call(verifyEmail, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* forgotPasswordRequest(payload) {
  return yield axios.post(
    `${BASE_URL}${END_POINTS.REQUEST_FORGET_PASSWORD}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export function* forgotPasswordRequestSaga(action) {
  try {
    const response = yield call(forgotPasswordRequest, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* verifyForgotPasswordOtp(payload) {
  return yield axios.post(
    `${BASE_URL}${END_POINTS.VERIFY_FORGET_PASSWORD_OTP}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export function* verifyForgotPasswordOtpSaga(action) {
  try {
    const response = yield call(verifyForgotPasswordOtp, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

// ==================== PROFILE SAGAS ====================

function* getUserData() {
  try {
    const response = yield call(
      axios.get,
      END_POINTS.GET_USERDATA,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        params: { t: Date.now() },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export function* getProfileSaga(action) {
  try {
    const response = yield call(getUserData);

    if (response?.status) {
      const userData = response?.data?.user;
      yield put(setUserData(userData));
    }

    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* editProfile(payload) {
  const formData = new FormData();
  Object.keys(payload).forEach(element => {
    formData.append(element, payload[element]);
  });

  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.EDIT_PROFILE_DATA}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

function* editProfileSaga(action) {
  try {
    const response = yield call(editProfile, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

// ==================== PRODUCT & CATEGORY SAGAS ====================

function* getBanners() {
  return yield call(axios.get, `${BASE_URL}${END_POINTS.GET_BANNERS}`);
}

function* getBannersSaga(action) {
  try {
    const response = yield call(getBanners);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* getCategories() {
  return yield call(axios.get, `${BASE_URL}${END_POINTS.GET_CATEGORIES}`);
}

function* getCategoriesSaga(action) {
  try {
    const response = yield call(getCategories);
    if (response?.data?.status) {
      yield put({ type: SET_CATEGORIES, payload: response?.data?.data });
    }
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error?.response || {
      data: {
        status: false,
        message: error?.response?.data?.message || 'Something went wrong!'
      }
    });
  }
}

function* getProductsByCategory(payload) {
  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.GET_PRODUCTS_BY_CATEGORY_API}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

function* getProductsByCategorySaga(action) {
  try {
    const response = yield call(getProductsByCategory, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* getProducts(payload) {
  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.GET_PRODUCTS}`,
    payload,
    { headers: { 'Cache-Control': 'no-cache' } }
  );
}

function* getProductsSaga(action) {
  try {
    const response = yield call(getProducts, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* getSearch(payload) {
  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.SEARCH}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

function* getSearchSaga(action) {
  try {
    const response = yield call(getSearch, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* getBannerProducts(payload) {
  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.GET_BANNER_PRODUCTS}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

function* getBannerProductsSaga(action) {
  try {
    const response = yield call(getBannerProducts, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

// ==================== BRANDS SAGA ====================

function* getBrands(payload) {
  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.GET_BRANDS_END_POINT}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

function* getBrandsSaga(action) {
  try {
    const response = yield call(getBrands, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

// ==================== ORDER SAGAS ====================

function* placeOrder(payload) {
  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.PLACE_ORDER}`,
    payload,
    { headers: { 'Cache-Control': 'no-cache' } }
  );
}

function* placeOrderSaga(action) {
  try {
    const response = yield call(placeOrder, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function* getOrderHistory(payload) {
  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.ORDER_HISTORY_END_POINT}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

function* getOrderHistorySaga(action) {
  try {
    const response = yield call(getOrderHistory, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error);
  }
}

function cancelOrderByIdApi(payload) {
  return axios.post(
    `${BASE_URL}${END_POINTS.CANCEL_ORDER_END_POINT}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

function trackOrderByIdApi(payload) {
  return axios.post(
    `${BASE_URL}${END_POINTS.TRACK_ORDER_END_POINT}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

function* cancelOrderByIdSaga(action) {
  try {
    const response = yield call(cancelOrderByIdApi, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error.response || error);
  }
}

function* trackOrderByIdSaga(action) {
  try {
    const response = yield call(trackOrderByIdApi, action.payload);
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error.response || error);
  }
}

// ==================== CART SAGAS ====================

function* cartApi(payload) {
  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.CART}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

function* addToCartSaga(action) {
  try {
    const response = yield call(cartApi, { action: 'add', ...action.payload });

    if (yield call(handleAccountInactive, response)) return;

    if (response?.data?.status) {
      yield put({ type: 'cart/addToCart', payload: action.payload });
    }

    action.callBack?.(response);
  } catch (error) {
    if (yield call(handleAccountInactive, error)) return;
    action.callBack?.(error?.response || {
      data: { status: false, message: error.message }
    });
  }
}

function* updateCartItemSaga(action) {
  try {
    const response = yield call(cartApi, { action: 'update', ...action.payload });

    if (yield call(handleAccountInactive, response)) return;

    if (response?.data?.status) {
      yield put({
        type: 'cart/updateCartItem',
        payload: {
          product_id: action.payload.product_id,
          variant_id: action.payload.variant_id || 0,
          updates: { itemQuantity: response.data.data.new_quantity },
        },
      });
    }

    action.callBack?.(response);
  } catch (error) {
    if (yield call(handleAccountInactive, error)) return;
    action.callBack?.(error?.response || {
      data: { status: false, message: error.message }
    });
  }
}

function* removeCartItemSaga(action) {
  try {
    const response = yield call(cartApi, { action: 'remove', ...action.payload });

    if (yield call(handleAccountInactive, response)) return;

    if (response?.data?.status) {
      yield put({
        type: 'cart/removeFromCart',
        payload: {
          product_id: action.payload.product_id,
          variant_id: action.payload.variant_id || 0,
        },
      });
    }

    action.callBack?.(response);
  } catch (error) {
    if (yield call(handleAccountInactive, error)) return;
    action.callBack?.(error?.response || {
      data: { status: false, message: error.message }
    });
  }
}

function* getCartItemsSaga(action) {
  try {
    yield put({ type: 'cart/setLoading', payload: true });

    const response = yield call(cartApi, { action: 'get', user_id: action.payload.user_id });

    if (yield call(handleAccountInactive, response)) return;

    if (response?.data?.status) {
      yield put({ type: 'cart/clearCart' });

      const items = response.data.data.cart_items || [];
      for (const item of items) {
        yield put({
          type: 'cart/addToCart',
          payload: {
            ...item,
            itemQuantity: safeNumber(item.quantity),
            stepsize: safeNumber(item.stepsize, 1),
            maxQuantity: safeNumber(item.maxQuantity || item.quantity),
          },
        });
      }

      yield put({ type: 'cart/setLoading', payload: false });
      yield put({ type: 'cart/getCartItemsSuccess' });
    } else {
      yield put({ type: 'cart/getCartItemsFailure', payload: response?.data?.message });
      yield put({ type: 'cart/setLoading', payload: false });
    }

    action.callBack?.(response);
  } catch (error) {
    if (yield call(handleAccountInactive, error)) return;
    yield put({ type: 'cart/getCartItemsFailure', payload: error.message });
    yield put({ type: 'cart/setLoading', payload: false });
    action.callBack?.(error?.response || {
      data: { status: false, message: error.message }
    });
  }
}

function* updateMultipleCartItemsSaga(action) {
  try {
    const { user_id, updates } = action.payload;

    for (const update of updates) {
      const response = yield call(cartApi, { user_id, ...update });

      if (yield call(handleAccountInactive, response)) return;

      if (response?.data?.status) {
        if (update.action === 'add') {
          yield put({ type: 'cart/addToCart', payload: update });
        }
        if (update.action === 'update') {
          yield put({ type: 'cart/updateCartItem', payload: update });
        }
        if (update.action === 'remove') {
          yield put({ type: 'cart/removeFromCart', payload: update });
        }
      }
    }

    action.callBack?.({ data: { status: true, message: 'All items processed' } });
  } catch (error) {
    if (yield call(handleAccountInactive, error)) return;
    action.callBack?.(error?.response || {
      data: { status: false, message: error.message }
    });
  }
}

function* clearCartSaga(action) {
  try {
    const response = yield call(cartApi, { action: 'clear', ...action.payload });

    if (yield call(handleAccountInactive, response)) return;

    if (response?.data?.status) {
      yield put({ type: 'cart/clearCart' });
    }

    action.callBack?.(response);
  } catch (error) {
    if (yield call(handleAccountInactive, error)) return;
    action.callBack?.(error?.response || {
      data: { status: false, message: error.message }
    });
  }
}

function* syncCartSaga(action) {
  try {
    yield put({ type: 'cart/setSyncing', payload: true });

    const response = yield call(cartApi, { action: 'get', user_id: action.payload.user_id });

    if (yield call(handleAccountInactive, response)) return;

    if (response?.data?.status) {
      yield put({
        type: 'cart/syncCart',
        payload: {
          items: response.data.data.cart_items || [],
          cart_summary: response.data.data.cart_summary || null,
          meta: response.data.meta || null,
        },
      });
      yield put({ type: 'cart/setSyncing', payload: false });
      yield put({ type: 'cart/setSyncError', payload: null });
    } else {
      yield put({ type: 'cart/setSyncError', payload: response?.data?.message });
      yield put({ type: 'cart/setSyncing', payload: false });
    }

    action.callBack?.(response);
  } catch (error) {
    if (yield call(handleAccountInactive, error)) return;
    yield put({ type: 'cart/setSyncError', payload: error.message });
    yield put({ type: 'cart/setSyncing', payload: false });
    action.callBack?.(error?.response || {
      data: { status: false, message: error.message }
    });
  }
}

// ==================== POLICY SAGA ====================

function* getPolicy(payload) {
  const { type } = payload;
  return yield call(
    axios.get,
    `${BASE_URL}${END_POINTS.GET_POLICY}${type}`,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

function* getPolicySaga(action) {
  try {
    const response = yield call(getPolicy, action.payload);
    action.callBack?.(response.data);
  } catch (error) {
    action.callBack?.(error);
  }
}

// ==================== ACCOUNT STATUS SAGA ====================

function* getAccountStatus(payload) {
  return yield call(
    axios.post,
    `${BASE_URL}${END_POINTS.GET_ACCOUNT_STATUS}`,
    payload,
    { headers: { 'Cache-Control': 'no-cache' } }
  );
}

function* getAccountStatusSaga(action) {
  try {
    yield put(setAccountStatusLoading(true));
    const response = yield call(getAccountStatus, action.payload);

    const acc = response?.data?.data?.account_state;
    yield put(setAccountStatus(acc));

    action.callBack?.(response);
  } catch (error) {
    yield put(setAccountStatusLoading(false));
    action.callBack?.(error);
  }
}

// ==================== NOTIFICATION SAGAS ====================

function* notificationAPI(params) {
  return yield call(
    axios.post,
    END_POINTS.GET_NOTIFICATIONS,
    params
  );
}

function* getNotificationsSaga(action) {
  try {
    console.log('ACTION ===>', action);

    const response = yield call(notificationAPI, action.params);

    console.log('RESPONSE ===>', response);

    if (typeof action.callBack === 'function') {
      action.callBack(response);
    }
  } catch (error) {
    if (typeof action.callBack === 'function') {
      action.callBack(
        error?.response || {
          data: {
            status: false,
            message: error?.message || 'Network error',
          },
        }
      );
    }
  }
}

function* markNotificationReadSaga(action) {
  try {
    const response = yield call(notificationAPI, {
      ...action.params,
      action: 'mark_read',
    });
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error?.response || {
      data: { status: false, message: 'Failed to mark as read' }
    });
  }
}

function* markAllReadSaga(action) {
  try {
    const response = yield call(notificationAPI, {
      ...action.params,
      action: 'mark_all_read',
    });
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error?.response || {
      data: { status: false, message: 'Failed to mark all as read' }
    });
  }
}

function* deleteNotificationSaga(action) {
  try {
    const response = yield call(notificationAPI, {
      ...action.params,
      action: 'delete',
    });
    action.callBack?.(response);
  } catch (error) {
    action.callBack?.(error?.response || {
      data: { status: false, message: 'Failed to delete notification' }
    });
  }
}

// ==================== ROOT SAGA ====================

export function* authSaga() {
  yield takeLatest(LOGIN_ACTION, loginSaga);
  yield takeLatest(SIGNUP_ACTION, signupSaga);
  yield takeLatest(VERIFY_EMAIL_ACTION, verifyEmailSaga);
  yield takeLatest(REQUEST_FORGET_PASSWORD_ACTION, forgotPasswordRequestSaga);
  yield takeLatest(VERIFY_FORGET_PASSWORD_OTP_ACTION, verifyForgotPasswordOtpSaga);
  yield takeLatest(RESET_PASSWORD_ACTION, resetPasswordSaga);
  yield takeLatest(GET_PROFILE, getProfileSaga);
  yield takeLatest(GET_BANNERS_ACTION, getBannersSaga);
  yield takeLatest(GET_CATEGORIES_ACTION, getCategoriesSaga);
  yield takeLatest(GET_PRODUCTS_BY_CATEGORY, getProductsByCategorySaga);
  yield takeLatest(GET_PRODUCTS, getProductsSaga);
  yield takeLatest(PLACE_ORDER, placeOrderSaga);
  yield takeLatest(GET_SEARCH, getSearchSaga);
  yield takeLatest(EDIT_PROFILE, editProfileSaga);
  yield takeLatest(GET_BANNER_PRODUCTS, getBannerProductsSaga);
  yield takeLatest(GET_BRANDS, getBrandsSaga);
  yield takeLatest(GET_ORDERHISTORY, getOrderHistorySaga);
  yield takeLatest(CANCEL_ORDER, cancelOrderByIdSaga);
  yield takeLatest(TRACK_ORDER, trackOrderByIdSaga);
  yield takeLatest(ADD_TO_CART, addToCartSaga);
  yield takeLatest(UPDATE_CART_ITEM, updateCartItemSaga);
  yield takeLatest(REMOVE_CART_ITEM, removeCartItemSaga);
  yield takeLatest(GET_CART_ITEMS, getCartItemsSaga);
  yield takeLatest(UPDATE_MULTIPLE_CART_ITEMS, updateMultipleCartItemsSaga);
  yield takeLatest(CLEAR_CART, clearCartSaga);
  yield takeLatest(SYNC_CART, syncCartSaga);
  yield takeLatest(GET_POLICY, getPolicySaga);
  yield takeLatest(GET_ACCOUNT_STATUS, getAccountStatusSaga);
  yield takeLatest(
    GET_NOTIFICATIONS_ACTION,
    getNotificationsSaga
  );
  yield takeLatest(MARK_NOTIFICATION_READ_ACTION, markNotificationReadSaga);
  yield takeLatest(MARK_ALL_READ_ACTION, markAllReadSaga);
  yield takeLatest(DELETE_NOTIFICATION_ACTION, deleteNotificationSaga);
}

export default authSaga;