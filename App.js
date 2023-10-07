import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import DuringRideScreen from './screens/DuringRide';
import ChatScreen from './screens/chatScreen';
export default function App() {
  return (
  
      <ChatScreen/>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
