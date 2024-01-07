import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import GlobalColors from '../styles/globalColors';
import { TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

const SuccessModal = ({ close }) => (
  <Modal transparent>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Icon
          name="check-circle"
          type="font-awesome-5"
          color={GlobalColors.primary}
          size={60}
          style={styles.icon}
        />
        <Text style={styles.title}>Verification Successful</Text>
        <Text style={styles.message}>
          Your email has been successfully verified.
        </Text>
        <Text style={styles.message}>Happy Carpooling!</Text>
        <TouchableOpacity style={styles.button} onPress={close}>
          <Text style={styles.buttonText}>Continue to App</Text>
          <Icon
            name="long-arrow-alt-right"
            type="font-awesome-5"
            color={GlobalColors.background}
            size={24}
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
    padding: 20,
    borderRadius: 10,
  },
  icon: {
    marginHorizontal: 10,
  },
  title: {
    fontSize: 18,
    color: GlobalColors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  button: {
    backgroundColor: GlobalColors.primary,
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

export default SuccessModal;