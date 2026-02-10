import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import { Text, View } from '@/components';
import { spacing } from '@/styles';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text style={styles.version}>Finance Interceptor v0.1.0</Text>
      <Text style={styles.description}>
        Proactive financial monitoring that detects subscription price increases and lifestyle creep.
      </Text>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: spacing.lg,
    height: 1,
    width: '80%',
  },
  version: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
});
