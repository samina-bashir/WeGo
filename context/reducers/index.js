import {combineReducers} from "redux"
import userAuthReducer from "./userAuth"
import rideReducer from "./ride";

const myReducer = combineReducers({
    user: userAuthReducer,
    ride: rideReducer,
});

export default myReducer;