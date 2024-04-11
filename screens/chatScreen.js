import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, Text, TouchableOpacity, Linking } from 'react-native';
import { GiftedChat, Day } from 'react-native-gifted-chat';
import { firestoreDB, firebaseAuth } from '../config/firebase.config';
import GlobalColors from '../styles/globalColors';
import MessageBubble from '../components/MessageBubble';
import styles from '../styles/globalStyles';
import { collection, addDoc, updateDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from 'react-native-elements';

export default function ChatScreen() {
  const currentUser = { _id: "FZxbp2UoJxThVSBIjIIbGEA3Z202" }//useSelector((state) => state.user.user);
  const chattingTo = useRoute().params;
  const [messages, setMessages] = useState([]);
  const navigation= useNavigation();

  useEffect(() => {
    console.log(chattingTo)
    // Define a query to get messages where participants include the current user and 'chattingTo'
    const q = query(
      collection(firestoreDB, 'chats'),
      where('participants', '==', [currentUser?._id, chattingTo._id]),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        _id: doc.data()?._id,
        createdAt: doc.data().createdAt.toDate(),
        text: doc.data().text,
        user: doc.data().user,
      }));
      setMessages(newMessages);
      console.log('currentUser?._id:', currentUser?._id);
    console.log('chattingTo?._id:', chattingTo?._id);
    console.log('newMessages:', newMessages);

    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?._id, chattingTo?._id]);

  const onSend = useCallback(
    async (messages = []) => {
      try {
        // Add participants to the message data
        const participants = [currentUser?._id, chattingTo?._id];
        console.log(messages[0])
        // Add the message to Firestore
        const { _id, createdAt, text, user } = messages[0];
        await addDoc(collection(firestoreDB, 'chats'), {
          _id,
          createdAt,
          text,
          user,
          participants,
        });

        // Update the local state with the new message
        //setMessages((previousMessages) => GiftedChat.append(previousMessages, messages[0]));
      } catch (error) {
        console.error('Error adding message to Firestore:', error);
      }
    },
    [currentUser?._id, chattingTo?._id]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>{navigation.goBack()}}>
      <Icon name='long-arrow-alt-left' type='font-awesome-5' color={GlobalColors.background} />
      </TouchableOpacity>
      {chattingTo.profilePic ? <Image source={{ uri: chattingTo.profilePic }} style={styles.avatar} /> :
          <Image source={require('../assets/avatar.jpg')} style={styles.avatar} />}
        <Text style={styles.text}>{chattingTo.name}</Text>
      </View>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: currentUser?._id,
          name: currentUser.name,
        }}
        renderBubble={(props) => <MessageBubble {...props} user={currentUser} />}
        renderAvatar={null} // RenderAvatar is not needed
        renderDay={(props) => <Day {...props} textStyle={{ color: GlobalColors.background }} />}
      />
    </View>
  );
}