import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Linking, ActivityIndicator } from 'react-native';
import { collection, query, where, doc, getDocs, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { Avatar, Icon, Input, Switch } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Modal } from 'react-native';
import Picker from '../components/Picker';
import CoriderModal from '../components/CoridersModal';
import { useSelector } from 'react-redux';

const FindScheduledHost = () => {
    const [isLoading, setIsLoading]= useState(true)
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const navigation = useNavigation();
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filters, setFilters] = useState({
        ac: false,
        music: false,
        coriders: true,
    });
    const [ratingRange, setRatingRange] = useState([0, 5]);
    const [fareRange, setFareRange] = useState([0, 50000]);
    const [gender, setGender] = useState('none');
    const [coridersVisible, setCoridersVisible] = useState(false);
    const [selectedItem, setItem] = useState(null);
    const [declinedRequests, setDeclinedRequests] = useState([]);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const currentUser = useSelector((state) => state.user.user);
    const myReqData =  useRoute().params;
    const response = {

        requestId: myReqData?.id,
        fare: myReqData?.fare,
        from: myReqData?.from,
        responseBy: currentUser?._id,
        status: "pending",
        to: myReqData?.to,
        schedule: myReqData?.schedule,
        startDate: myReqData?.startDate,
        endDate: myReqData?.endDate,
        seats: myReqData?.seats
    };
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true)
            const requestsCollection = collection(firestoreDB, 'findScheduledRiderRequests');
            const q = query(requestsCollection);

            const querySnapshot = await getDocs(q);
            const requestsData = [];

            for (const document of querySnapshot.docs) {
                const requestData = document.data();
                const createdBy = requestData.createdBy;

                // Retrieve additional data from 'users' collection
                const userRef = doc(firestoreDB, 'users', createdBy);
                const userSnapshot = await getDoc(userRef);
                requestData.userData = userSnapshot.exists() ? userSnapshot.data() : {};
                const email = requestData.userData.email;
                const domain = email.substring(email.lastIndexOf("@") + 1);
                const coriderRef = doc(firestoreDB, 'ride', document.id);
                const coriders = await getDoc(coriderRef);
                requestData.coriders = coriders.exists() ? coriders.data().Riders : [];
                // Create Firestore document reference
                const orgRef = doc(firestoreDB, 'organizations', domain);

                // Get the document
                getDoc(orgRef).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        requestData.userData.orgName = docSnapshot.data().Name;
                        if (requestData.userData.orgName == '') {
                            requestData.userData.orgName = 'Unverified Institute'
                        }
                        console.log("Organization Name:", requestData.userData.orgName);
                    } else {
                        requestData.userData.orgName = 'Unverified Institute';
                        console.log("No organization found for domain:", domain);
                    }
                }).catch((error) => {
                    console.error("Error getting organization:", error);
                });
                // Retrieve additional data from 'driverInfo' collection (if applicable)
                if (requestData.userData.driver) {
                    const driverInfoRef = doc(firestoreDB, 'driverInfo', createdBy);
                    const driverInfoSnapshot = await getDoc(driverInfoRef);
                    requestData.driverInfo = driverInfoSnapshot.exists() ? driverInfoSnapshot.data() : {};
                }

                requestsData.push({
                    id: document.id,
                    ...requestData,
                });
            }

            setRequests(requestsData);
            setFilteredRequests(requestsData);
            applyFilters()
            setIsLoading(false)
        };

        fetchRequests();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, gender, ratingRange, fareRange, declinedRequests]);

    const applyFilters = () => {
        const filtered = requests.filter(request => {
            return (
                (!filters.ac || request.ac) &&
                (!filters.music || request.music) &&
                (filters.coriders || request.coriders.length === 0) &&
                request.userData.rating >= ratingRange[0] && request.userData.rating <= ratingRange[1] &&
                request.fare >= fareRange[0] && request.fare <= fareRange[1] &&
                (gender == 'none' || (request.userData.gender === 1 && gender === 'female') || (request.userData.gender === 0 && gender === 'male')) &&
                !declinedRequests.includes(request.id) &&
                request.createdBy !=currentUser._id
            );
        });
        setFilteredRequests(filtered);
    };


    const toggleFilter = (filter) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filter]: !prevFilters[filter]
        }));
    };

    const renderRequestItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.profileSection}>

                <View style={{ flexDirection: 'row',alignItems: 'center'}}>
                    {item.userData?.profilePic ? (<Avatar rounded size={75} source={{ uri: item.userData?.profilePic }} />)
                        : (
                            <Avatar rounded size={75} source={require('../assets/avatar.jpg')}
                            />)}
                    <View style={styles.hostDetails}>
                        <Text style={styles.textBold}>{item.driverInfo?.make} {item.driverInfo?.model}</Text>
                        <Text style={styles.text}>{item.userData.name}</Text>
                        <Text style={styles.textMini}>{item.userData.gender === 0 ? 'Male' : 'Female'}</Text>
                        <View style={{ flexDirection: 'row' }}>
                            <Icon name="star" type="material" color={'gold'} size={15} />
                            <Text style={styles.textMed}>{item.userData.rating + ' (' + item.userData.ratingCount + ') '}  </Text>
                        </View>

                    </View>

                </View>

                <View style={{ paddingRight: 7, backgroundColor: 'white', marginLeft:'auto' }}>
                    <View style={{ marginLeft: 'auto' }}>
                        <Text style={[styles.textBold, { color: GlobalColors.primary, fontSize: 22, textAlign: 'center' }]}>Rs.{item.fare}</Text>
                        <Text style={[styles.textBold, { color: GlobalColors.primary, fontSize: 14, textAlign: 'center', marginLeft:'auto' }]}>Seats: {item.seats}</Text>
                        <TouchableOpacity style={{ backgroundColor: GlobalColors.primary, paddingVertical: 5, paddingHorizontal: 7, borderRadius: 7 }} onPress={() => { setCoridersVisible(true); setItem(item) }}>
                            <Text style={{ color: GlobalColors.background, textAlign: 'center' }}>
                                Coriders
                            </Text>
                        </TouchableOpacity>
                        <CoriderModal
                            visible={coridersVisible}
                            coriders={selectedItem?.coriders}
                            onClose={() => setCoridersVisible(false)}
                        />

                    </View>
                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                        <Text style={{ fontStyle: 'italic', fontSize: 12, marginBottom: -5  }}>{item?.startDate?.toDate().getDate()} {monthNames[item?.startDate?.toDate().getMonth()]} {item?.startDate?.toDate().getFullYear()}</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 12,marginBottom: -5  }}> to </Text>
                        <Text style={{ fontStyle: 'italic', fontSize: 12 }}>{item?.endDate?.toDate().getDate()} {monthNames[item?.endDate?.toDate().getMonth()]} {item?.endDate?.toDate().getFullYear()}</Text>
                    </View>
                </View>
            </View>
            <Text style={[styles.textBold, { marginHorizontal: 10, color: item.userData.orgName == 'Unverified Institute' ? GlobalColors.error : GlobalColors.text }]}>{item.userData.orgName}</Text>

            <View style={{ flexDirection: 'row' }}>
                <View style={{ flexDirection: 'row', paddingHorizontal: 5, paddingVertical: 3 }}>
                    <Text style={[styles.preferences, { textDecorationLine: item.music ? 'none' : 'line-through' }]}>Music</Text>
                    <Text style={[styles.preferences, { textDecorationLine: item.ac ? 'none' : 'line-through' }]}>AC</Text>
                </View>

                <View style={{ flexDirection: 'row', marginLeft: 'auto', marginVertical: 2 , paddingRight:7}}>
                    {daysOfWeek.map((day, index) => (
                        <TouchableOpacity key={index} style={[styles.dayContainer, item?.schedule[day] && styles.activeDay]}>
                            <Text style={[styles.dayText, item?.schedule[day] && styles.activeText]}>{day[0]}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
                <TouchableOpacity style={[styles.button, { backgroundColor: GlobalColors.accept }]} onPress={async () => await handleAcceptance(item.id)}>
                    <Text style={[styles.textBold, { color: GlobalColors.background }]}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: GlobalColors.error }]} onPress={() => {
                    setDeclinedRequests(prevState => [...prevState, item.id]); // Add declined request ID
                    console.log(item)
                    console.log(item.id)
                }}>
                    <Text style={[styles.textBold, { color: GlobalColors.background }]}>Decline</Text>
                </TouchableOpacity>

            </View>

        </View>
    );
    useEffect(() => {
        // Real-time listener for response status changes
        if (selectedRequestId) {
            const responseRef = doc(firestoreDB, 'responses', selectedRequestId);
            const unsubscribe = onSnapshot(responseRef, (doc) => {
                if (doc.exists()) {
                    const responseData = doc.data();

                    // Check if myReqData.id exists in responses
                    const myReqResponse = responseData.responses.find(response => response.responseBy === currentUser._id);

                    if (myReqResponse && myReqResponse.status === 'confirmed') {
                        setShowAcceptModal(false)
                        // Status changed to accepted, navigate to "during ride" screen
                        navigation.navigate('DuringRide', { requestId: selectedRequestId });
                    }
                }
            });

            return () => unsubscribe();
        }
    }, [selectedRequestId]);
    const handleAcceptance = async (reqID) => {
        setSelectedRequestId(reqID)
        
        // Add or update response in Firestore

        try {
            const responseRef = doc(firestoreDB, 'responses', reqID);
            const docSnapshot = await getDoc(responseRef);
            console.log('ok')
            console.log(response)
            console.log(myReqData)
            if (docSnapshot.exists()) {
                console.log(docSnapshot.data())
                const responseIndex = docSnapshot.data().responses.findIndex(response => response.responseBy === currentUser?._id);
                console.log(responseIndex)
                if (responseIndex == -1) {
                // Document already exists, update it
                await updateDoc(responseRef, {
                    responses: [...docSnapshot.data().responses, response]
                });
            }else{
                const existingData=docSnapshot.data()
                existingData.responses[responseIndex]=response
                console.log('d',existingData)
                await updateDoc(responseRef, 
                   {responses: existingData.responses}
                );
            }
            } else {
                // Document doesn't exist, create it with the accepted request ID
                await setDoc(responseRef, {
                    responses: [response]
                });
            }
            console.log('Response added/updated successfully!');
            setShowAcceptModal(true)
        } catch (error) {
            console.error('Error adding/updating response:', error);
        }
    };

    const handleCancel = async () => {
        setShowAcceptModal(false)
        try {

            if (selectedRequestId) {
                const responseRef = doc(firestoreDB, 'responses', selectedRequestId);
                const responseData = await getDoc(responseRef);
                if (responseData.exists()) {
                    const responseIndex = responseData.data().responses.findIndex(response => response.responseBy === currentUser._id);
                    if (responseIndex !== -1) {
                        const updatedData = { ...responseData.data() };
                        updatedData.responses[responseIndex].status = 'cancelled';
                        await updateDoc(responseRef, updatedData);
                    } else {
                        console.error('Response not found for the current user.');
                    }
                }
                else { console.error('Response not found.') }
                console.log('Response canceled successfully!');
            }
            else { console.log('No selected Id') }
        } catch (error) {
            console.error('Error canceling response:', error);
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Available Hosts</Text>
            <View style={styles.filterContainer}>
                <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
                    <Icon name="filter" type="font-awesome-5" color={GlobalColors.primary} size={20} />
                    <Text style={styles.textBold}> Filters</Text>
                </TouchableOpacity>

            </View>
            {isLoading && (
          <ActivityIndicator size={"large"} color={GlobalColors.primary} />
        )}
            <FlatList
                data={filteredRequests}
                renderItem={renderRequestItem}
                key={item => item.id}
            />
            <Modal
                visible={showAcceptModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Waiting for confirmation...</Text>
                        <TouchableOpacity style={[styles.button, { flex: 0, backgroundColor: GlobalColors.error }]} onPress={async () => await handleCancel()}>
                            <Text style={[styles.textBold, { color: GlobalColors.background }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={filterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalContainer} onPress={() => setFilterModalVisible(false)}>
                    <TouchableOpacity style={styles.modalContent} onPress={() => setFilterModalVisible(true)}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setFilterModalVisible(false)}>
                            <Icon name="times" type="font-awesome-5" color={GlobalColors.primary} size={20} />
                        </TouchableOpacity>
                        <Text style={styles.modalHeading}>Filters</Text>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>AC</Text>
                            <Switch
                                trackColor={{ false: '#767577', true: GlobalColors.primary }}
                                thumbColor={filters.ac ? GlobalColors.background : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={() => toggleFilter('ac')}
                                value={filters.ac}
                                style={{ marginLeft: 'auto' }}
                            />
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Music</Text>
                            <Switch
                                trackColor={{ false: '#767577', true: GlobalColors.primary }}
                                thumbColor={filters.music ? GlobalColors.background : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={() => toggleFilter('music')}
                                value={filters.music}
                                style={{ marginLeft: 'auto' }}
                            />
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Coriders</Text>
                            <Switch
                                trackColor={{ false: '#767577', true: GlobalColors.primary }}
                                thumbColor={filters.coriders ? GlobalColors.background : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={() => toggleFilter('coriders')}
                                value={filters.coriders}
                                style={{ marginLeft: 'auto' }}
                            />
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Rating</Text>
                            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                <Input
                                    style={styles.input}
                                    placeholder="1"
                                    keyboardType="numeric"
                                    onChangeText={(value) => {
                                        if (value != '') {
                                            const lower = Math.max(0, Math.min(parseFloat(value), parseFloat(ratingRange[1])));
                                            setRatingRange([lower, ratingRange[1] ?? 5]);
                                        } else {
                                            setRatingRange([1, ratingRange[1]]);
                                        }
                                    }}
                                    value={ratingRange[0] ? String(ratingRange[0]) : ''}
                                    inputContainerStyle={{ borderBottomWidth: 0, width: 65 }}
                                    containerStyle={styles.inputContainer}
                                    suppressUndefinedOrNullWarning={true}
                                />
                                <Text style={{ fontSize: 45, marginLeft: 20 }}>-</Text>
                                <Input
                                    style={styles.input}
                                    placeholder="5"
                                    keyboardType="numeric"
                                    onChangeText={(value) => {
                                        if (value != '') {
                                            const upper = Math.min(5, Math.max(parseFloat(value), parseFloat(ratingRange[0])));
                                            setRatingRange([ratingRange[0] ?? 0, upper]);
                                        } else {
                                            setRatingRange([ratingRange[0], 5]);
                                        }
                                    }}
                                    value={ratingRange[1] ? String(ratingRange[1]) : ''}
                                    inputContainerStyle={{ borderBottomWidth: 0, width: 65 }}
                                    containerStyle={styles.inputContainer}
                                    suppressUndefinedOrNullWarning={true}
                                />
                            </View>
                            {console.log(ratingRange)}
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Gender</Text>
                            <View style={{ marginLeft: 'auto' }}>
                                <Picker
                                    options={[
                                        { label: 'Select Gender', value: 'none', icon: 'venus-mars' },
                                        { label: 'Male', value: 'male', icon: 'mars' },
                                        { label: 'Female', value: 'female', icon: 'venus' },
                                    ]}
                                    selectedValue={gender}
                                    onValueChange={(value) => setGender(value)}
                                    placeholder="Select Gender"
                                    margin='40%'
                                />
                            </View>
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Fare</Text>
                            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                <Input
                                    style={styles.input}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={fareRange[0] ? String(fareRange[0]) : ''}
                                    onChangeText={(value) => {
                                        if (value != '') {
                                            const lower = Math.max(0, Math.min(parseFloat(value), parseFloat(fareRange[1])));
                                            setFareRange([lower, fareRange[1] ?? 10000]);
                                        } else {
                                            setFareRange([0, fareRange[1]]);
                                        }
                                    }}
                                    inputContainerStyle={{ borderBottomWidth: 0, width: 65 }}
                                    containerStyle={styles.inputContainer}
                                    suppressUndefinedOrNullWarning={true}
                                />
                                <Text style={{ fontSize: 45, marginLeft: 20 }}>-</Text>
                                <Input
                                    style={styles.input}
                                    placeholder="10000"
                                    keyboardType="numeric"
                                    onChangeText={(value) => {
                                        if (value != '') {
                                            const upper = Math.min(5, Math.max(parseFloat(value), parseFloat(fareRange[0])));
                                            setRatingRange([fareRange[0] ?? 0, upper]);
                                        } else {
                                            setRatingRange([fareRange[0], 10000]);
                                        }
                                    }}
                                    value={fareRange[1] ? String(fareRange[1]) : ''}
                                    inputContainerStyle={{ borderBottomWidth: 0, width: 65 }}
                                    containerStyle={styles.inputContainer}
                                    suppressUndefinedOrNullWarning={true}
                                />
                            </View>
                        </View>

                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    filterButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 10,
        flexDirection: 'row'
    },
    card: {
        backgroundColor: GlobalColors.background,
        borderRadius: 10,
        padding: 5,
        marginBottom: 5,
        marginHorizontal: 10
    },
    modalText: {
        fontSize: 18,
        marginVertical: 20,
        textAlign: 'center',
        paddingHorizontal: 20
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
        flex: 0,
    },
    textBold: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    text: {
        fontSize: 14,
    },
    textMini: {
        fontSize: 10,
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
        paddingHorizontal: 10,
        borderRadius: 10,
        marginHorizontal: 2,
        fontStyle: 'italic',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: GlobalColors.background,
        borderRadius: 10,
        padding: 20,
        width: '80%',
    },
    closeButton: {
        alignSelf: 'flex-end',
    },
    modalHeading: {
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    filterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginHorizontal: 7
    },
    filterText: {
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: GlobalColors.primary,
        paddingHorizontal: 8,
        borderRadius: 5,
        textAlign: 'center'
    },
    inputContainer: {
        borderRadius: 10,
        borderColor: GlobalColors.primary,
        width: 65,
        height: 40,
        marginLeft: 2
    },
    dayContainer: {
        width: 20,
        height: 20,
        borderRadius: 20,
        backgroundColor: 'lightgrey',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 1,
    },
    activeDay: {
        backgroundColor: GlobalColors.primary,
    },
    dayText: {
        fontSize: 12,
        color: GlobalColors.text
    },
    activeText: {
        color: GlobalColors.background,
        fontWeight: 'bold'
    },
});

export default FindScheduledHost;
