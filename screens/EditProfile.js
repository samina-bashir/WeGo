import React, { useEffect, useState } from 'react';
// import firebase from 'firebase'; // Import Firebase
import GlobalColors from '../styles/globalColors';
import { useNavigation } from '@react-navigation/native';

import { View, Text, Button, Image, ScrollView, TouchableOpacity,StyleSheet, TextInput,Rating,FlatList,Alert } from 'react-native';
import StarRating from 'react-native-star-rating';
import { firestoreDB } from "../config/firebase.config";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where,updateDoc } from "firebase/firestore";
import { Icon, Overlay, Avatar, Input } from 'react-native-elements';
import { useSelector } from 'react-redux';



const EditProfile = ({  }) => {

  const userId=(useSelector((state)=> state.user.user))._id;

  const [editable, setEditable] = useState(true);
  const [userData, setUserData] = useState(null);

  // const[userInfo,setUserInfo]=useState(null);
    
  
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [cancelledRides, setCR] = useState('');
  const [ridesAsRider, setRidesasRider] = useState('');
  const [ridesAsHost, setridesashost] = useState('');


  const [profilePic, setProfilePic] = useState('');

  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {    
        const q = doc(collection(firestoreDB, 'riderFeedback'),userId);
        console.log(userId)
        const querySnapshot = await getDoc(q);


        // console.log(querySnapshot.docs)
        if (!querySnapshot.exists()) {
          
          console.log('No matching document found');
          setFeedbackData([]); 
          return;
        }
        const info= querySnapshot.data()

        // const feedbackDoc = querySnapshot.docs[0]; 
        const feedback = querySnapshot.data().feedbacks;
            console.log(feedback)
        if (feedback) {
          setFeedbackData(feedback);
        } else {
          console.log('Feedback array not found in the document');
          setFeedbackData([]);
        }
         console.log(querySnapshot.data());
         console.log(querySnapshot.data().gender);
         console.log('ok');
        setName(querySnapshot.data().name);
        setGender(querySnapshot.data().gender);
        setBio(querySnapshot.data().bio);
        setPhoneNumber(querySnapshot.data().phoneNumber);
        setEmail(querySnapshot.data().email);
const updatedFeedbackData = [];

for (const feed of feedback) {
  console.log(feed?.ratedBy);
  console.log(feed);
  const createdBy = feed?.ratedBy;

  // Retrieve additional data from 'users' collection
  const userRef = doc(firestoreDB, 'users', createdBy);
  const userSnapshot = await getDoc(userRef);
  const FeeduserData = userSnapshot.exists() ? userSnapshot.data() : {};
  
  // Push an object containing both feedback data and user data to the updatedFeedbackData array
  updatedFeedbackData.push({
    feedback: feed.feedback,
    rating: feed.rating,
    FeeduserData: FeeduserData
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
  }, []);



  
  useEffect(() => {
    getUserData()
 }, [])

 const getUserData = async () => {
  try {
       const data=doc(collection(firestoreDB, 'users'), userId);
      //  const data=doc(firestoreDB, 'users', userId)
       const mydata=await getDoc(data);
     console.log(mydata.data())
       setUserData(mydata.data())

       setName(userData.name)
       setEmail(userData.email)
       setBio(userData.bio)
       setPhoneNumber(userData.phoneNumber)
       setGender(userData.gender)
   

       setStatus(userData.status)
       setRating(userData.rating)
       setCR(userData.cancelledRides)
       setRidesasRider(userData.ridesAsRider)
       setridesashost(userData.ridesAsHost)
      }
  catch(err)
  {
    console.log(err);
  }

  }
 


  const handleSaveChanges = async () => {
    isError=validateAllFields();
    if (isError) {
      Alert.alert('Error','Invalid Inputs Entered');
      console.log('error');
    } else {
    try {
      const userDoc = doc(firestoreDB, 'users', userId);
      await updateDoc(userDoc, {
        name: name,
        gender: gender,
        bio: bio,
        phoneNumber: phoneNumber,
        email: email,
        profilePicture: profilePic // You need to set this value based on the selected profile picture
      });
      // setEditable(false);
      console.log('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
    }

  } 
  };

  // const handleProfileChange = (field, value) => {
  //   setEditableProfile({
  //     ...editableProfile,
  //     [field]: value,
  //   });

  // Function to handle changes in user profile fields
  const handleProfileChange = (field, value) => {

    setEditable({
      ...editable,
      [field]: value,
    });
    // Update state based on the field being changed
    
    if (field === 'name') {
      setName(value);
    } else if (field === 'gender') {
      setGender(value);
    } else if (field === 'email') {
      setEmail(value);
    } else if (field === 'phone') {
      setPhone(value);
    } else if (field === 'bio') {
      setBio(value);
    }
  
  };


  const validateName = (text) => {
    setName(text);
    setNameError(text.trim() === '' ? 'Please enter your name' : '');
  };

  const validateEmail = (text) => {
    setEmail(text);

    if (text.trim() === '') {
      setEmailError('Please enter an email address');
    } else if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))) {
      setEmailError('Please enter a valid email address');
    } else if (text.toLowerCase().endsWith('@gmail.com')) {
      setEmailError('Please use your institute email');
    } else {
      setEmailError('');
    }
  };



  const validatePhoneNumber = (text) => {
    setPhoneNumber(text);
    setPhoneNumberError(text.trim() !== '' && !(/^\d{11}$/.test(text)) ? 'Please enter a valid phone number' : '');
  };
  const validateAllFields = () => {
    validateName(name);
    validateEmail(email);
    validatePhoneNumber(phoneNumber);

    const errors = [
      nameError,
      emailError,
      phoneNumberError,
    ];
    const hasError = errors.some((error) => error.length > 1);
    console.log(hasError)
    console.log(errors)
    console.log('ij')
    return hasError;
  };

  // const handleProfilePicChange = (imageUrl) => {
  //   setProfilePic(imageUrl);
  // };


  return (
 
   <View style={editprofilestyles.container}>
 
        <View style={editprofilestyles.topContainer}>
          <Image source={require('../assets/WEGOlogoblue.png')} style={editprofilestyles.backgroundImage} />
        </View>
    
        <View style={editprofilestyles.bottomContainer}>

        <Image source={require('../assets/avatar.jpg')} style={editprofilestyles.profileImage} />
          {/* <Image source={{ uri: profilePic }} style={editprofilestyles.profileImage} /> */}
          <TouchableOpacity onPress={() => handleProfileChange('newImageUrl')}>
            {/* <Text style={editprofilestyles.uploadText}>Change Profile Picture</Text> */}
          </TouchableOpacity>
    
          <TextInput
          style={editprofilestyles.nameText}
          value={name}
          onChangeText={(text) => setName(text)}
        // editable={editable}
      />
        <TextInput
          style={editprofilestyles.genderText}
          value={gender === 0 ? 'Male' : 'Female'}
          onChangeText={(text) => setGender(text)}
        // editable={editable}
      />
        <TextInput
          style={editprofilestyles.bioText}
          value={bio}
          onChangeText={(text) => setBio(text)}
        // editable={editable}
      />
          <Text style={status === 'Verified' ? editprofilestyles.statusText : editprofilestyles.unverifiedstatusText}>
          {status}</Text> 

          <Text style={editprofilestyles.ratingText}>Rating: {rating}</Text> 
          </View>
         
        {/* Editable phone number */}
        <View style={editprofilestyles.midcontainer}>
        <Icon name="phone-alt" type="font-awesome-5" size={15} style={editprofilestyles.PhoneEmailCancellationicon}/>

      <TextInput
     
          style={{ marginLeft: 16 }}
          value={phoneNumber? phoneNumber:"Not Provided"}
          onChangeText={(text) => setPhoneNumber(text)}
        
          keyboardType="numeric"
          // editable={editable}
      />


       </View>
       <View style={editprofilestyles.midcontainer}>
       <Icon name="mail" type="material" size={17} style={editprofilestyles.PhoneEmailCancellationicon}/>

          <TextInput
           style={{ marginLeft: 16 }}
           value={email}
          onChangeText={(text) => setEmail(text)}
            keyboardType="email-address"
          />
        </View>
    
          <View style={editprofilestyles.bottomContainer}>
            {
              <TouchableOpacity style={editprofilestyles.saveButton} onPress={handleSaveChanges}>
                <Text style={editprofilestyles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            }
          </View>
      


         {/* Non EDitable 3rd section of cancellation rate */}

        {/* 3rd section of cancellation rate */}
        <View style={editprofilestyles.midcontainer}>
                <Image
                    source={require('../assets/ridecancel.png')}
                    style={{width:30,height:30,borderRadius:25, marginLeft:16}}
                  />
                  <View style={{ marginLeft: 16 }}>
                    <Text style={editprofilestyles.cancellationrateText}>Cancelled Rides: {cancelledRides}</Text>
                    <Text style={editprofilestyles.cancellationrateText}>Rides as Host: {ridesAsHost}</Text>
                    <Text style={editprofilestyles.cancellationrateText}>Rides as Rider: {ridesAsRider} </Text>
                  </View>
              </View>

      {/* reviews section  */}
      <View style={editprofilestyles.midcontainer}>
        <Text style={editprofilestyles.cancellationrateText}>Reviews</Text>
      </View>

      {/* 1st revieew */}
   
      <ScrollView>


      <View>
      {loading ? (
        <Text styles={{marginLeft:30}}>Loading Reviews...</Text>
      ) : feedbackData.length === 0 ? (
        <Text>No reviews available</Text>

      ) : (

        <View style={{height:'100%', width:'100%'}}>
        <FlatList
          data={feedbackData}
          contentContainerStyle={{flexGrow:1}}
          renderItem={({ item, index }) => (
            <TouchableOpacity key={index}>
              <View style={editprofilestyles.midcontainer}>
                {/* <TouchableOpacity onPress={() => navigation.navigate('MyProfile', { userId: userId })}> */}
                <TouchableOpacity>
                  <Image
                    source={require('../assets/avatar.jpg')}
                    style={{ width: 60, height: 60, borderRadius: 25 }}
                  />
                </TouchableOpacity>
                <View style={{ marginLeft: 16 }}>
                  <Text style={{ fontWeight: '400' }}>{item.FeeduserData?.name}</Text>
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
              <View style={editprofilestyles.horizontalLine}></View>
              {/* {index !== feedbackData.length - 1 && <Separator />} */}
            </TouchableOpacity>
          )}
          // keyExtractor={(item) => item.FeeduserData.ratedBy}
        />
        

        </View>
                
              )}
            </View>
            </ScrollView>

   
    </View>
  );
};

const editprofilestyles = StyleSheet.create({

  container: {
    marginTop:60,
    // borderColor:'grey',
    // borderWidth:1,

    flex: 1,
  },
  inputField:{
  
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
    top: -25, // Half the height of the profile image to overlap
    left: '50%',
    marginLeft: -25, // Half the width of the profile image to center it
    zIndex: 3, // Above the border line and the background image
  },
  userinfo:{
   margin: 40,
   fontWeight:'bold',
  },
  nameText: {
    marginTop:50,
    
    fontSize: 24,
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
  midcontainer:{
    marginTop: 13,
    marginLeft:16,
    // borderWidth: 1,
    // borderColor: 'grey',
 
    padding:5,
    flexDirection: 'row', 
    },
    PhoneEmailCancellationicon:{

      width: 20, height: 20, borderRadius: 25,marginLeft:16
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
    statusText:{
    fontSize: 15,
    color:GlobalColors.accept,
    marginBottom:8,
  },
  unverifiedstatusText:{
    fontSize: 15,
    color:GlobalColors.error,
    marginBottom:7,
  },

    // editableField: {
    //     height: 40,
    //     borderColor: 'gray',
    //     borderWidth: 1,
    //     padding: 10,
    //     fontSize: 16,
    //     marginBottom: 10,
    //   },
      saveButton: {
       backgroundColor: GlobalColors.primary,
        paddingVertical: 7,
        borderRadius: 80,
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal:15,
      },
      saveButtonText: {
        color:'white',
        fontSize: 15,
        fontWeight: 'bold',
        fontStyle:'italic'
      },
});

export default EditProfile;
