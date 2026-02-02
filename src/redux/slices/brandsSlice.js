import {createSlice} from '@reduxjs/toolkit';

const brandsSlice = createSlice({
  name: 'brands',
  initialState: {
    list: [],
  },
  reducers: {
    setBrandsRedux: (state, action) => {
      state.list = action.payload;
    },
  },
});

export const {setBrandsRedux} = brandsSlice.actions;
export default brandsSlice.reducer;
