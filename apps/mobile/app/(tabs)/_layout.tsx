import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { HeaderProfileButton } from '@/components';
import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

interface TabBarIconProps {
  name: IconName;
  color: string;
}

function TabBarIcon({ name, color }: TabBarIconProps) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} name={name} color={color} />;
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.primary,
        },
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerShadowVisible: false,
        headerRight: () => <HeaderProfileButton />,
      }}
    >
      <Tabs.Screen
        name="activity"
        options={{
          title: t('tabs.activity'),
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: t('tabs.insights'),
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="recurring"
        options={{
          title: t('tabs.recurring'),
          tabBarIcon: ({ color }) => <TabBarIcon name="refresh" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
