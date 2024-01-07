import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import GlobalColors from '../styles/globalColors';
import { TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

const ErrorModal = ({ close }) => (
  <Modal transparent>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Icon
          name="times-circle"
          type="font-awesome-5"
          color={GlobalColors.error}
          size={60}
          style={styles.icon}
        />
        <Text style={styles.title}>Verification Unsuccessful</Text>
        <Text style={styles.message}>
          You have entered incorrect OTP. 
        </Text>
        <Text style={styles.message}>You can Try Again to get another OTP.</Text>
        <TouchableOpacity style={styles.button} onPress={close}>
          <Text style={styles.buttonText}>Try Again</Text>
          <Icon
            name="redo"
            type="font-awesome-5"
            color={GlobalColors.background}
            size={20}
            style={styles.iconRight}
          />
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
  },
  icon: {
    marginHorizontal: 10,
  },
  title: {
    fontSize: 18,
    color: GlobalColors.error,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  button: {
    backgroundColor: GlobalColors.error,
    padding: 10,
    paddingLeft: 30,
    marginVertical: 10,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    paddingRight: 20,
  },
  iconRight: {
    marginLeft: 'auto',
  },
});

export default ErrorModal;