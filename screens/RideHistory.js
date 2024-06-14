import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import GlobalColors from '../styles/globalColors';
// import { navigate } from 'react-native-navigation';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { FlatList } from 'react-native-gesture-handler';
import { SearchBar } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
// import { useNavigation } from '@react-navigation/native';

const MyRidesScreen = () => {
    const currentUser = useSelector((state) => state.user.user);
    const userId = currentUser?._id
    const [selectedTab, setSelectedTab] = useState('host');
    const navigation = useNavigation();
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const handleTabPress = (tab) => {
        setSelectedTab(tab);
    };
    const [selectedButton, setSelectedButton] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [search, setSearch] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [rides, setRides] = useState([])
    const [suggestions, setSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [filteredRides, setFilteredRides] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleShowDatePicker = (buttonType) => {
        setSelectedButton(buttonType);
        console.log('hi')
        setShowDatePicker(true);
    };
    const handleDateChange = (event, date) => {
        setShowDatePicker(false);
        if (event.type == 'set' && date) {
            setSelectedButton((prev) => (prev === 'start' ? setStartDate(date) : setEndDate(date)));
        }
    };
    const handleSearch = (text) => {
        // Filter suggestions based on the input text
        if (text.length > 0) {
            setShowSuggestions(true)
        }else{
            setSearch(null)
        }
        setSearchText(text)
        const filtered = suggestions.filter(suggestion =>
            suggestion.name.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredSuggestions(filtered);
    };

    const handleSuggestionPress = (suggestion) => {
        setSearch(suggestion); // Update search input with selected suggestion
        console.log(suggestion.name)
        setSearchText(suggestion.name)
        setFilteredSuggestions([]); // Clear suggestion list
        // Handle additional actions based on selected suggestion
        setShowSuggestions(false)
    };
    useEffect(() => {
        if(!isLoading){
            console.log('filteringgg')
        const filtered = rides.filter(ride => {
            const isHostMatch = ride.data.Host === search?.id;
            const isRiderMatch = ride.data.Riders.some(rider => rider.rider === search?.id);
            const createdDate = new Date(ride?.data?.created);
            const isWithinDateRange = (!startDate || createdDate >= new Date(startDate)) &&
                (!endDate || createdDate <= new Date(endDate));

            return (isHostMatch || isRiderMatch) && isWithinDateRange;
        });
        setFilteredRides(filtered);}
    }, [search, selectedTab, rides, startDate, endDate])
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)

            try {
                const ridesCollection = collection(firestoreDB, 'ride');
                ;
                if (selectedTab === 'host') {
                    const q = query(ridesCollection, where('Host', '==', userId));
                    const querySnapshot = await getDocs(q)
                    const ridesData = []
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        const hostData = {
                            id: doc.id,
                            data,
                            seats: 0,
                            startDate: null,
                            endDate: null,
                            status: 'InProgress',
                            from: data.from,
                            to: data.to,
                            created: null,
                        };

                        let hasInProgress = false;
                        let hasCompleted = false;
                        let allCancelled = true;

                        data.Riders.forEach(rider => {
                            hostData.seats += rider.seats;
                            if (!hostData.created || new Date(rider.created) < new Date(hostData.created)) {
                                hostData.created = rider.created
                            }
                            if (rider.startDate && (!hostData.startDate || new Date(rider.startDate) < new Date(hostData.startDate))) {
                                hostData.startDate = rider.startDate;
                            }
                            if (rider.endDate && (!hostData.endDate || new Date(rider.endDate) > new Date(hostData.endDate))) {
                                hostData.endDate = rider.endDate;
                            }

                            if (rider.status === 'InProgress') {
                                hasInProgress = true;
                                hostData.status = 'InProgress';
                            }
                            if (rider.status === 'Completed') {
                                hasCompleted = true;
                            }
                            if (rider.status !== 'Cancelled') {
                                allCancelled = false;
                            }
                        });

                        if (allCancelled) {
                            hostData.status = 'Cancelled';
                        } else if (!hasInProgress && hasCompleted) {
                            hostData.status = 'Completed';
                        }

                        ridesData.push(hostData);
                        console.log('sfedf',ridesData)
                    });
                    setRides(ridesData)
                    console.log('fedf',ridesData)
                    setFilteredRides(ridesData)
                    setIsLoading(false)
                } else {
                    const q = query(ridesCollection, where('Host', '!=', userId));
                    const querySnapshot = await getDocs(q)
                    const filteredDocs = querySnapshot.docs.filter((doc) => {
                        const data = doc.data();
                        return data.Riders.some(riderMap => riderMap.rider === userId);
                    });
                    const ridesData = []
                    filteredDocs.forEach((doc) => {
                        console.log(doc.id, ' => ', doc.data());
                        const userRide = doc.data().Riders.find(riderMap => riderMap.rider === userId);
                        ridesData.push({ id: doc.id, data: doc.data(), userRide });
                    });
                    setRides(ridesData)
                    console.log('sfedf',ridesData)
                    setFilteredRides(ridesData)
                    setIsLoading(false)
                }
                const userCollection = collection(firestoreDB, 'users');
                const snapshot = await getDocs(userCollection);
                const userNames = []
                snapshot.docs.forEach((doc) => {
                    userNames.push({ name: doc.data().name, id: doc.data()._id })
                })
                setSuggestions(userNames)
            } catch (error) {
                console.error(error);
                // Handle potential errors gracefully (e.g., display error message to user)
            }


        };

        fetchData();
    }, [selectedTab, userId]);
    const renderRideItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate("RideDetail", { rideId: item.id })} disabled={item.startDate==null}>
            <View style={rideHistorystyles.eachRide}>
                <View style={rideHistorystyles.rideItem}>
                    <View style={rideHistorystyles.rideDetails}>
                        <Text style={rideHistorystyles.rideText}>From:{item.from?.name}</Text>
                        <Text style={rideHistorystyles.rideText}>To: {item.to?.name}</Text>
       
                        <Text style={rideHistorystyles.rideText}>{item.startDate ? `${item.startDate.toDate().toLocaleDateString()} to ${item.endDate.toDate().toLocaleDateString()}` : item.data?.created?.toDate().toLocaleString([], {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</Text>
                        <Text style={rideHistorystyles.rideText}>Seats Booked: {item.seats}</Text>
                    </View>
                    <TouchableOpacity style={rideHistorystyles[item.status]}>
                        <Text style={rideHistorystyles.statusText}>{item.status}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
    const renderHostRideItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate("RideDetail", { rideId: item.id })}  disabled={item.userRide.startDate==null}>
            <View style={rideHistorystyles.eachRide}>
                <View style={rideHistorystyles.rideItem}>
                    <View style={rideHistorystyles.rideDetails}>
                    {console.log('startq', item.startDate, 'end', item.endDate)}
                        <Text style={rideHistorystyles.rideText}>From:{item.userRide.from?.name}</Text>
                        <Text style={rideHistorystyles.rideText}>To: {item.userRide.to?.name}</Text>
                        <Text style={rideHistorystyles.rideText}>{item.userRide.startDate ? `${item.userRide.startDate.toDate().toLocaleDateString()} to ${item.userRide.endDate.toDate().toLocaleDateString()}` : item.data.created.toDate().toLocaleString([], {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</Text>
                        <Text style={rideHistorystyles.rideText}>Seats Booked: {item.userRide.seats}</Text>
                    </View>
                    <TouchableOpacity style={rideHistorystyles[item.userRide.status]}>
                        <Text style={rideHistorystyles.statusText}>{item.userRide.status}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
    useEffect(() => {
        console.log('hahaha', searchText)
    }, [searchText])
    return (
        <View style={rideHistorystyles.container}>
            <Text style={rideHistorystyles.heading}>My Rides</Text>
            <View style={rideHistorystyles.dateContainer}>
                <TouchableOpacity style={rideHistorystyles.dateButton} onPress={() => handleShowDatePicker('start')}>
                    <Text style={rideHistorystyles.buttonText}>{startDate ? startDate.toDateString() : 'Start Date'}</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 30 }}>-</Text>
                <TouchableOpacity style={rideHistorystyles.dateButton} onPress={() => handleShowDatePicker('end')}>
                    <Text style={rideHistorystyles.buttonText}>{endDate ? endDate.toDateString() : 'End Date'}</Text>
                </TouchableOpacity>
            </View>
            <SearchBar
                placeholder="Search"
                onChangeText={handleSearch}
                value={searchText}
                containerStyle={rideHistorystyles.searchContainer}
                inputContainerStyle={rideHistorystyles.searchInputContainer}
            />
            {showSuggestions && (<FlatList
                contentContainerStyle={{ height: '100%' }}

                data={filteredSuggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleSuggestionPress(item)}>
                        <Text style={rideHistorystyles.suggestionItem}>{item.name}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => {
                    return isLoading ? null : <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}><Text style={{ color: 'black' }}>No Request found!</Text></View>
                }}
            />)}
            <View style={rideHistorystyles.tabContainer}>
                <TouchableOpacity
                    style={[
                        rideHistorystyles.tab,
                        { backgroundColor: selectedTab === 'host' ? GlobalColors.primary : GlobalColors.secondary },
                    ]}
                    onPress={() => handleTabPress('host')}
                >
                    <Text style={rideHistorystyles.tabText}>As Host</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        rideHistorystyles.tab,
                        { backgroundColor: selectedTab === 'rider' ? GlobalColors.primary : GlobalColors.secondary },
                    ]}
                    onPress={() => handleTabPress('rider')}
                >
                    <Text style={rideHistorystyles.tabText}>As Rider</Text>
                </TouchableOpacity>
            </View>
            {showDatePicker && (
                    <DateTimePicker
                        value={selectedButton === 'start' ? startDate || new Date() : endDate || new Date()}
                        mode="datetime"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                    />
                )}
            {isLoading ? (
                <View style={[rideHistorystyles.rideList, { height: '100%' }]}>
                    <ActivityIndicator size={"large"} color={GlobalColors.background} />
                </View>
            ) : !showSuggestions && selectedTab == 'host' ? <>
                <FlatList
                    contentContainerStyle={[rideHistorystyles.rideList, { height: '100%' }]}
                    data={filteredRides}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderRideItem}
                    ListEmptyComponent={() => {
                        return isLoading ? null : <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}><Text style={{ color: GlobalColors.background, fontSize: 25, padding: 20 }}>No Rides yet!</Text></View>
                    }}
                />
            </> :
                <>
                    <FlatList
                        contentContainerStyle={[rideHistorystyles.rideList, { height: '100%' }]}
                        data={filteredRides}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderHostRideItem}
                        ListEmptyComponent={() => {
                            return isLoading ? null : <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}><Text style={{ color: GlobalColors.background, fontSize: 25, padding: 20 }}>No Rides yet!</Text></View>
                        }}
                    />
                </>
            }


        </View>

    );
};

const rideHistorystyles = StyleSheet.create({
    dateContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dateButton: {
        flex: 1,
        margin: 5,
        backgroundColor: GlobalColors.primary,
        borderRadius: 15,
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundTripContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkBox: {
        marginLeft: 10,
    },
    scheduleContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    dayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        width: '100%',
        borderBottomWidth: 1,
        borderColor: GlobalColors.primary,
    },
    timeButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'space-around',
    },
    timeButton: {
        backgroundColor: GlobalColors.background,
        borderRadius: 15,
        borderWidth: 1,
        paddingVertical: 7,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 1,
        borderColor: GlobalColors.primary
    },
    buttonText: {
        color: GlobalColors.background,
        fontSize: 16,
    },

    cardText: {
        fontSize: 18,
        textAlign: 'center',
    },
    selectedTimeText: {
        color: GlobalColors.text,
        fontSize: 15,
    },
    setScheduleButton: {
        backgroundColor: GlobalColors.primary,
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 20,
        margin: 10,
    },
    setScheduleButtonText: {
        color: GlobalColors.background,
        fontSize: 18,
    },
    smallText: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 6,
        flexWrap: 'wrap',
        flex: 1,
        fontWeight: 'bold'
    },
    timeTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '90%',
    },
    disabledButton: {
        opacity: 0.5,
    },
    disabledText: {
        color: '#999999',
    },
    container: {
        flex: 1,
        paddingTop: 50,
        backgroundColor: GlobalColors.background
    },
    header: {
        backgroundColor: GlobalColors.primary,
        paddingVertical: 20,
        paddingHorizontal: 10,
        alignItems: 'center',
    },

    heading: {
        fontWeight: 'bold',
        fontSize: 30,
        color: GlobalColors.primary,
        paddingHorizontal: 15
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
        marginHorizontal: 1
    },
    tabText: {
        color: GlobalColors.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    suggestionItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    rideList: {
        backgroundColor: GlobalColors.primary, // A sky blue color

    }, searchContainer: {
        backgroundColor: GlobalColors.background,
        borderTopColor: GlobalColors.background,
        borderBottomColor: GlobalColors.background,
        paddingVertical: 0
    },
    searchInputContainer: {
        backgroundColor: GlobalColors.background,
        borderColor: GlobalColors.primary,
        borderBottomColor: GlobalColors.primary,
        borderWidth: 2,
        borderRadius: 10,
        paddingHorizontal: 10,
        color: GlobalColors.primary,
        borderBottomWidth: 2,
    },

    eachRide: {
        marginTop: 5,
        backgroundColor: GlobalColors.tertiary,
        borderRadius: 10,
        paddingHorizontal: 8
    },
    rideItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 0,
        borderBottomColor: 'white',

    },
    rideDetails: {
        flex: 3,
    },
    rideText: {
        color: 'black',
    },
    InProgress: {
        flex: 1,
        backgroundColor: 'orange',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 35,
        marginVertical: 10,
        padding: 5
    },
    Completed: {
        flex: 1,
        backgroundColor: 'green',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 35,
        marginVertical: 10,
        padding: 5
    },
    Cancelled: {
        flex: 1,
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 35,
        marginVertical: 10,
        padding: 5
    },
    Booked: {
        flex: 1,
        backgroundColor: GlobalColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 35,
        marginVertical: 10,
        padding: 5
    },
    statusText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Add more styles as needed
});

export default MyRidesScreen;