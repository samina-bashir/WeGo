import React, { useState } from 'react';
import { Icon, Overlay, Rating, Avatar, Input } from 'react-native-elements';
import styles from "../styles/globalStyles";
import GlobalColors from "../styles/globalColors";
import { View, Text, Button, TouchableOpacity, Animated } from 'react-native';
export default function Feedback(props) {
  const [message, setMessage] = useState('');
  return (<Overlay
    isVisible={true}
    overlayStyle={styles.overlay}
  >
    <View style={styles.column}>
      <View style={styles.column}>
        <Text style={styles.name}>{props.names[0]}</Text>
        <Text style={{marginRight: 'auto', paddingLeft:10}}>Rs. {props.fare[0]}</Text>
        <TouchableOpacity style={[{borderRadius:10},styles.button]}>
          <Text style={{color:GlobalColors.background, margin:5}}>Fare Received</Text>
        </TouchableOpacity>
        <Rating
          type="star"
          imageSize={20}
          onFinishRating={(rating) => console.log(`Rating: ${rating}`)}
          style={{marginTop:5}}
        />
        <Text style={styles.feedback}>feedback</Text>
        <Input
          placeholder="How was the Rider?"
          value={message}
          onChangeText={(text) => setMessage(text)}
          rightIcon={

            <Icon
              name="send"
              type="material"
              color={GlobalColors.primary}
              size={25}
            />

          }
        />
      </View>
      <View style={styles.divider}></View>
      <View style={styles.column}>
        <Text style={styles.name}>{props.names[1]}</Text>
        <Text style={{marginRight:'auto', paddingLeft:10}}>Rs. {props.fare[1]}</Text>
        <TouchableOpacity style={[{borderRadius:10},styles.button]}>
          <Text style={{color:GlobalColors.background, margin:5}}>Fare Received</Text>
        </TouchableOpacity>
        <Rating
          type="star"
          imageSize={20}
          onFinishRating={(rating) => console.log(`Rating: ${rating}`)}
          style={{marginTop:5}}
          
        />
        <Text style={styles.feedback}>feedback</Text>
        <Input
          placeholder="How was the Rider?"
          value={message}
          onChangeText={(text) => setMessage(text)}
          rightIcon={

            <Icon
              name="send"
              type="material"
              color={GlobalColors.primary}
              size={25}
            />

          }
        />
      </View>
    </View>
  </Overlay>
  )
};