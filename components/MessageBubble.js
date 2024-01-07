import GlobalColors from "../styles/globalColors";
import { Bubble } from 'react-native-gifted-chat';

export default function MessageBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: GlobalColors.primary, 
            padding: 5
          },
          left: {
            backgroundColor: GlobalColors.background, 
            padding: 5  
        },
        }}
      />
    );
}