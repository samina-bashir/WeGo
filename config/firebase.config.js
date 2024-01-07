import {getApp, getApps, initializeApp} from 'firebase/app';
import {getAuth, initializeAuth, getReactNativePersistence} from 'firebase/auth';
import {getFirestore, initializeFirestore} from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
const firebaseConfig = {
    apiKey: "AIzaSyB8saGivSp-WNOsNMPTf6rvspOWZ-VLhsM",
    authDomain: "wego-ans.firebaseapp.com",
    projectId: "wego-ans",
    storageBucket: "wego-ans.appspot.com",
    messagingSenderId: "177929147360",
    appId: "1:177929147360:web:af865fab881c3a14c05185",
    measurementId: "G-9XHBP9V580"
  };

const app=getApps.length>0?getApp(): initializeApp(firebaseConfig);
initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const firebaseAuth= getAuth(app)
const firestoreDB = getFirestore(app)
export {app, firebaseAuth, firestoreDB};