import {combineReducers} from "redux"
import userAuthReducer from "./userAuth"

const myReducer = combineReducers({
    user: userAuthReducer,
});

export default myReducer;