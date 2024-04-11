import React, { useEffect, useState } from 'react';
// import firebase from 'firebase'; // Import Firebase
import GlobalColors from '../styles/globalColors';
import { useNavigation, useRoute } from '@react-navigation/native';

import { View, Text, Button, Image, ScrollView, TouchableOpacity,StyleSheet, TextInput,Rating,FlatList,Separator } from 'react-native';
import StarRating from 'react-native-star-rating';
import { firestoreDB } from "../config/firebase.config";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where,updateDoc } from "firebase/firestore";
import { Icon, Overlay, Avatar, Input } from 'react-native-elements';
// Profile Page Component

const MyProfile = ({}) => {
  const userId= useRoute().params;
  // const userId='9AkBWiiRaWYW8KW4Povd8AiU4uA3'
  const staticRating=2
  const navigation = useNavigation();
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {    
        const q = doc(collection(firestoreDB, 'riderFeedback'),userId);
        const querySnapshot = await getDoc(q);

    
        // console.log(querySnapshot.docs)
        if (!querySnapshot.exists()) {
          
          console.log('No matching document found for riderFeedback');
          setFeedbackData([]); 
          return;
        }

        // const feedbackDoc = querySnapshot.docs[0]; 
        const feedback = querySnapshot.data().feedbacks;
            console.log(feedback)
        if (feedback) {
          setFeedbackData(feedback);
        } else {
          console.log('Feedback array not found in the document');
          setFeedbackData([]);
        }

  
const updatedFeedbackData = [];

for (const feed of feedback) {
  console.log(feed?.ratedBy);
  console.log(feed);
  const createdBy = feed?.ratedBy;

  // Retrieve additional data from 'users' collection
  const userRef = doc(firestoreDB, 'users', createdBy);
  const userSnapshot = await getDoc(userRef);
  const userData = userSnapshot.exists() ? userSnapshot.data() : {};

  // Push an object containing both feedback data and user data to the updatedFeedbackData array
  updatedFeedbackData.push({
    feedback: feed.feedback,
    rating: feed.rating,
    userData: userData
  });
}
console.log(updatedFeedbackData)
// Set the updated feedback data
setFeedbackData(updatedFeedbackData);


    
       
      } catch (error) {
        console.error('Error fetching feedback:', error);
        // Handle potential errors gracefully (e.g., display error message to user)
      } finally {
        setLoading(false); 
      }
    };

    fetchData();
  }, [userId]);



  // useEffect(() => {
  //   if (userId) {
  //     firebase.database().ref(`users/${userId}`).once('value', snapshot => {
  //       if (snapshot.exists()) {
  //         setUserData(snapshot.val());
  //       } else {
  //         console.log("User data not found");
  //       }
  //     });

  
  //   }
  // }, [userId]);


   useEffect(() => {
      getUserData()
   }, [])
 
   const getUserData = async () => {
    try {
         const data=doc(collection(firestoreDB, 'users'), userId);
        //  const data=doc(firestoreDB, 'users', userId)
         const mydata=await getDoc(data);
         setUserData(mydata.data())
        }
    catch(err)
    {
      console.log(err);
    }

    }
   
  return (
   

    <View style={myprofilestyles.container}>
       {userData &&
        <>
      {/* Top Container with Background Image */}
      <View style={myprofilestyles.topContainer}>
        <Image source={require('../assets/WEGOlogoblue.png')} style={myprofilestyles.backgroundImage} />
      </View>
        
        
      {/* Bottom Container */}
      <View style={myprofilestyles.bottomContainer}>
          {/* Profile Image Overlapping Containers */}
      
          {/* <Image source={{ uri: userData.profilePic }}  style={myprofilestyles.profileImage} /> */}
          <View style={myprofilestyles.profileImage}>
          {userData?.profilePic ? (<Avatar rounded size="large" source={{ uri: userData?.profilePic }} />)
                  : (
                    <Avatar rounded size="large" source={require('../assets/avatar.jpg')}
                    />)}
                    </View>
          <Text style={myprofilestyles.nameText}>{userData.name}</Text>
          <Text style={myprofilestyles.genderText}>{userData.gender === 0 ? 'Male' : 'Female'}</Text>
          <Text style={myprofilestyles.bioText}>{userData.bio}</Text>
          <Text style={userData.status === 'Verified' ? myprofilestyles.statusText : myprofilestyles.unverifiedstatusText}>
   {userData.status}</Text>

          <Text style={myprofilestyles.ratingText}>Rating: {userData.rating}</Text> 
      </View>
          
      {/* 2nd section of phone */}
      <View style={myprofilestyles.midcontainer}>
      <Icon name="phone-alt" type="font-awesome-5" size={15} style={myprofilestyles.PhoneEmailCancellationicon}/>
       {/* <Image
            source={require('../assets/call.png')}
            style={myprofilestyles.PhoneEmailCancellationicon}
          /> */}
          <View style={{ marginLeft: 16 }}>
            <Text>{userData.phoneNumber? userData.phoneNumber:"Not Provided"}</Text>
          </View>
      </View>

      {/* 3rd section of email */}
      <View style={myprofilestyles.midcontainer}>
      <Icon name="mail" type="material" size={17} style={myprofilestyles.PhoneEmailCancellationicon}/>
        {/* <Image
            source={require('../assets/mail.png')}
            style={myprofilestyles.PhoneEmailCancellationicon}
          /> */}
          <View style={{ marginLeft: 16 }}>
            <Text>{userData.email}</Text>
          </View>
      </View>

      {/* 3rd section of cancellation rate */}
      <View style={myprofilestyles.midcontainer}>
       
          <View style={{ marginLeft: 16 }}>
            <Text style={myprofilestyles.cancellationrateText}>Cancelled Rides: {userData.cancelledRides}</Text>
            <Text style={myprofilestyles.cancellationrateText}>Rides as Host: {userData.ridesAsHost}</Text>
            <Text style={myprofilestyles.cancellationrateText}>Rides as Rider: {userData.ridesAsRider} </Text>
          </View>
      </View>
        
      {/* reviews section  */}
      <View style={myprofilestyles.midcontainer}>
        <Text style={myprofilestyles.cancellationrateText}>Reviews</Text>
      </View>

      {/* 1st revieew */}


      <ScrollView>


      <View>
      {loading ? (
        <Text>Loading Reviews...</Text>
      ) : feedbackData.length === 0 ? (
        <Text style={{paddingHorizontal:25}}>No reviews available</Text>
      ) : (

        <View style={{height:'100%', width:'100%'}}>
        <FlatList
          data={feedbackData}
          contentContainerStyle={{flexGrow:1}}
          renderItem={({ item, index }) => (
            <TouchableOpacity key={index}>
              <View style={myprofilestyles.midcontainer}>
                {/* <TouchableOpacity onPress={() => navigation.navigate('MyProfile', { userId: userId })}> */}
                <TouchableOpacity>
                  <Image
                    source={require('../assets/avatar.jpg')}
                    style={{ width: 60, height: 60, borderRadius: 25 }}
                  />
                </TouchableOpacity>
                <View style={{ marginLeft: 16 }}>
                  <Text style={{ fontWeight: '400' }}>{item.userData?.name}</Text>
                  <StarRating
                    disabled={true}
                    maxStars={5}
                    rating={item.rating}
                    fullStarColor="orange"
                    starSize={20}
                  />
                  <Text>{item.feedback}</Text>
                </View>
              </View>
              <View style={myprofilestyles.horizontalLine}></View>
              {/* {index !== feedbackData.length - 1 && <Separator />} */}
            </TouchableOpacity>
          )}
          // keyExtractor={(item) => item.userData.ratedBy}
        />
        

     </View>
        
       )}
     </View>
     </ScrollView>









      </>
      } 
    </View>   



   
  );
};

const myprofilestyles = StyleSheet.create({
  container: {
    marginTop:60,
    // borderColor:'grey',
    // borderWidth:1,

    flex: 1,
  },
  topContainer: {
    height:'20%',
    position: 'relative',
    backgroundColor:GlobalColors.secondary,
  
    zIndex: 1,
  },
  bottomContainer: {

    // borderTopWidth: 1, // Border line between containers
    // borderColor: 'gray',
    alignItems:'center',
 
    position: 'relative',
    zIndex: 2,
  },

  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    marginHorizontal:80,// ye hatana h bad m 
    marginTop:20,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 50,
    position: 'absolute',
    top: -30, // Half the height of the profile image to overlap
    left: '47%',
    marginLeft: -25, // Half the width of the profile image to center it
    zIndex: 3, // Above the border line and the background image
  },
  userinfo:{
   margin: 40,
   fontWeight:'bold',
  },
  nameText: {
    marginTop:50,
    fontSize: 20,
    fontWeight: 'bold',
  },
  genderText: {
    color:'grey',
    fontSize: 15,
  },
  bioText:{
    fontSize: 15,
  },
  ratingText:{
    fontSize: 15,
  },
  statusText:{
    fontSize: 15,
    color:GlobalColors.accept,
  },
  unverifiedstatusText:{
    fontSize: 15,
    color:GlobalColors.error,
  },
  midcontainer:{
    marginTop: 13,
    marginLeft:16,
    // borderWidth: 1,
    // borderColor: 'grey',
 
    padding:5,
    flexDirection: 'row', 
    },
    PhoneEmailCancellationicon:{
      width: 20, height: 20, borderRadius: 25,marginLeft:16, color:GlobalColors.primary,paddingTop:3,
    },
    // rides_as_text:{
    //   marginLeft:30,
    //   fontWeight:'400'
    // },
    cancellationrateText:{
      fontSize:14,
      fontWeight:'bold'
    },
    horizontalLine: {
      borderBottomWidth: 1,
      borderBottomColor: 'lightgrey', // Adjust the color as needed
      marginVertical: 10, // Adjust the margin as needed
    },
});


export default MyProfile;