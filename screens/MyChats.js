import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, FlatList, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { TouchableOpacity } from "react-native";
import { Image, SearchBar, Text } from "react-native-elements";
import GlobalColors from "../styles/globalColors";
import { firestoreDB } from "../config/firebase.config";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useIsFocused, useNavigation } from "@react-navigation/native";

const MessageCard = ({ sender, lastMessage, time}) => {
  const navigation=useNavigation();
  const handlePress = () => {
    console.log(sender)
    navigation.navigate('ChatScreen',sender)
  };
  return (
    <TouchableOpacity style={styles.messageCard} onPress={()=>handlePress()}>
      <View style={styles.avatarContainer}>
        {sender.profilePic ? <Image source={{ uri: sender.profilePic }} style={styles.avatar} /> :
          <Image source={require('../assets/avatar.jpg')} style={styles.avatar} />}
      </View>
      <View style={styles.messageContentContainer}>
        <Text style={styles.senderText}>{sender.name}</Text>
        <Text style={styles.lastMessageText}>{lastMessage}</Text>
      </View>
      <View>
        <Text style={styles.timeText}>{formatTime(time)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const MyChats = () => {
  const user = useSelector((state) => state.user.user);
  const [isLoading, setIsLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const isFocused=useIsFocused();

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true)
      const userChatsRef = query(
        collection(firestoreDB, 'chats'),
        where('participants', 'array-contains', user._id),
        orderBy('createdAt', 'desc')
      );
      try {
        setChats([])
        const chat = await getDocs(userChatsRef);
        latestMessages = []
        const seenParticipants = new Set();
        for (const chatDoc of chat.docs) {
          const participants = chatDoc.data().participants;
          // Check if the participants have been seen before
          const hasRedundantParticipants = participants.every(participant => seenParticipants.has(participant));
          if (!hasRedundantParticipants) {
            // If not redundant, add to seen participants set
            participants.forEach(participant => seenParticipants.add(participant));
            // Check if participants array has exactly 2 elements
            if (participants.length === 2) {
              const otherUserId = participants.find(participantId => participantId !== user._id);

              // Fetch user document for the other participant
              const userDocRef = doc(firestoreDB, 'users', otherUserId);
              const userDocSnapshot = await getDoc(userDocRef);

              if (userDocSnapshot.exists()) {
                // If user document exists, add the latest message to the result with chatId and other user info
                const latestMessage = { key: chatDoc.id, ...chatDoc.data(), otherUser: { userId: userDocSnapshot.id, ...userDocSnapshot.data() } };
                latestMessages.push(latestMessage);
              }
            }
          }
        }
        setChats(latestMessages);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setIsLoading(false);
      }
    };

    fetchChats();
  },[isFocused]);

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = latestMessages.filter(
      (chat) =>
        chat.otherUser.name.toLowerCase().includes(text.toLowerCase()) ||
        chat.text.toLowerCase().includes(text.toLowerCase())
    );
    setChats(filtered);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Chats</Text>
      <SearchBar
        placeholder="Search"
        onChangeText={handleSearch}
        value={search}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
      />
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <ActivityIndicator size={"large"} color={GlobalColors.primary} />
        ) : chats.length === 0 ? (
          <Text style={styles.noChatsText}>No chats available</Text>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <MessageCard
                key={item.key}
                sender={item.otherUser}
                lastMessage={item.text}
                time={item.createdAt} 
              />
            )}
          />
        )}
      </View>
    </View>
  );
};

export default MyChats;

function formatTime(time) {
  if (!time || !time.seconds) {
    return "Invalid time";
  }

  const now = new Date();
  const messageTime = new Date(time.seconds * 1000 + Math.round(time.nanoseconds / 1e6));

  const diffInSeconds = Math.floor((now - messageTime) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    // Customize the date formatting based on your requirements
    const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return messageTime.toLocaleDateString("en-US", options);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'column',
    backgroundColor: GlobalColors.background
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 30,
    color: GlobalColors.primary,
    marginVertical: '7%',
    paddingHorizontal:10,
    paddingTop:20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noChatsText: {
    fontSize: 18,
    textAlign: "center",
    color: GlobalColors.primary
  },
  messageCard: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: GlobalColors.secondary,
  },
  avatarContainer: {
    marginHorizontal: 10,
  },
  messageContentContainer: {
    flex: 1,
  },
  senderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: GlobalColors.primary
  },
  lastMessageText: {
    fontSize: 14,
    color: GlobalColors.lightGray,
  },
  timeText: {
    fontSize: 12,
    color: 'gray',
    alignSelf: "flex-end",
    marginRight:10
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginLeft: 0,
    resizeMode: 'contain'
  },
  searchContainer: {
    backgroundColor: GlobalColors.background,
    borderTopColor: GlobalColors.background,
    borderBottomColor: GlobalColors.background,
    paddingVertical:0
  },
  searchInputContainer: {
    backgroundColor: GlobalColors.background,
    borderColor: GlobalColors.primary,
    borderBottomColor: GlobalColors.primary, 
    borderWidth: 2,
    borderRadius:10,
    paddingHorizontal:10,
    color:GlobalColors.primary,
    borderBottomWidth: 2, 
  },
});