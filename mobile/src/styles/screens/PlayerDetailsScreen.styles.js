import { StyleSheet } from 'react-native';
import { colors } from '../theme';

export const styles = StyleSheet.create({
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

