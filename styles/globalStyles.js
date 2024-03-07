import { StyleSheet } from 'react-native';
import GlobalColors from './globalColors';

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    backgroundColor: GlobalColors.secondary,
    flex:1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: GlobalColors.primary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 30,
    marginLeft: 10,
  },
  text: {
    marginLeft: 10,
    fontSize: 20,
    color: GlobalColors.background,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  chatIcon: {
    padding: 16,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 3,
  },
  rideDetails: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20, // Rounded corners at the top
    borderTopRightRadius: 20, // Rounded corners at the top
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 240, // Initial height
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: -3 }, // Shadow at the top
    shadowRadius: 4,
    elevation: 3,
  },
  drawerIndicator: {
    width: 40,
    height: 6,
    backgroundColor: 'lightgray',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 8,
  },
  locationText: {
    fontSize: 16,
    marginBottom: 8,
  },
  rideInfo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
  callChatIcons: {
    flexDirection: 'column',
    padding: 10,
    float: 'right',
    justifyContent: 'space-between'
  },
  iconButton: {
    padding: 10,
    borderRadius: 100,
    marginVertical: 5,
    backgroundColor: GlobalColors.secondary
  },
  detailsAndFareContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  detailsContainer: {
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callChatIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  blueText: {
    color: 'blue',
    fontSize: 16,
  },
  overlay: {
    width: 300,
    height: 400,
  },
  row: {
    flexDirection: 'row',
  },
  leftCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  rightCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  name: {
    fontSize: 19,
    fontWeight: 'bold',
    paddingHorizontal:10,
    marginVertical: 10
  },
  fare: {
    fontSize: 25,
    marginLeft: 'auto',
    fontWeight: 'bold',
    paddingHorizontal: 15
  },
  button: {
    backgroundColor: GlobalColors.primary,
    padding: 5,
    marginTop: 5,
    alignItems: 'flex-start', 
    flexWrap: 'wrap' ,
    position: 'absolute',
    top:0,
    right: 0,
    textAlign: 'center'

  },
  feedback: {
    fontSize: 16,
    fontStyle: 'italic',
    color: GlobalColors.primary,
    paddingHorizontal:10,
    paddingBottom: 5
  },
  divider: {
    height: 1,
    backgroundColor: GlobalColors.lightGray,
    marginBottom: 5,
    marginVertical: 15
  },
  input: {
    borderBottomWidth:0
  }
});

export default styles;
