import GlobalColors from "../styles/globalColors";
import { Bubble } from 'react-native-gifted-chat';

export default function MessageBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: GlobalColors.primary, // Customize the background color for outgoing messages
            padding: 5
          },
          left: {
            backgroundColor: GlobalColors.background, // Customize the background color for incoming messages
            padding: 5  
        },
        }}
      />
    );
}