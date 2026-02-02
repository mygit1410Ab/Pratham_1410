import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    status: null,
    is_active: true,
    is_deactivated: false,
    raw_status: null,
    loading: false,
    showDeactivationModal: false,
};

const accountStatusSlice = createSlice({
    name: 'accountStatus',
    initialState,
    reducers: {
        setAccountStatusLoading: (state, action) => {
            state.loading = action.payload;
        },

        setAccountStatus: (state, action) => {
            const acc = action.payload || {};

            state.status = acc.status || null;
            state.is_active = acc.is_active ?? true;
            state.is_deactivated = acc.is_deactivated || false;
            state.raw_status = acc.raw_status || null;

            state.showDeactivationModal = acc.is_active === false;
            state.loading = false;
        },

        hideDeactivationModal: (state) => {
            state.showDeactivationModal = false;
        },

        resetAccountStatus: () => initialState,
    },
});

export const {
    setAccountStatus,
    setAccountStatusLoading,
    hideDeactivationModal,
    resetAccountStatus,
} = accountStatusSlice.actions;

export default accountStatusSlice.reducer;
