import React, { useState, useEffect } from 'react';
import { Icon, Overlay, Rating, Input } from 'react-native-elements';
import styles from "../styles/globalStyles";
import GlobalColors from "../styles/globalColors";
import { View, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { addDoc, collection, getDoc, setDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { useSelector } from 'react-redux';

export default function Feedback(props) {
  const [hostMessage, setHostMessage] = useState('');
  const [hostRating, setHostRating] = useState(0);
  const [riderRating, setRiderRating] = useState(Array(props.riders?.length).fill(0));
  const [riderFeedbacks, setRiderFeedbacks] = useState(Array(props.riders?.length).fill(''));
  const [isOverlayVisible, setOverlayVisible] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState([]);
  const navigation = useNavigation();
  const currentUser = useSelector((state) => state.user.user);

  useEffect(() => {
    console.log(props.riders?.length)
    console.log(feedbackSent?.length)
    if (feedbackSent?.length > props.riders?.length && props.riders.length != 0) {
      // Close overlay when all feedbacks are sent
      handleCloseOverlay();
    }
  }, [feedbackSent]);

  const handleCloseOverlay = async() => {
    setOverlayVisible(false);
    const rideRef = doc(collection(firestoreDB, 'ride'), props.rideID);
    const rideSnapshot = await getDoc(rideRef);
    const rideData = rideSnapshot.data();
    const currentUserIndex = rideData.Riders.findIndex(rider => rider.rider === currentUser._id);

    if (currentUserIndex !== -1) {
        const updatedRiders = [...rideData.Riders];
        updatedRiders[currentUserIndex].status = "completed"; 
        await updateDoc(rideRef, { Riders: updatedRiders });
    } else {
        console.error("Current user is not a rider in this ride.");
    }
    navigation.navigate('RequestCreation');
  };

  const addRiderMessage = (index, message) => {
    setRiderFeedbacks(prevFeedbacks => {
      const updatedFeedbacks = [...prevFeedbacks];
      updatedFeedbacks[index] = message;
      return updatedFeedbacks;
    });
    console.log(riderFeedbacks)
  };


  const handleSendFeedback = async (index, id, isHost) => {
    try {
      const feedbackData = {
        rating: isHost ? hostRating || 0 : riderRating[index] || 0,
        feedback: isHost ? hostMessage || '' : riderFeedbacks[index] || '',
        ratedBy: currentUser._id
      };

      await saveFeedback(id, isHost ? 'hostFeedback' : 'riderFeedback', feedbackData);
      setFeedbackSent([...feedbackSent, index]);
    } catch (error) {
      console.error('Error storing feedback: ', error);
    }
  };

  const renderRiders = () => {
    return props.riders?.map((rider, index) => (
      <View key={index}>
        <View style={styles.row}>
          <Text style={styles.name}>{rider.name}</Text>
          <View pointerEvents={feedbackSent.includes(index) ? 'none' : 'auto'} style={{ marginLeft: 'auto', paddingVertical: 10 }}>
          <Rating
            type="star"
            imageSize={20}
            startingValue={0}
            onFinishRating={(rating) => {
              const updatedRiderRatings = [...riderRating]; // Make a copy of the array
              updatedRiderRatings[index] = rating; // Update the rating for the specific rider
              setRiderRating(updatedRiderRatings); // Update the state with the new array
            }}
          />
          </View>
        </View>
        <Text style={styles.feedback}>feedback</Text>
        <View style={styles.row}>
          <TextInput
            placeholder={`How was ${rider.name}?`}
            containerStyle={{ flex: 1, height: 50, padding: 15, backgroundColor: 'black' }}
            value={riderFeedbacks[index]}
            inputContainerStyle={{ borderBottomWidth: 0, backgroundColor: 'black' }}
            onChangeText={(text) => addRiderMessage(index, text)}
            editable={!feedbackSent.includes(index)}
            style={{ fontSize: 18, marginHorizontal: 12 }}
          />
          {feedbackSent.includes(index) ||
            <View style={{ marginLeft: 'auto', paddingHorizontal: 5 }}>
              <Icon
                name="send"
                type="material"
                color={GlobalColors.primary}
                size={25}
                onPress={() => {
                  handleSendFeedback(index, rider._id, false);
                }}
              /></View>
          }
        </View>
        <View style={styles.divider}></View>
      </View>
    ));
  };

  const overlayHeight = props.riders?.length > 0 ? 180 + 30 + 120 * props.riders?.length : 180;

  const saveFeedback = async (id, collectionName, data) => {
    try {
      const feedbackRef = doc(collection(firestoreDB, collectionName), id);
      const docSnap = await getDoc(feedbackRef);
    
      if (docSnap.exists()) {
        console.log(data)
        // Document exists, update it
        await updateDoc(feedbackRef, {
          feedbacks: arrayUnion(data)
        });
      } else {
        console.log(data)
        // Document doesn't exist, create it
        await setDoc(doc(firestoreDB, collectionName, id), {
          feedbacks: [data]
        });
      }

      const userRef = doc(firestoreDB, 'users', id);

      // Fetch the current user data
      const userSnapshot = await getDoc(userRef);
      if (!userSnapshot.exists()) {
        console.log('User does not exist.');
        return;
      }

      const userData = userSnapshot.data();

      // Calculate new rating
      const newRatingCount = userData.ratingCount + 1;
      const newRatingSum = userData.ratingSum + data.rating;
      const newRating = newRatingSum / newRatingCount;

      try {
        // Update the user document
        await updateDoc(userRef, {
          ratingCount: newRatingCount,
          ratingSum: newRatingSum,
          rating: newRating
        });

        console.log('User data updated successfully.');
      } catch (error) {
        console.error('Error updating user data:', error);
      }
      console.log('Feedback saved successfully.');
    } catch (error) {
      console.error('Error saving feedback: ', error);
    }
  };


  return (
    <Overlay
      isVisible={isOverlayVisible}
      overlayStyle={[styles.overlay, { height: overlayHeight }]}
    >
      <View style={styles.column}>
        <View style={styles.column}>
          <Text style={{ color: GlobalColors.primary, fontSize: 25, marginHorizontal: 8, fontWeight: 'bold' }}>Host</Text>
          <View style={styles.row}>
            <Text style={styles.name}>{props.host?.name}</Text>
            <View pointerEvents={feedbackSent.includes('host') ? 'none' : 'auto'} style={{ marginLeft: 'auto', paddingVertical: 10 }}>
            <Rating
              type="star"
              imageSize={20}
              onFinishRating={(rating) => setHostRating(rating)}
              startingValue={0}
            />
            </View>
          </View>
          <Text style={styles.feedback}>feedback</Text>
          <View style={styles.row}>
            <TextInput
              placeholder="How was the Host?"
              value={hostMessage}
              containerStyle={{ flex: 1, height: 50, paddingVertical: 20 }}
              inputContainerStyle={{ borderBottomWidth: 0 }}
              onChangeText={(text) => setHostMessage(text)}
              editable={!feedbackSent.includes('host')}
              style={{ fontSize: 18, marginHorizontal: 12 }} />
            {feedbackSent.includes('host') ||
              <View style={{ marginLeft: 'auto', paddingHorizontal: 5 }}>
                <Icon
                  name="send"
                  type="material"
                  color={GlobalColors.primary}
                  size={25}
                  onPress={() => handleSendFeedback('host', props.host._id, true)}
                /></View>}
          </View>
        </View>
        <View style={styles.divider}></View>
        {props.riders?.length > 0 && <Text style={{ color: GlobalColors.primary, fontSize: 25, margin: 8, fontWeight: 'bold' }}>Co-Riders</Text>}
        {renderRiders()}
      </View>
    </Overlay >
  );
};
