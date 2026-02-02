import * as TYPES from '../action/types'

const initialState = {
    categories: [], // <- stored globally
  };
  
  const categoryReducer = (state = initialState, action) => {
    switch (action.type) {
      case TYPES.SET_CATEGORIES:
          // console.log('Setting categories:', action.payload);
        return {
          ...state,
          categories: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default categoryReducer;