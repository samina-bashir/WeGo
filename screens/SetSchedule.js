import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Icon } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';


const windowHeight = Dimensions.get('window').height;

const SetSchedule = ({ roundTripProp, scheduleProp, startDateProp, endDateProp, onScheduleSet, onClose }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [timePicker, setTimePicker] = useState(false);
    const [startDate, setStartDate] = useState(startDateProp);
    const [endDate, setEndDate] = useState(endDateProp);
    const [selectedButton, setSelectedButton] = useState(null);
    const [roundTrip, setRoundTrip] = useState(roundTripProp);
    const [schedule, setSchedule] = useState(scheduleProp); 
    const [selectedDay, setSelectedDay] = useState(null);

    const handleShowDatePicker = (buttonType) => {
        setSelectedButton(buttonType);
        setShowDatePicker(true);
    };

    const handleDateChange = (event, date) => {
        setShowDatePicker(false);
        if (event.type == 'set' && date) {
            setSelectedButton((prev) => (prev === 'start' ? setStartDate(date) : setEndDate(date)));
        }
    };
    const toggleDay = (index) => {
        const updatedSchedule = [...schedule];
        updatedSchedule[index] = { ...updatedSchedule[index], enabled: !updatedSchedule[index].enabled };
        setSchedule(updatedSchedule);
    };
    const getTimeRange = (type) => {
        let minTime, maxTime;
        const selectedSchedule = schedule[selectedDay];

        switch (type) {
            case 'Earliest':
                minTime = parseTimeStringToDateTime('00:00')
                maxTime = parseTimeStringToDateTime(selectedSchedule['Other']);
                break;
            case 'Other':
                minTime = parseTimeStringToDateTime(selectedSchedule['Earliest']);
                maxTime = parseTimeStringToDateTime(selectedSchedule['Return']);
                break;
            case 'Return':
                minTime = parseTimeStringToDateTime(selectedSchedule['Other']);
                maxTime = parseTimeStringToDateTime(selectedSchedule['Return Dropoff']);
                break;
            case 'Return Dropoff':
                minTime = parseTimeStringToDateTime(selectedSchedule['Return']);
                maxTime = parseTimeStringToDateTime('23:59')
                break;
            default:
                break;
        }
        console.log(maxTime, minTime)
        console.log(maxTime > minTime)
        return { minTime, maxTime };
    };

    const renderDays = () => {
        const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        console.log(schedule)
        console.log('ok')
        return daysOfWeek.map((day, index) => (
            <TouchableOpacity key={index} onPress={() => setSelectedDay(index)} activeOpacity={0.8} disabled={!schedule[index].enabled}>
                <View style={[styles.dayCard, selectedDay === index && styles.selectedDay]}>
                    <TouchableOpacity key={index} onPress={() => toggleDay(index)} activeOpacity={0.8}>
                        <View style={{ backgroundColor: schedule[index].enabled ? GlobalColors.primary : GlobalColors.secondary, borderRadius: 50, height: 35, width: 35, alignItems: 'center', justifyContent: 'center', marginRight: 5 }}>
                            <Text style={{ color: GlobalColors.background, textAlign: 'center' }}>{day}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.timeButtonsContainer}>
                        <TouchableOpacity style={[styles.timeButton, !schedule[index].enabled && styles.disabledButton]} onPress={() => showTimePicker(index, 'Earliest')}>
                            <Text style={[styles.selectedTimeText, !schedule[index].enabled && styles.disabledText]}>{schedule[index]['Earliest']}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.timeButton, !schedule[index].enabled && styles.disabledButton]} onPress={() => showTimePicker(index, 'Other')}>
                            <Text style={[styles.selectedTimeText, !schedule[index].enabled && styles.disabledText]}>{schedule[index]['Other']}</Text>
                        </TouchableOpacity>
                        {roundTrip && (
                            <>
                                <TouchableOpacity style={[styles.timeButton, !schedule[index].enabled && styles.disabledButton]} onPress={() => showTimePicker(index, 'Return')}>
                                    <Text style={[styles.selectedTimeText, !schedule[index].enabled && styles.disabledText]}>{schedule[index]['Return']}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.timeButton, !schedule[index].enabled && styles.disabledButton]} onPress={() => showTimePicker(index, 'Return Dropoff')}>
                                    <Text style={[styles.selectedTimeText, !schedule[index].enabled && styles.disabledText]}>{schedule[index]['Return Dropoff']}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        ));
    };

    const showTimePicker = (index, type) => {
        if (!schedule[index].enabled) return;
        setSelectedDay(index);
        setSelectedButton(type);
        setTimePicker(true);
    };

    const handleSetTime = (event, time) => {

        setTimePicker(false);
        console.log(selectedButton)
        const { minTime, maxTime } = getTimeRange(selectedButton);
        if (event.type === 'set' && time && time >= minTime && time <= maxTime) {
            const updatedSchedule = [...schedule];
            updatedSchedule[selectedDay] = { ...updatedSchedule[selectedDay], [selectedButton]: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setSchedule(updatedSchedule);

        } else {
            console.log('err')
            if (time < minTime || time > maxTime) {
                const minTimeString = minTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const maxTimeString = maxTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Show an alert for invalid time selection
                Alert.alert(
                    'Invalid Time',
                    `Please select a valid time between ${minTimeString} and ${maxTimeString}.`
                );
            }
        }
        console.log(schedule[0])
        setSelectedButton(null);
    };

    const handleSetSchedule = () => {
        if(!startDate || !endDate){
            Alert.alert(
                'Required Fields',
                `Please select a start date and end date for your request.`
            );
            return;
        }
        onScheduleSet(schedule, startDate, endDate, roundTrip);
    };

    const parseTimeStringToDateTime = (timeString) => {
        const [hours, minutes] = timeString.split(':'); // Split time string into hours and minutes
        const currentDate = new Date(); // Get current date
        currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0); // Set time to current date
        return currentDate;
    };
    return (
        <View style={styles.container}>
            <TouchableOpacity style={{ marginRight: 'auto', paddingHorizontal: 15 }} onPress={onClose}>
                <Icon name='times' type='font-awesome-5' size={28} color={GlobalColors.primary} />
            </TouchableOpacity>
            {/* <Text style={styles.title}>Set Schedule</Text>*/}
            <Text style={[styles.cardText, { marginVertical: 12 }]}>When do you want to be picked up?</Text>
            <View style={styles.dateContainer}>
                <TouchableOpacity style={styles.dateButton} onPress={() => handleShowDatePicker('start')}>
                    <Text style={styles.buttonText}>{startDate ? startDate.toDateString() : 'Start Date'}</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 30 }}>-</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => handleShowDatePicker('end')}>
                    <Text style={styles.buttonText}>{endDate ? endDate.toDateString() : 'End Date'}</Text>
                </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={styles.roundTripContainer}>
                    <Text style={styles.cardText}>Round Trip</Text>
                    <TouchableOpacity style={styles.checkBox} onPress={() => setRoundTrip(!roundTrip)}>
                        <Icon name={roundTrip ? 'check-square' : 'square'} type='font-awesome-5' size={24} color={GlobalColors.primary} />
                    </TouchableOpacity>
                </View>
                {showDatePicker && (
                    <DateTimePicker
                        value={selectedButton === 'start' ? startDate || new Date() : endDate || new Date()}
                        mode="datetime"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        minimumDate={selectedButton === 'start' ? new Date() : startDate}
                        maximumDate={selectedButton === 'end' ? new Date(Date.now() + 15552000000) : endDate}
                    />
                )}
                <View style={styles.scheduleContainer}>
                    <View style={styles.dayCard}>
                        <Text style={{ marginRight: 'auto' }}> </Text>
                        <View style={styles.timeTitleContainer}>
                            <Text style={styles.smallText}>Earliest Pickup</Text>

                            <Text style={styles.smallText}>Latest Dropoff</Text>
                            {roundTrip && (
                                <>
                                    <Text style={styles.smallText}>Return Pickup</Text>
                                    <Text style={styles.smallText}>Return Dropoff</Text>

                                </>
                            )}
                        </View>
                    </View>
                    {renderDays()}
                </View>
                {timePicker && (
                    <DateTimePicker
                        value={parseTimeStringToDateTime(schedule[selectedDay][selectedButton])}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleSetTime}
                    />
                )}
                <TouchableOpacity style={styles.setScheduleButton} onPress={handleSetSchedule}>
                    <Text style={styles.setScheduleButtonText}>Set Schedule</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
        paddingTop: 20,
        zIndex:190,
        height: windowHeight,
        backgroundColor: GlobalColors.background
    },
    title: {
        fontWeight: 'bold',
        fontSize: 30,
        color: GlobalColors.primary,
    },
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
});

export default SetSchedule;
