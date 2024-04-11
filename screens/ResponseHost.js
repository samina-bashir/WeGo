import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { collection, query, doc, getDocs, getDoc,runTransaction } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { Avatar, Icon } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import { useNavigation } from '@react-navigation/native';
import { Modal } from 'react-native';
import CoriderModal from '../components/CoridersModal';

const ResponseHost  = ({ route }) => {
    const { ReqId } = route.params;
    console.log('in parameter req id is : ', ReqId); //reqId is actually rider req id findHostReqId
    let hostReqId = null; // Declare a regular variable
    let updatedfare=null;
    // console.log('in parameter HostReqId  id of host is : ', hostReqId);
    const [declinedRequests, setDeclinedRequests] = useState([]);
    const userId='FZxbp2UoJxThVSBIjIIbGEA3Z202';


    const [requests, setRequests] = useState([]);
    const [coridersVisible, setCoridersVisible] = useState(false);
    const [selectedItem, setItem] = useState(null);
    // const [isLoading, setIsLoading] = useState(true);

    const navigation = useNavigation();
    const [responsesHostData,setResponsesHostData]=useState([]);



useEffect(() => {
    const fetchResponses = async () => {
        try {
            const q = doc(collection(firestoreDB, 'responsesHost'), ReqId);
            const querySnapshot = await getDoc(q);

            if (!querySnapshot.exists()) {
                console.log('No matching document found for responses');
                setResponsesHostData([]);
                return;
            }

            const response_ = querySnapshot.data().responsesHost;
            if (response_) {
                setResponsesHostData(response_);
            } else {
                console.log('responses array not found in the document');
                setResponsesHostData([]);
            }

            const updatedResponsesData = [];
            for (const res of response_) {
                const responseBy_ = res?.responseBy;

                const userRef = doc(firestoreDB, 'users', responseBy_);
                const userSnapshot = await getDoc(userRef);
                const userData = userSnapshot.exists() ? userSnapshot.data() : {};


                const coriderRef = doc(firestoreDB, 'ride', 'Ri5o1r474TkoTNC0XUZ6');
                const coriders = await getDoc(coriderRef);
                const coR = coriders.exists() ? coriders.data().Riders : {};

                  //  if (userData.driver) {
                const driverInfoRef = doc(firestoreDB, 'driverInfo', responseBy_);
                const driverInfoSnapshot = await getDoc(driverInfoRef);
                const driverInfo = driverInfoSnapshot.exists() ? driverInfoSnapshot.data() : {};
             
            
        //  }
 

                 // Create Firestore document reference
         const email = userData.email;
         const domain = email.substring(email.lastIndexOf("@") + 1);
         const orgRef = doc(firestoreDB, 'organizations', domain);
         console.log('orgRef is : ',orgRef)

         // Get the document
         getDoc(orgRef).then((docSnapshot) => {
             if (docSnapshot.exists()) {
                userData.orgName = docSnapshot.data().Name;
                 if (userData.orgName == '') {
                    userData.orgName = 'Unverified Institute'
                 }
                 console.log("Organization Name:", userData.orgName);
             } else {
                userData.orgName = 'Unverified Institute';
                 console.log("No organization found for domain:", domain);
             }
         }).catch((error) => {
             console.error("Error getting organization:", error);
         });

         // Retrieve additional data from 'driverInfo' collection (if applicable)



                updatedResponsesData.push({
                    fare: res.fare,
                    from: res.from,
                    to: res.to,
                    status: res.status,
                    findRiderReqId: res.findRiderReqId,
                    orgName:userData.orgName,
                    userData: userData,
                    coriders: coR,
                    driverInfo:driverInfo,
                    // make:driverInfo.make,
                    // model:driverInfo.model,
                });
            }

            setResponsesHostData(updatedResponsesData);
        } catch (error) {
            console.error('Error fetching responses:', error);
        }
    };

    fetchResponses();
}, []);


// const updatefare = async (item) => {
//     try {
//         // Assuming firestoreDB is your Firestore database instance
//         const findHostRequestRef = doc(collection(firestoreDB, 'findHostRequests'), ReqId);
//         const findHostRequestDoc = await getDoc(findHostRequestRef);

//         if (findHostRequestDoc.exists()) {
//             const riderFare = findHostRequestDoc.data().fare;
//             let fare;
//             if (riderFare > item.fare) {
//                 fare = item.fare;
//             } else {
//                 fare = riderFare;
//                 item.fare = item.fare * 0.40;

//                 const findHostRequestRef = doc(collection(firestoreDB, 'findHostRequests'), item.findRiderReqId);
//                 await runTransaction(firestoreDB, async (transaction) => {
//                     const findHostRequestDoc = await transaction.get(findHostRequestRef);
//                     if (findHostRequestDoc.exists()) {
//                         transaction.update(findHostRequestRef, { fare: item.fare });
//                     } else {
//                         console.log('findRiderRequest document does not exist.');
//                     }
//                 });
//             }
//             return fare;
//         } else {
//             console.log('Host request document does not exist.');
//             return null; // or any default value indicating failure
//         }
//     } catch (error) {
//         console.error('Error updating fare:', error);
//         return null; // or any default value indicating failure
//     }
// };




        const onPressAccept = async (item) => {
            try {
                const requestRef = doc(firestoreDB, 'responsesHost', ReqId);
                await runTransaction(firestoreDB, async (transaction) => {
                    const docSnapshot = await transaction.get(requestRef);
                    if (docSnapshot.exists) {
                        const responsesHost = docSnapshot.data().responsesHost;
                        console.log('findRiderReqId is ',item.findRiderReqId )
                        const index = responsesHost.findIndex((response) => response.findRiderReqId === item.findRiderReqId);
                        if (index !== -1) {
                            responsesHost[index].status = 'confirmed';
                            transaction.update(requestRef, { responsesHost });
                            console.log('Response status updated successfully!');
                            hostReqId =item.findRiderReqId;
                            console.log('Host in thi case Req ',hostReqId);

                            // updatedfare = updatefare(item);
                            // console.log('Result of updatefare:', updatedfare);





                            
                        } else {
                            console.log('Response not found in the array.');
                        }
                    } else {
                        console.log('Document does not exist.');
                    }
                });
            } catch (error) {
                console.error('Error updating response status:', error);
            }
        };


        
        const onPressDecline = async (item) => {
            try {
                const requestRef = doc(firestoreDB, 'responsesHost', ReqId);
                await runTransaction(firestoreDB, async (transaction) => {
                    const docSnapshot = await transaction.get(requestRef);
                    if (docSnapshot.exists) {
                        const responsesHost = docSnapshot.data().responsesHost;
                        console.log('findRiderReqId is ',item.findRiderReqId )
                        const index = responsesHost.findIndex((response) => response.findRiderReqId === item.findRiderReqId);
                        if (index !== -1) {
                            responsesHost[index].status = 'rejected';
                            transaction.update(requestRef, { responsesHost });
                            console.log('Response status updated successfully!');

                            setDeclinedRequests(prevRides => prevRides.filter(ride => ride.findRiderReqId !== item.findRiderReqId));

                            
                        } else {
                            console.log('Response not found in the array.');
                        }
                    } else {
                        console.log('Document does not exist.');
                    }
                });
            } catch (error) {
                console.error('Error updating response status:', error);
            }
        };
  

        const renderRequestItem = ({ item }) => (
            <View style={styles.card}>
                <View style={styles.profileSection}>
                    {item.userData?.profilePic ? (
                        <Avatar rounded size="large" source={{ uri: item.userData?.profilePic }} />
                    ) : (
                        <Avatar rounded size={60} source={require('../assets/avatar.jpg')} />
                    )}
                    <View style={styles.hostDetails}>
                  
                        <Text style={styles.textBold}>{item.driverInfo?.make} {item.driverInfo?.model}</Text>
                        <Text style={styles.text}>{item.userData?.name}</Text>
                        <Text style={styles.textMini}>{item.userData?.gender === 0 ? 'Male' : 'Female'}</Text>
                        <View style={{ flexDirection: 'row' }}>
                            <Icon name="star" type="material" color={'gold'} size={15} />
                            <Text style={styles.textMed}>{item.userData?.rating + ' (' + item.userData?.ratingCount + ') '}  </Text>
                        </View>
                    </View>
    
                    <View style={{ paddingRight: 10 }}>
                        <Text style={[styles.textBold, { color: GlobalColors.primary, fontSize: 22, textAlign: 'center' }]}>Rs.{item.fare}</Text>
                        <TouchableOpacity
                            style={{ backgroundColor: GlobalColors.primary, paddingVertical: 5, paddingHorizontal: 7, borderRadius: 7 }}
                            onPress={() => { setCoridersVisible(true); setItem(item) }}
                        >
                            <Text style={{ color: GlobalColors.background, textAlign: 'center' }}>Coriders</Text>
                        </TouchableOpacity>
                        <CoriderModal
                            visible={coridersVisible}
                            coriders={selectedItem?.coriders}
                            onClose={() => setCoridersVisible(false)}
                        />
                        <View style={styles.callChatIcons}>
                            <TouchableOpacity onPress={() => { navigation.navigate('ChatScreen', item.userData) }}>
                                <Icon name="comment-dots" type="font-awesome-5" marginTop={5} size={26} color={GlobalColors.primary} />
                            </TouchableOpacity>
                            {item.userData?.phoneNumber && (
                                <TouchableOpacity onPress={() => { Linking.openURL(`tel:${item.userData?.phoneNumber}`) }}>
                                    <Icon name="phone-alt" type="font-awesome-5" marginTop={5} size={24} color={GlobalColors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={[styles.textBold, { marginHorizontal: 10,fontSize:13, marginBottom:3, color: item.userData?.orgName == 'Unverified Institute' ? GlobalColors.error : GlobalColors.text }]}>
                        {item.userData?.orgName}
                    </Text>
                    {/* <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginLeft: 'auto' }}>
                        <Text style={[styles.preferences, { textDecorationLine: item.music ? 'none' : 'line-through' }]}>Music</Text>
                        <Text style={[styles.preferences, { textDecorationLine: item.ac ? 'none' : 'line-through' }]}>AC</Text>
                    </View> */}
                </View>
                <View style={{ paddingHorizontal: 10 }}>
                    <View style={{ flexDirection: 'row' }}>
                        <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                        <Text style={styles.text}> From: {item.from} </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                        <Text style={styles.text}> To: {item.to} </Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: GlobalColors.accept }]}
                      onPress={() => onPressAccept(item)}
                          >
                        <Text style={[styles.textBold, { color: GlobalColors.background }]}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {onPressDecline(item)
                    setDeclinedRequests(prevState => [...prevState, item.id]); // Add declined request ID
                }}>
                    
                        <Text style={[styles.textBold, { color: GlobalColors.background }]} >Decline</Text>
                    </TouchableOpacity>
    
                </View>
            </View>
        );
    

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Hosts' Responses</Text>
                        {/* {isLoading ? (
                <ActivityIndicator style={styles.loader} size="large" color={GlobalColors.primary} />
            ) : ( */}
            <FlatList
                data={responsesHostData}
                renderItem={renderRequestItem}
                keyExtractor={item => item.id}             />

             {/* )} */}
        </View>
    );
};

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
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        borderRadius: 10,
        marginHorizontal: 2,
    },
    hostDetails: {
        flex: 1,
    },
    textBold: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    text: {
        fontSize: 14,
        fontWeight:'bold',
        marginLeft:8,
    },
    textMini: {
        fontSize: 10,
        marginLeft:9,
        color:GlobalColors.tertiary,
    },
    textMed: {
        fontSize: 12,
    },
    callChatIcons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    preferences: {
        borderWidth: 1,
        borderColor: GlobalColors.primary,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginHorizontal: 5,
        fontStyle: 'italic'
    },
});

export default ResponseHost;
