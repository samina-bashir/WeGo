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

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Provider store={Store}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Signin" component={SignIn} />
          <Stack.Screen name="Admin" component={VerifyDomains} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen name="VehicleInfo" component={VehicleInfo} />
          <Stack.Screen name="RequestCreation" component={RequestCreationScreen} />
          <Stack.Screen name="Signup" component={SignUp} />
          <Stack.Screen name="MyChats" component={MyChats} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          <Stack.Screen name="DuringRide" component={DuringRideScreen} />
        </Stack.Navigator>
      </Provider>
    </NavigationContainer>

  );
}


