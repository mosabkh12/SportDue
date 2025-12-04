import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/theme';

const AttendanceScreen = ({ route }) => {
  const { groupId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Attendance Screen</Text>
      <Text style={styles.text}>Group ID: {groupId}</Text>
      <Text style={styles.note}>This screen will be fully implemented with attendance management features.</Text>
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

export default AttendanceScreen;



