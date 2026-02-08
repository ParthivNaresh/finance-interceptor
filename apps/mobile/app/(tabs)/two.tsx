import { Text, View } from '@/components/Themed';
import { activityStyles } from '@/features/tabs';

export default function ActivityScreen() {
  return (
    <View style={activityStyles.container}>
      <Text style={activityStyles.title}>Activity</Text>
      <View
        style={activityStyles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Text style={activityStyles.placeholder}>
        Your transaction activity will appear here once you connect a bank account.
      </Text>
    </View>
  );
}
