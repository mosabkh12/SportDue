import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/theme';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 18,
    marginBottom: 10,
  },
  note: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PlayerDetailsScreen;



