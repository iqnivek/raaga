import { createReducer } from "@utils/createReducer";
import { ReducersType } from "@enums/reducers";

export const selectedTrack = createReducer(null, {
  [ReducersType.SET_SELECTED_TRACK]: (_state, action) => action.payload,
  [ReducersType.CLEAR_TRACK_NUMBER]: () => null
});
