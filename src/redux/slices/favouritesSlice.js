import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [],
};

const favouritesSlice = createSlice({
    name: 'favourites',
    initialState,
    reducers: {
        addToFavourites: (state, action) => {
            const exists = state.items.find(item => item.id === action.payload.id);
            if (!exists) {
                state.items.push(action.payload);
            }
        },
        removeFromFavourites: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload);
        },
        clearFavourites: (state) => {
            state.items = [];
        },
    },
});

export const { addToFavourites, removeFromFavourites, clearFavourites } = favouritesSlice.actions;
export default favouritesSlice.reducer;
