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
    width: 50,
    height: 50,
    borderRadius: 30,
    marginLeft: 10,
  },
  text: {
    marginLeft: 10,
    fontSize: 24,
    color: GlobalColors.background,
  }
  
});

export default styles;
