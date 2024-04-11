import React, { useState,useEffect } from 'react';
import { View, Text, Button, Image, ScrollView, TouchableOpacity,StyleSheet, TextInput,Rating,FlatList,Separator } from 'react-native';
import GlobalColors from '../styles/globalColors';
import { useNavigation } from '@react-navigation/native';
import StarRating from 'react-native-star-rating';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where,updateDoc } from "firebase/firestore";
import { Icon, Overlay, Avatar, Input } from 'react-native-elements';
import { firestoreDB } from "../config/firebase.config";


const formatTimePassed = (timestamp) => {
  // Convert the timestamp to milliseconds
  const milliseconds = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
  
  // Create a new Date object
  const date = new Date(milliseconds);

  // Get the current time
  const currentTime = new Date();

  // Calculate the difference between the current time and the timestamp
  const difference = Math.abs(currentTime - date);

  // Convert the difference to seconds
  const seconds = Math.floor(difference / 1000);

  // Return a human-readable string based on the difference
  if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minutes ago`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hours ago`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} days ago`;
  }
};



const Myrequst_RideItem = ({ from, to, date, time, seats, status, timepassed,selectedTab,ReqId,onClose, onResponse,onRestore }) => {
  const navigation = useNavigation();
  // const [responsePopupVisible, setResponsePopupVisible] = useState(false);

  return (
  <View style={myreqstyles.rideItem}>
    <View style={myreqstyles.rideDetails}>
      <Text style={myreqstyles.rideText}>From:{from}</Text>
      <Text style={myreqstyles.rideText}>To: {to}</Text>
      <Text style={myreqstyles.rideText}>{date} {time}</Text>
      <Text style={myreqstyles.rideText}>Seats: {seats}</Text>
      <Text style={{color:GlobalColors.primary,fontWeight:'500'}}> {timepassed}</Text>
    </View>
    
    <View>
    {onClose && (

    <TouchableOpacity
          style={myreqstyles.closeButton} onPress={onClose}>
        
          <Text style={myreqstyles.buttonText}>Close</Text>
        </TouchableOpacity>


        )}
        {onResponse && (

          <TouchableOpacity 
            style={myreqstyles.responseButton} 
            onPress={() => {
              console.log('ok')
              onResponse(); // Call onResponse function
              if (selectedTab === 'rider') {
                console.log('Rider req id is : ', ReqId);
                navigation.navigate('ResponseHost', { ReqId: ReqId }); // Navigate based on selected tab
              } else {
                console.log('Host req id is : ', ReqId);
                navigation.navigate('ResponseRider', { ReqId: ReqId }); // Navigate based on selected tab
              }
            }}
          >
  <Text style={myreqstyles.buttonText}>Response</Text>
     </TouchableOpacity>
     )}

      
      {onRestore && (
          <TouchableOpacity style={myreqstyles.repostButton} onPress={onRestore}>
            <Text style={myreqstyles.buttonText}>Repost</Text>
          </TouchableOpacity>
        )}

    </View>
  
  </View>
)};



const MyRequests = () => {
  // const asHostReqId='mG6LMQQHM5gzs0UgbMRU' //from collection findRiderReq
  const userId='FZxbp2UoJxThVSBIjIIbGEA3Z202'

  const [selectedTab, setSelectedTab] = useState('host');
  const navigation = useNavigation();
  const [closedRequests, setClosedRequests] = useState([]);
  const [showClosedRequests, setShowClosedRequests] = useState(false);



  const handleTabPress = (tab) => {
    setSelectedTab(tab);
  };

  

  const [rideRequests, setRideRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let requestsCollection;
        if (selectedTab === 'host') {
          requestsCollection = collection(firestoreDB, 'findRiderRequests');
        } else {
          requestsCollection = collection(firestoreDB, 'findHostRequests');
        }
  
        const querySnapshot = await getDocs(requestsCollection);
  
        const filteredRequests = querySnapshot.docs.filter((doc) => doc.data().createdBy === userId);
  
        const fetchedRideRequests = filteredRequests.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }));
  
        setRideRequests(fetchedRideRequests);
      } catch (error) {
        console.error(error);
        // Handle potential errors gracefully (e.g., display error message to user)
      }
    };
  
    fetchData();
  }, [selectedTab, userId]);

  
  const handleCloseRequest = (index) => {
    const updatedRideRequests = [...rideRequests];
    const closedRequest = updatedRideRequests.splice(index, 1)[0];
    setRideRequests(updatedRideRequests);
    setClosedRequests((prevClosedRequests) => [closedRequest, ...prevClosedRequests]);
  };

  const handleRestoreRequest = (index) => {
    const restoredRequest = closedRequests[index];
    const updatedClosedRequests = [...closedRequests];
    updatedClosedRequests.splice(index, 1);
    setClosedRequests(updatedClosedRequests);
    setRideRequests((prevRideRequests) => [restoredRequest, ...prevRideRequests]);
  };


  

  return (
    <View style={myreqstyles.container}>
      <Text style={myreqstyles.heading}>My Requests</Text>
      <View style={myreqstyles.tabContainer}>
        <TouchableOpacity
          style={[
            myreqstyles.tab,
            { backgroundColor: selectedTab === 'host' ? GlobalColors.primary : GlobalColors.secondary },
          ]}
          onPress={() => handleTabPress('host')}
        >
          <Text style={myreqstyles.tabText}>As Host</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            myreqstyles.tab,
            { backgroundColor: selectedTab === 'rider' ? GlobalColors.primary : GlobalColors.secondary },
          ]}
          onPress={() => handleTabPress('rider')}
        >
          <Text style={myreqstyles.tabText}>As Rider</Text>
        </TouchableOpacity>
      </View>
      {/* onPress={() => navigation.navigate('MyProfile'> */}
      <TouchableOpacity onPress={() => navigation.navigate('MyRequestsScheduled')}>
        <View style={myreqstyles.preSreq}>
          <Text style={myreqstyles.preSreqText}>Prescheduled Requests</Text>
        </View>
      </TouchableOpacity>


      {selectedTab === 'host' ? (
       
        <ScrollView style={myreqstyles.rideList}>

          {rideRequests.map((rideRequest, index) => (

          <TouchableOpacity key={rideRequest.id}>
          <View style={myreqstyles.eachRide}>
            <Myrequst_RideItem
              from={rideRequest.data.from} // Use data from Firebase
              to={rideRequest.data.to}
              date={rideRequest.data.date}
              time={rideRequest.data.time}
              seats={rideRequest.data.seats}
              status={rideRequest.data.status}
              timepassed={formatTimePassed(rideRequest.data.timestamp)} 
              selectedTab={selectedTab} // Pass selectedTab as a prop
              ReqId={rideRequest.id}
              onClose={() => handleCloseRequest(index)}
              onResponse={() => console.log('Response')} // Add your response functionality here
            />
          </View>
        </TouchableOpacity>
      ))}
     

      
        </ScrollView>
) : (
  <ScrollView style={myreqstyles.rideList}>
 
  {rideRequests.map((rideRequest, index) => (

<TouchableOpacity key={rideRequest.id}>
<View style={myreqstyles.eachRide}>
  <Myrequst_RideItem
    from={rideRequest.data.from} // Use data from Firebase
    to={rideRequest.data.to}
    date={rideRequest.data.date}
    time={rideRequest.data.time}
    seats={rideRequest.data.seats}
    status={rideRequest.data.status}
    timepassed={formatTimePassed(rideRequest.data.timestamp)} 
    selectedTab={selectedTab} // Pass selectedTab as a prop
    ReqId={rideRequest.id}
    onClose={() => handleCloseRequest(index)}
    onResponse={() => console.log('Response')} 
  />
</View>
</TouchableOpacity>
))}




  </ScrollView>
)}


{/* start of closed req  */}
<TouchableOpacity onPress={() => setShowClosedRequests(!showClosedRequests)}>
        <View style={myreqstyles.closedReq}>
          <Text style={myreqstyles.closedReqText}>Closed Requests</Text>
        </View>
      </TouchableOpacity>

{showClosedRequests && (
        <ScrollView style={myreqstyles.rideList}>
          {closedRequests.map((closedRequest, index) => (
            <TouchableOpacity key={closedRequest.id}>
              <View style={myreqstyles.eachRide}>
                <Myrequst_RideItem
                  from={closedRequest.data.from}
                  to={closedRequest.data.to}
                  date={closedRequest.data.date}
                  time={closedRequest.data.time}
                  seats={closedRequest.data.seats}
                  timePassed={formatTimePassed(closedRequest.data.timestamp)}
                  onRestore={() => handleRestoreRequest(index)}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* end of closedr eq */}


{/* end */}
    </View>
  );
};

const myreqstyles = StyleSheet.create({

  container: {
    flex: 1,
    marginTop:40,
    backgroundColor:"#fff",
  },
  header: {
    backgroundColor: GlobalColors.primary,
    paddingVertical: 20,
    paddingLeft: 8,
    paddingRight: 13,

    alignItems: 'center',
  },

  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },

  heading: {
    fontWeight: 'bold',
    fontSize: 30,
    color: GlobalColors.primary,
    paddingHorizontal:15
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: GlobalColors.tertiary,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: GlobalColors.secondary, // A lighter blue color
    borderTopLeftRadius: 15, 
    borderTopRightRadius: 15,
    marginHorizontal:1
  },
  tabText: {
    color: GlobalColors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  preSreq: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent:'flex-end',
    marginRight:16,
    

  },
  preSreqText: {
    color: GlobalColors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle:'italic',
    
    shadowColor: 'yellow',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 15,
  },
  closedReq: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent:'flex-end',
    marginRight:16,
    

  },
 closedReqText: {
    color: GlobalColors.textbutton,
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle:'italic',

    shadowColor: 'yellow',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 15,
  },
  rideList: {
    backgroundColor: '#fff', // A sky blue color
    
  },
  eachRide:{
    marginTop:5,
    backgroundColor:GlobalColors.tertiary,
    borderRadius:30,
    paddingHorizontal:10,
  },
  rideItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    
  },
  rideDetails: {
    flex: 3,
  },
  rideText: {
    color: 'black',
    fontWeight:'bold',
  },

  closeButton: {
    backgroundColor:'red', 
    borderRadius: 15,
    padding: 10,
    margin:5,

    
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 15,
  },
  
  repostButton: {
    marginVertical:30,
    backgroundColor:'red', 
    borderRadius: 15,
    padding: 10,
    margin:5,

    
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 15,
  },
  responseButton: {
    backgroundColor: 'green', 
    borderRadius: 15,
    padding: 10,
    margin:5,

    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 15,
  },
  
  buttonText: {
    color: 'white', 
    textAlign: 'center',
  },
  cancelrideText:{
  color:GlobalColors.primary,
  fontWeight:'600'
  },
})
export default MyRequests;