export default function reducer(state, action) {
    switch (action.type) {
      case 'TOGGLE_DIRECTION':
        return { ...state, transferDirection: state.transferDirection === 'to_airport' ? 'from_airport' : 'to_airport' };
      case 'CHANGE':
        return { ...state, [action.field]: action.value };
      case 'RESET':
        return action.initial || state;
      case 'SWAP':
        const { field1, field2 } = action;
        return { ...state, [action.field1]: state[field2], [action.field2]: state[field1] };
      default:
        return state;
    }
  }