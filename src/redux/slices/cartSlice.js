import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isSyncing: false, // Track sync status
  syncError: null,  // Store sync errors
  cartSummary: null, // Store cart summary
  meta: null, // Store user meta data
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product_id, variant_id = 0 } = action.payload;
      const existingItem = state.items.find(
        item =>
          String(item.product_id) === String(product_id) &&
          Number(item.variant_id) === Number(variant_id)
      );

      if (existingItem) {
        existingItem.itemQuantity += action.payload.itemQuantity || 1;
      } else {
        state.items.push(action.payload);
      }
    },

    removeFromCart: (state, action) => {
      const { product_id, variant_id = 0 } = action.payload;
      state.items = state.items.filter(
        item =>
          !(
            String(item.product_id) === String(product_id) &&
            Number(item.variant_id) === Number(variant_id)
          )
      );
    },

    clearCart: (state) => {
      state.items = [];
      state.cartSummary = null;
      state.meta = null;
    },

    updateCartItem: (state, action) => {
      const { product_id, variant_id = 0, updates } = action.payload;
      const item = state.items.find(
        item =>
          String(item.product_id) === String(product_id) &&
          Number(item.variant_id) === Number(variant_id)
      );

      if (item) {
        Object.assign(item, updates);
      }
    },

    syncCart: (state, action) => {
      const { items, cart_summary, meta } = action.payload;

      state.items = items || [];
      state.cartSummary = cart_summary || null;
      state.meta = meta || null;
      state.isSyncing = false;
      state.syncError = null;
    },

    updateCartSummary: (state, action) => {
      state.cartSummary = action.payload;
    },

    updateCartMeta: (state, action) => {
      state.meta = action.payload;
    },

    setSyncing: (state, action) => {
      state.isSyncing = action.payload;
    },

    setSyncError: (state, action) => {
      state.syncError = action.payload;
      state.isSyncing = false;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  updateCartItem,
  syncCart,
  updateCartSummary,
  updateCartMeta,
  setSyncing,
  setSyncError,
} = cartSlice.actions;
export default cartSlice.reducer;