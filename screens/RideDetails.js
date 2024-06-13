import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity,ScrollView, StyleSheet, Image, Linking } from 'react-native';
import { setDoc, doc, collection, getDoc, addDoc, where, getDocs, runTransaction, updateDoc, query, FieldValue } from 'firebase/firestore'; // Make sure these imports are correct
import { firestoreDB } from '../config/firebase.config'; // Check if firestoreDB is properly imported
import { Avatar, Icon, Input } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import { ActivityIndicator } from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import { Modal } from 'react-native';
import Picker from '../components/Picker';
import CoriderModal from '../components/CoridersModal';
import { useSelector } from 'react-redux';


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
  
//   {schedule[day].map((time, index) => (
//     <Text key={index} style={styles.text}>Start: {time.Earliest}, End: {time.Return}</Text>
// ))}

  
const renderRider = (rider) => {
    const schedule = rider.item.schedule;

    return (
        <View style={styles.riderContainer}>
         <View style={styles.profileSection}>
                {rider.item.userData?.profilePic ? (<Avatar rounded size="large" source={{ uri: rider.item.userData?.profilePic }} />)
                  : (
                    <Avatar rounded size="large" source={require('../assets/avatar.jpg')}
                    />)}

                    <View style={styles.hostDetails}>
                        <Text style={styles.textBold}>{rider.item.userData?.name}</Text>
                        <Text style={styles.textMini}>{rider.item.userData?.gender === 0 ? 'Male' : 'Female'}</Text>
                        <View style={{ flexDirection: 'row' }}>
                            {/* <Icon name="star" type="material" color={'gold'} size={15} /> */}
                            <Text style={styles.textMed}>{rider.item.userData?.rating }</Text>
                        </View>
                    </View>
                   
                </View>
            

            {console.log('rider', rider)}
            <Text style={styles.textBold}>{rider.item.userData?.name}</Text>
            
            {console.log('item: ', rider.item)}

            {/* Schedule */}

        
            <Text style={styles.stext}>Schedule:</Text>
            {Object.keys(schedule).map((day) => (
                <View key={day} style={styles.scheduleItem}>
                    <Text style={styles.textDay}>{day}:</Text>
                    {schedule[day] && schedule[day].enabled ? (
                        <View>
                            <Text style={styles.text}>Earliest: {schedule[day].Earliest}</Text>
                            <Text style={styles.text}>Other: {schedule[day].Other}</Text>
                            <Text style={styles.text}>Return: {schedule[day].Return}</Text>
                            <Text style={styles.text}>Return Dropoff: {schedule[day]['Return Dropoff']}</Text>
                        </View>
                    ) : (
                        <Text style={styles.textBold}>No schedule available</Text>
                    )}
                </View>
            ))}

          

        </View>
        
    );
}



const RideDetails = () => {
    // const { rideId } = route.params;
    console.log('in detailsss')
    const rideId=useRoute().params.rideId;
    const currentUser = useSelector((state) => state.user.user);

     const [ride, setRide] = useState(null);
     const [loading, setLoading] = useState(true);
     const [isHost,setIsHost]=useState(false);
     const navigation = useNavigation();
     const [hostDataState, setHostData] = useState(null);
     const [ridefrom, setfrom] = useState(null);
     const [rideto, setto] = useState(null);





    // var host=null;
    // var hostData_=null;



    ////////////////

    useEffect(() => {
        const fetchResponses = async () => {
            try {
                const q = doc(collection(firestoreDB, "ride"), rideId);
                const querySnapshot = await getDoc(q);
                if (!querySnapshot.exists()) {
                    console.log("No matching ride found");
                    setRide([]);
                    return;
                }

                const host_ = querySnapshot.data().Host;
                const rideFrom=querySnapshot.data().from;
                setfrom(rideFrom);
                const rideTo=querySnapshot.data().to;
                setto(rideTo);
                const rideStamp=querySnapshot.data().created;
                // host=host_;

                const hostRef = doc(firestoreDB, 'users', host_);
                    const hostSnapshot = await getDoc(hostRef);
                    if (hostSnapshot.exists()){
                    setHostData(hostSnapshot.data());
                    console.log('host data',hostDataState)
                    }
                    else{console.log('host doesnt exist')}


                // setRide(hostData);

                // hostData_=hostData;
                // if (host === currentUser._id) {
                //     setIsHost(true);
                // }


                const rider_ = querySnapshot.data().Riders;
                if (rider_) {
                    const coriders_data = rider_.filter(res => res.rider !== currentUser._id);
                    setRide(coriders_data);

                    if (coriders_data.length === 0) {
                        setLoading(false);
                    } else {
                        const updatedRideData = [];
                        for (const res of rider_) {
                            const Rider = res?.rider;

                            const userRef = doc(firestoreDB, "users", Rider);
                            const userSnapshot = await getDoc(userRef);
                            const userData = userSnapshot.exists() ? userSnapshot.data() : {};

                            const driverInfoRef = doc(firestoreDB, "driverInfo", host_);
                            const driverInfoSnapshot = await getDoc(driverInfoRef);
                            const driverInfo = driverInfoSnapshot.exists()
                                ? driverInfoSnapshot.data()
                                : {};
                      
                            updatedRideData.push({
                                fare: res.fare,
                                from: res.from,
                                created:rideStamp,
                                rideFrom:rideFrom,
                                rideTo:rideTo,
                                to: res.to,
                                startDate: res.startDate,
                                endDate: res.endDate,
                                status: res.status,
                                schedule:res.schedule,
                                paid: res.paid,
                                riderid: res.rider,
                                seats: res.seats,
                                roundTrip: res.roundTrip,



                                // userOrgName: userData.orgName,
                                // hostOrgName:hostData.orgName,
                                // hostData:hostData,

                                userData: userData,
                                driverInfo: driverInfo,
                            });
                        }
                        console.log(updatedRideData);

                        setRide(updatedRideData);
                        setLoading(false);
                    }
                } else {
                    console.log("riders array not found in the document");
                    setRide([]);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching  catch end!!1:", error);
            }
        };

        fetchResponses();
    }, [rideId]);







    //////////////////





    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={GlobalColors.primary} />
            </View>
        );
    }

    if (!ride) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.text}>Ride not found.</Text>
            </View>
        );
    }

    return (
        <ScrollView>
        <View style={styles.container}>
            <Text style={styles.heading}>Ride Details</Text>
            <View style={styles.card}>
                <View style={styles.profileSection}>
                {hostDataState?.profilePic ? (<Avatar rounded size="large" source={{ uri: hostDataState?.profilePic }} />)
                  : (
                    <Avatar rounded size="large" source={require('../assets/avatar.jpg')}
                    />)}

                    {/* {hostDataState.profilePic && (
                        <Avatar rounded size="large" source={{ uri: ride.Host.profilePic || '../assets/avatar.jpg' }} />
                    )} */}
                    <View style={styles.hostDetails}>
                        <Text style={styles.textBold}>{hostDataState?.name}</Text>
                        <Text style={styles.textMini}>{hostDataState?.gender === 0 ? 'Male' : 'Female'}</Text>
                        <View style={{ flexDirection: 'row' }}>
                            <Icon name="star" type="material" color={'gold'} size={15} />
                            <Text style={styles.textMed}>{hostDataState?.rating }</Text>
                        </View>
                    </View>
                    {/* <View style={{ paddingRight: 10 }}>
                        <Text style={[styles.textBold, { color: GlobalColors.primary, fontSize: 22, textAlign: 'center' }]}>Rs.{ride.fare}</Text>
                        <View style={styles.callChatIcons}>
                            <TouchableOpacity onPress={() => { navigation.navigate('ChatScreen', ride.Host) }}>
                                <Icon name="comment-dots" type="font-awesome-5" marginTop={5} size={26} color={GlobalColors.primary} />
                            </TouchableOpacity>
                            {ride.Host?.phoneNumber && (
                                <TouchableOpacity onPress={() => { Linking.openURL(`tel:${ride.Host?.phoneNumber}`) }}>
                                    <Icon name="phone-alt" type="font-awesome-5" marginTop={5} size={24} color={GlobalColors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View> */}
                </View>
                {/* <View style={{ flexDirection: 'row' }}>
                    <Text style={[styles.textBold, { marginHorizontal: 10, fontSize: 13, marginBottom: 3, color: ride.Host?.orgName == 'Unverified Institute' ? GlobalColors.error : GlobalColors.text }]}>
                        {ride.Host?.orgName}
                    </Text>
                </View> */}
                <View style={{ paddingHorizontal: 10 }}>
                    <View style={{ flexDirection: 'row' }}>
                        <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                        <Text style={styles.text}> From: {ridefrom?.name} </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                        <Text style={styles.text}> To: {rideto?.name} </Text>
                    </View>
                    <Text style={styles.coridertext}> Co Riders</Text>

                </View>
                {/* <View>
                    {ride.Riders.map(renderRider)}
                </View> */}
                <FlatList
                data={ride}
                renderItem={renderRider}
                keyExtractor={item => item.id}       />
            </View>
        </View>
        </ScrollView>
    );




}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 0,
        paddingTop: 30,
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 30,
        color: GlobalColors.primary,
        marginTop: '7%',
        paddingHorizontal: 20
    },
    card: {
        backgroundColor: GlobalColors.background,
        borderRadius: 10,
        padding: 5,
        marginBottom: 5,
        marginHorizontal: 10
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profilePic: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    hostDetails: {
        flex: 1,
    },
    stext:{
        fontWeight: 'bold',
        fontSize: 16,
        color: GlobalColors.text,
        marginTop:9,

    },
    textBold: {
        fontWeight: 'bold',
        fontSize: 16,
        color: GlobalColors.text
        
    },
    textMini: {
        fontSize: 12,
        color: GlobalColors.text
    },
    textMed: {
        fontSize: 14,
        color: GlobalColors.text
    },
    text: {
        fontSize: 14,
        color: GlobalColors.text
    },
    coridertext:{
        fontWeight: 'bold',
        fontSize: 16,
        color: GlobalColors.text,
        marginVertical:8,
        marginTop:13,

    },
    callChatIcons: {
        flexDirection: 'row',
        marginTop: 10
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    riderContainer: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: GlobalColors.menubg,
        borderRadius: 10
    }
});

export default RideDetails;