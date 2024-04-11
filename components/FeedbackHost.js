import React, { useState, useEffect } from 'react';
import { Icon, Overlay, Rating, Input } from 'react-native-elements';
import styles from "../styles/globalStyles";
import GlobalColors from "../styles/globalColors";
import { View, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, getDoc, setDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { useSelector } from 'react-redux';

export default function FeedbackHost(props) {
  const [riderRating, setRiderRating] = useState(Array(props.riders.length).fill(0));
  const [riderFeedbacks, setRiderFeedbacks] = useState(Array(props.riders.length).fill(''));
  const [isOverlayVisible, setOverlayVisible] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState([]);
  const navigation = useNavigation();
  const currentUser = useSelector((state) => state.user.user);

  useEffect(() => {
    if (feedbackSent.length === props.riders.length && props.riders.length != 0) {
      handleCloseOverlay();
    }
  }, [feedbackSent]);

  const handleCloseOverlay = async() => {
    setOverlayVisible(false);
    try {
      const hostRef = doc(collection(firestoreDB, 'users'), currentUser._id);
      await updateDoc(hostRef, { ridesAsHost: currentUser.ridesAsHost+1 });
      props.riders.forEach(async (rider) => {
        const riderRef = doc(collection(firestoreDB, 'users'), rider._id);
        await updateDoc(riderRef, { ridesAsRider: rider.ridesAsRider + 1 });
      });
     
    } catch (error) {
      console.log('Error updating ride status: ', error)
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


  const handleSendFeedback = async (index, id) => {
    try {
      const feedbackData = {
        rating: riderRating[index] || 0,
        feedback: riderFeedbacks[index] || '',
        ratedBy: currentUser._id
      };

      await saveFeedback(id, 'riderFeedback', feedbackData);
      setFeedbackSent([...feedbackSent, index]);
    } catch (error) {
      console.error('Error storing feedback: ', error);
    }
  };

  const renderRiders = () => {
    return props.riders.map((rider, index) => (
      <View key={index}>
        <View style={styles.row}>
          <Text style={styles.name}>{rider.name}</Text>
          <View pointerEvents={feedbackSent.includes(index) ? 'none' : 'auto'} style={{ marginLeft: 'auto', paddingVertical: 10 }}>
            <Rating
              type="star"
              imageSize={20}
              startingValue={0}
              onFinishRating={(rating) => {
                const updatedRiderRatings = [...riderRating];
                updatedRiderRatings[index] = rating;
                setRiderRating(updatedRiderRatings);
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
                  handleSendFeedback(index, rider._id);
                }}
              /></View>
          }
        </View>
        <View style={styles.divider}></View>
      </View>
    ));
  };

  const overlayHeight = props.riders?.length > 0 ? 60 + 120 * props.riders?.length : 10;

  const saveFeedback = async (id, collectionName, data) => {
    try {
      const feedbackRef = doc(collection(firestoreDB, collectionName), id);
      const docSnap = await getDoc(feedbackRef);

      if (docSnap.exists()) {
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
      isVisible={props.visible}
      overlayStyle={[styles.overlay, { height: overlayHeight }]}
    >
      <View style={styles.column}>
        {props.riders?.length > 0 && <Text style={{ color: GlobalColors.primary, fontSize: 25, margin: 8, fontWeight: 'bold' }}>Riders</Text>}
        {renderRiders()}
      </View>
    </Overlay >
  );
};
