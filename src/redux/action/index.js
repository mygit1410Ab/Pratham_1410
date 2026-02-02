import * as TYPES from './types';

export const loginAction = (payload, callBack) => ({
  type: TYPES['LOGIN_ACTION'],
  payload,
  callBack,
});

export const signupAction = (payload, callBack) => ({
  type: TYPES['SIGNUP_ACTION'],
  payload,
  callBack,
});

export const verifyEmailAction = (payload, callBack) => ({
  type: TYPES['VERIFY_EMAIL_ACTION'],
  payload,
  callBack,
});

export const requestForgetPasswordAction = (payload, callBack) => ({
  type: TYPES['REQUEST_FORGET_PASSWORD_ACTION'],
  payload,
  callBack,
});

export const verifyForgetPasswordOtpAction = (payload, callBack) => ({
  type: TYPES['VERIFY_FORGET_PASSWORD_OTP_ACTION'],
  payload,
  callBack,
});

export const resetPasswordAction = (payload, callBack) => ({
  type: TYPES['RESET_PASSWORD_ACTION'],
  payload,
  callBack,
});

export const getProfileAction = (payload, callBack) => ({
  type: TYPES.GET_PROFILE,
  payload,
  callBack,
});
export const getBannersAction = callBack => ({
  type: TYPES['GET_BANNERS_ACTION'],
  callBack,
});

export const getCategoriesAction = callBack => ({
  type: TYPES['GET_CATEGORIES_ACTION'],
  callBack,
});

export const getProductsByCategoryAction = (payload, callBack) => ({
  type: TYPES['GET_PRODUCTS_BY_CATEGORY'],
  payload,
  callBack,
});

export const getProductsAction = (payload, callBack) => ({
  type: TYPES['GET_PRODUCTS'],
  payload,
  callBack,
});

export const getAccountStatusAction = (callBack) => ({
  type: TYPES['GET_ACCOUNT_STATUS'],
  callBack,
});

export const postOrderAction = (payload, callBack) => ({
  type: TYPES['PLACE_ORDER'],
  payload,
  callBack,
});

export const getSearchAction = (payload, callBack) => ({
  type: TYPES['GET_SEARCH'],
  payload,
  callBack,
});

export const editProfileAction = (payload, callBack) => ({
  type: TYPES['EDIT_PROFILE'],
  payload,
  callBack,
});

export const getBannerProductsAction = (payload, callBack) => ({
  type: TYPES['GET_BANNER_PRODUCTS'],
  payload,
  callBack,
});

export const getBrandsAction = callBack => ({
  type: TYPES['GET_BRANDS'],
  callBack,
});

export const getOrdersAction = callBack => ({
  type: TYPES['GET_ORDERHISTORY'],
  callBack,
});



export const cancelOrdersAction = (payload, callBack) => ({
  type: TYPES.CANCEL_ORDER,
  payload,
  callBack,
});

export const trackOrdersAction = (payload, callBack) => ({
  type: TYPES.TRACK_ORDER,
  payload,
  callBack,
});

export const addToCartAction = (payload, callBack) => ({
  type: TYPES.ADD_TO_CART,
  payload,
  callBack,
});

export const getCartItemsAction = (payload, callBack) => ({
  type: TYPES.GET_CART_ITEMS,
  payload,
  callBack,
});

export const getCartItemsSuccess = (items) => ({
  type: TYPES.GET_CART_ITEMS_SUCCESS,
  payload: items,
});

export const getCartItemsFailure = (error) => ({
  type: TYPES.GET_CART_ITEMS_FAILURE,
  payload: error,
});

export const removeCartItemAction = (payload, callBack) => ({
  type: TYPES.REMOVE_CART_ITEM,
  payload,
  callBack,
});

export const updateCartItemAction = (payload, callBack) => ({
  type: TYPES.UPDATE_CART_ITEM,
  payload,
  callBack,
});

export const clearCartAction = (payload, callBack) => ({
  type: TYPES.CLEAR_CART,
  payload,
  callBack,
});

export const updateMultipleCartItemsAction = (payload, callBack) => ({
  type: TYPES.UPDATE_MULTIPLE_CART_ITEMS,
  payload,
  callBack,
});

export const syncCartAction = (payload, callBack) => ({
  type: TYPES.SYNC_CART,
  payload,
  callBack,
});


export const getPolicyAction = (payload, callBack) => ({
  type: TYPES.GET_POLICY,
  payload,
  callBack,
});


export const getNotificationsAction = (params, callBack) => ({
  type: TYPES.GET_NOTIFICATIONS_ACTION,
  params,
  callBack,
});

export const markNotificationReadAction = (params, callBack) => ({
  type: TYPES.MARK_NOTIFICATION_READ_ACTION,
  params,
  callBack,
});

export const markAllReadAction = (params, callBack) => ({
  type: TYPES.MARK_ALL_READ_ACTION,
  params,
  callBack,
});

export const deleteNotificationAction = (params, callBack) => ({
  type: TYPES.DELETE_NOTIFICATION_ACTION,
  params,
  callBack,
});
