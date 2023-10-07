import React, { useState } from 'react';
import { View, Image, Text } from 'react-native';
import { GiftedChat,Day } from 'react-native-gifted-chat';
import GlobalColors from '../styles/globalColors';
import MessageBubble from '../components/MessageBubble';
import styles from '../styles/globalStyles';

export default function ChatScreen() {
    const currentUser = {
        _id: 1, // User's ID
        name: 'Alice',
        avatar: require('../assets/avatar.jpg'), // Replace with the URL of Alice's profile picture
    };
    
    const chattingTo = {
        _id: 2, // User's ID
        name: 'John Dae',
        avatar: require('../assets/avatar.jpg'), // Replace with the URL of John's profile picture
    };
    const [messages, setMessages] = useState([
    {
      _id: 1,
      text: 'I am doing well, thanks! How about you?',
      createdAt: new Date('2023-01-15T08:05:00'),
      user: {
        _id: chattingTo._id,
        name: chattingTo.name,
      },
    },
    {
      _id: 2,
      text: 'Hello, how are you?',
      createdAt: new Date('2023-01-15T08:00:00'),
      user: {
        _id: currentUser._id,
        name: currentUser.name,
      },
    },
  ]);

  // Function to send a message
  const onSend = (newMessages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <Image
          source={ chattingTo.avatar }
          style={styles.avatar}
        />
        <Text style={styles.text}>{chattingTo.name}</Text>
      </View>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
            _id: currentUser._id,
            name: currentUser.name
        }}
        renderBubble={(props) => <MessageBubble {...props} user={currentUser} />} 
        renderAvatar={(props)=>{null}}
        renderDay={(props)=><Day {...props} textStyle={{color: GlobalColors.background}}/>}
      />

      
    </View>
  );
}
