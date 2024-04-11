import React from 'react';
import { useState, View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import GlobalColors from '../styles/globalColors';
import { useNavigation } from '@react-navigation/native';
import { firebaseAuth } from '../config/firebase.config';
import { useDispatch, useSelector } from 'react-redux';
import { SET_USER, SET_USER_NULL } from '../context/actions/userActions';
import { Avatar } from 'react-native-elements';


const Menu = ({ setMenuVisible }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.user)
  const handleLogout = async () => {
    console.log('Log out')
    try {
      await firebaseAuth.signOut();
      dispatch(SET_USER_NULL());
      navigation.navigate('Signin');
      console.log('Logging Out')
      setMenuVisible(false)
    } catch (error) {
      console.error('Error signing out:', error.message);
      Alert.alert('Error', 'An error occurred while signing out. Please try again.');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}

    >
      <TouchableOpacity style={{ flex: 1, width: '100%', zIndex: 20 }} onPress={() => setMenuVisible(false)}>
        <TouchableOpacity style={menustyles.container} onPress={() => { }}>
          <View style={menustyles.header}>
            <View>
              <TouchableOpacity onPress={() => {
                navigation.navigate("MyProfile", currentUser._id)
                setMenuVisible(false)
              }}>{currentUser?.profilePic ? (
                  <Avatar rounded size="large" source={{ uri: currentUser.profilePic }} />
                ) : (
                  <Avatar rounded size="large" source={require('../assets/avatar.jpg')} />
                )}</TouchableOpacity>
            </View>
            <Text style={menustyles.userName}>{currentUser?.name}</Text>
          </View>

          <View style={menustyles.editP_header}>
            <TouchableOpacity onPress={() => {
              navigation.navigate("EditProfile")
              setMenuVisible(false)
            }

            }>
              <Text style={menustyles.editProfile_logout_Text}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          {/*partition */}
          <View style={menustyles.menuhorizontalLine}></View>

          <View style={menustyles.menu}>
            <TouchableOpacity style={menustyles.menuItem} onPress={() => {
              navigation.navigate("MyRequests")
              setMenuVisible(false)
            }}>
              <Text style={menustyles.menuItemText}>My Requests</Text>
            </TouchableOpacity>
           {/* <TouchableOpacity style={menustyles.menuItem} onPress={() => {
              navigation.navigate("RideHistory")
              setMenuVisible(false)
            }}>
              <Text style={menustyles.menuItemText}>My Rides</Text>
            </TouchableOpacity>*/}
            <TouchableOpacity style={menustyles.menuItem} onPress={() => {
              navigation.navigate("MyChats")
              setMenuVisible(false)
            }}>
              <Text style={menustyles.menuItemText}>My Chats</Text>
            </TouchableOpacity>
          </View>

          <View style={menustyles.logout}>
            <TouchableOpacity style={menustyles.editProfile_logout_Text} onPress={handleLogout}>
              <Text style={menustyles.editProfile_logout_Text}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>

  );
};

const menustyles = StyleSheet.create({
  container: {
    marginTop: 0,
    flex: 1,
    width: '60%', // Adjust the width to take up the left half of the screen
    zIndex: 99,
    backgroundColor: GlobalColors.background
  },
  header: {
    paddingTop: 30,
    padding: 20,
    // backgroundColor: '#f2f2f2',

    // alignItems: 'center',
  },
  editP_header: {
    paddingHorizontal: 20,
    // backgroundColor: '#f2f2f2',

    justifyContent: 'center',
    // borderWidth: 1,
    // borderColor: 'grey',

  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 25,
    marginBottom: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  editProfile_logout_Text: {
    color: GlobalColors.textbutton,
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 20,

  },
  menu: {
    padding: 20,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 18,
    color: GlobalColors.primary,
    fontWeight: 'bold',
  },
  menuhorizontalLine: {
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgrey', // Adjust the color as needed
    marginVertical: 5, // Adjust the margin as needed
  },
  logout: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    // borderWidth: 1,
    // borderColor: 'grey',
    //to give it a bottom position
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default Menu;