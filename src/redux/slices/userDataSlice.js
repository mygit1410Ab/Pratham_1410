import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userData: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action) => {
      return {
        ...state,
        userData: {
          ...action.payload,
          lastUpdated: Date.now(), // Triggers change
        },
      };
    },
    clearUserData: (state) => {
      state.userData = null;
    },
  },
});

export const { setUserData, clearUserData } = userSlice.actions;
export default userSlice.reducer;
