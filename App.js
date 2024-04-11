import { StatusBar } from 'expo-status-bar';
import DuringRideScreen from './screens/DuringRide';
import ChatScreen from './screens/chatScreen';
import RequestCreationScreen from './screens/RequestCreation';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUp from './screens/Signup';
import SignIn from './screens/Signin';
import OTPScreen from './screens/OTP';
import { Provider } from 'react-redux';
import Store from './context/store';
import SplashScreen from './screens/Splash';
import VehicleInfo from './screens/VehicleInfo.js'
import MyChats from './screens/MyChats.js';
import VerifyDomains from './screens/VerifyDomains.js';
import DuringRideHost from './screens/DuringRideHost';
import { StripeProvider } from '@stripe/stripe-react-native';
import FindHostScreen from './screens/FindHost.js';
import SetSchedule from './screens/SetSchedule.js';
import { LogBox } from 'react-native';
import FindRiderScreen from './screens/FindRider.js';
import MyRequests from './screens/MyRequests.js';
import ResponseHost from './screens/ResponseHost.js';
import ResponseRider from './screens/ResponseRider.js';
import MyProfile from './screens/MyProfile.js';
import PayFare from './screens/PayFare.js';
import FindScheduledHost from './screens/FindScheduledHost.js';
import FindScheduledRider from './screens/FindScheduledRider.js';
import EditProfile from './screens/EditProfile.js';
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();
const Stack = createNativeStackNavigator();
const STRIPE_KEY = 'pk_test_51Oq889GhYfHmgwjRnwEFkCvCQ2gQw5mBEZEXyaHdTOZYllWWlEfD7CQDbOSeBjgitc6AT9R3h1dgzuAepP3wjSU2009yA0vsuy'

export default function App() {
  return (

    <NavigationContainer>
      <Provider store={Store}>
        <StripeProvider publishableKey={STRIPE_KEY}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="FindScheduledRider" component={FindScheduledRider} />
            <Stack.Screen name="FindScheduledHost" component={FindScheduledHost} />
            <Stack.Screen name="RequestCreation" component={RequestCreationScreen} />
            <Stack.Screen name="PayFare" component={PayFare} />
            <Stack.Screen name="DuringRideHost" component={DuringRideHost} />
            <Stack.Screen name="FindRider" component={FindRiderScreen} />
            <Stack.Screen name="FindHost" component={FindHostScreen} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="SetSchedule" component={SetSchedule} />
            <Stack.Screen name="VehicleInfo" component={VehicleInfo} />
            <Stack.Screen name="Signin" component={SignIn} />
            <Stack.Screen name="Admin" component={VerifyDomains} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="Signup" component={SignUp} />
            <Stack.Screen name="MyChats" component={MyChats} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            <Stack.Screen name="DuringRide" component={DuringRideScreen} />
            <Stack.Screen name="MyRequests" component={MyRequests} />
            <Stack.Screen name="ResponseHost" component={ResponseHost} />
            <Stack.Screen name="ResponseRider" component={ResponseRider} />
            <Stack.Screen name="MyProfile" component={MyProfile} />
          </Stack.Navigator>
        </StripeProvider>
      </Provider>
    </NavigationContainer>

  );
}


