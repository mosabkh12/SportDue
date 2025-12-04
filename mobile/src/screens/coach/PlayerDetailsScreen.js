import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../styles/screens/PlayerDetailsScreen.styles';

const PlayerDetailsScreen = ({ route }) => {
  const { playerId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Player Details Screen</Text>
      <Text style={styles.text}>Player ID: {playerId}</Text>
      <Text style={styles.note}>This screen will be fully implemented with player management features.</Text>
    </View>
  );
};


export default PlayerDetailsScreen;



