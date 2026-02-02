import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  showPrice: true,
};

const togglePriceSlice = createSlice({
  name: 'togglePrice',
  initialState,
  reducers: {
    toggleShowPrice: state => {
      state.showPrice = !state.showPrice;
    },
    setShowPrice: (state, action) => {
      state.showPrice = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase('LOGOUT', () => initialState);
  },
});

export const {toggleShowPrice, setShowPrice} = togglePriceSlice.actions;
export default togglePriceSlice.reducer;
