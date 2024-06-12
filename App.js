import DuringRideScreen from './screens/DuringRide';
import ChatScreen from './screens/chatScreen';
import RequestCreationScreen from './screens/RequestCreation';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUp from './screens/Signup';
import SignIn from './screens/Signin';
import OTPScreen from './screens/OTP';
import { Provider, useDispatch } from 'react-redux';
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
import SetLocationScreen from './screens/SetLocation.js';
import * as TaskManager from 'expo-task-manager'
import { setLocation, setConfirmedWayPoints } from './context/actions/rideActions.js';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { createRef } from 'react';
import { firestoreDB } from './config/firebase.config.js';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import ResponseScheduledHost from './screens/ResponseScheduledHost.js';
import ResponseScheduledRider from './screens/ResponseScheduledRider.js';
import MyScheduledRequests from './screens/MyScheduledRequests.js';
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();
const Stack = createNativeStackNavigator();
const STRIPE_KEY = 'pk_test_51Oq889GhYfHmgwjRnwEFkCvCQ2gQw5mBEZEXyaHdTOZYllWWlEfD7CQDbOSeBjgitc6AT9R3h1dgzuAepP3wjSU2009yA0vsuy'
const HOST_TASK = 'host-background-location-task';
const RIDER_TASK = 'rider-background-location-task';
async function schedulePushNotification(waypoint) {
  await Notifications.scheduleNotificationAsync({
    content: {
      sound: 'default',
      title: `${waypoint.type} Stop`,
      body: `You have almost reached ${waypoint.type} Stop for ${waypoint.riderName}. Click to confirm ${waypoint.type}`,
      data: { data: 'goes here' },
    },
    trigger: { seconds: 1 },
  });
}

async function scheduleEndNotification(toLocation) {
  await Notifications.scheduleNotificationAsync({
    content: {
      sound: 'default',
      title: `Ride Ended`,
      body: `You have almost reached end of your ride. Click to give feedback.`,
      data: { data: 'goes here' },
    },
    trigger: { seconds: 1 },
  });
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas?.projectId,
    })

  } else {
    alert('Push Notifications are not supported on this device');
  }

  return token;
}
function objectsAreEqual(obj1, obj2) {
  // Get the keys of each object
  const obj1Keys = Object.keys(obj1);
  const obj2Keys = Object.keys(obj2);

  // Check if the number of keys is the same
  if (obj1Keys.length !== obj2Keys.length) {
    return false;
  }

  // Iterate over each key in obj1
  for (let key of obj1Keys) {
    // Check if the corresponding key exists in obj2 and if their values are equal
    if (!(key in obj2) || obj1[key] !== obj2[key]) {
      return false;
    }
  }

  // If all keys and values are equal, return true
  return true;
}
const notificationListener = createRef();
const responseListener = createRef();
TaskManager.defineTask(HOST_TASK, async ({ data, error }) => {
  const rideEnded = Store.getState().ride.rideEnded
  if (!rideEnded)
    if (error) {
      console.error('Error in background location task:', error.message);
      return;
    }
  if (!data || !data.locations) {
    console.error('Invalid data structure:', data);
    return;
  }

  const { locations } = data;

  if (!Array.isArray(locations)) {
    console.error('Invalid locations data:', locations);
    return;
  }

  // Assuming each location has a latitude property
  const validLocations = locations.filter(location => location && location?.coords?.latitude);

  if (validLocations.length === 0) {
    console.error('No valid locations found:', locations);
    return;
  }

  console.log('Received new valid locations:', validLocations);
  const lastIndex = validLocations.length - 1;
  const currentLocation = validLocations[lastIndex];
  // Dispatch your setLocation action using the imported function
  Store.dispatch(setLocation(currentLocation));
  if (Store.getState().ride.rideDetails) {
    await updateDoc(doc(firestoreDB, 'ride', Store.getState().ride.rideDetails.id), {
      location: currentLocation
    });
  }
  const waypoints = Store.getState().ride.wayPoints;
  const toLocation = Store.getState().ride.toRideLocation;
  const showDirections = Store.getState().ride.showDirections;
  // Loop through waypoints and check if any are near the current location
  const proximityThreshold = 333334.01;

  if (waypoints) {
    console.log('fine', waypoints)
    waypoints.forEach(waypoint => {
      const distance = calculateDistance(currentLocation?.coords?.latitude, currentLocation?.coords.longitude, waypoint?.latitude, waypoint.longitude);
      console.log(distance)
      if (distance < proximityThreshold) {
        console.log(`Waypoint ${waypoint.name} is near the current location.`);
        registerForPushNotificationsAsync();

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log(notification)
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log(response);
        });


        const confirmedWaypoints = [...Store.getState().ride.confirmedWayPoints];
        console.log('confirmed', confirmedWaypoints)
        console.log('current', waypoint)
        const lastWaypoint = confirmedWaypoints[confirmedWaypoints.length - 1];
        console.log(lastWaypoint)
        if (!lastWaypoint || lastWaypoint[1] === true) {
          var isAlreadyConfirmed = false;
          console.log('loop range', confirmedWaypoints.length)
          for (let i = 0; i < confirmedWaypoints.length; i++) {
            console.log('loop', i, confirmedWaypoints[i][0])
            console.log(confirmedWaypoints[i][0])
            console.log(waypoint)
            console.log(objectsAreEqual(confirmedWaypoints[i][0], waypoint))
            if (objectsAreEqual(confirmedWaypoints[i][0], waypoint)) {
              isAlreadyConfirmed = true;
              break;
            }
          }
          if (!isAlreadyConfirmed) {
            confirmedWaypoints.push([waypoint, false, Timestamp.now(), false]);
            Store.dispatch(setConfirmedWayPoints(confirmedWaypoints));
            if (showDirections) {
              schedulePushNotification(waypoint);
            }
          }
        }

      } else {
        console.log('bassss')
      }
    });
  } else { console.log('no way') }
  if (toLocation) {
    const distance = calculateDistance(currentLocation?.coords?.latitude, currentLocation?.coords.longitude, toLocation?.latitude, toLocation?.longitude);
    console.log(distance)
    if (distance < proximityThreshold) {
      console.log(`Ride end Location ${toLocation.name} is near the current location.`);
      registerForPushNotificationsAsync();

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log(notification)
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log(response);
      });


      const confirmedWaypoints = [...Store.getState().ride.confirmedWayPoints];
      console.log('confirmed', confirmedWaypoints)
      const lastWaypoint = confirmedWaypoints[confirmedWaypoints.length - 1];
      console.log('l', lastWaypoint)
      if (!lastWaypoint || lastWaypoint[1] === true) {
        var isAlreadyConfirmed = false;
        console.log('loop range to', confirmedWaypoints.length)
        for (let i = 0; i < confirmedWaypoints.length; i++) {
          console.log('loop', i, confirmedWaypoints[i][0])

          if (objectsAreEqual(confirmedWaypoints[i][0], toLocation)) {
            isAlreadyConfirmed = true;
            break;
          }
        }
        if (!isAlreadyConfirmed) {
          confirmedWaypoints.push([toLocation, false, Timestamp.now(), false]);
          console.log('cwp', confirmedWaypoints)
          Store.dispatch(setConfirmedWayPoints(confirmedWaypoints));
          if (showDirections) {
            scheduleEndNotification(toLocation);
          }
        }
      }
    }
  }

});
TaskManager.defineTask(RIDER_TASK, async ({ data, error }) => {
  console.log('i am not culprit')
  if (error) {
    console.error('Error in background location task:', error.message);
    return;
  }

  if (!data || !data.locations) {
    console.error('Invalid data structure:', data);
    return;
  }

  const { locations } = data;

  if (!Array.isArray(locations)) {
    console.error('Invalid locations data:', locations);
    return;
  }

  // Assuming each location has a latitude property
  const validLocations = locations.filter(location => location && location?.coords?.latitude);

  if (validLocations.length === 0) {
    console.error('No valid locations found:', locations);
    return;
  }

  console.log('Received new valid locations:', validLocations);

  const lastIndex = validLocations.length - 1;
  const currentLocation = validLocations[lastIndex];

  // Check if currentLocation and necessary properties are defined
  if (!currentLocation) {
    console.error('Current location is undefined');
    return;
  }

  // Dispatch your setLocation action using the imported function
  try {
    Store.dispatch(setLocation(currentLocation));
  } catch (dispatchError) {
    console.error('Error dispatching location:', dispatchError);
    return;
  }

});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
export default function App() {
  return (
    <NavigationContainer>
      <Provider store={Store}>
        <StripeProvider publishableKey={STRIPE_KEY}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="RequestCreation" component={RequestCreationScreen} />
            <Stack.Screen name="DuringRideHost" component={DuringRideHost} />
            <Stack.Screen name="DuringRide" component={DuringRideScreen} />
            <Stack.Screen name="ResponseScheduledHost" component={ResponseScheduledHost} />
            <Stack.Screen name="ResponseScheduledRider" component={ResponseScheduledRider} />
            <Stack.Screen name="SetLocation" component={SetLocationScreen} />
            <Stack.Screen name="MyScheduledRequests" component={MyScheduledRequests} />
            <Stack.Screen name="FindScheduledRider" component={FindScheduledRider} />
            <Stack.Screen name="FindScheduledHost" component={FindScheduledHost} />
            <Stack.Screen name="PayFare" component={PayFare} />
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


