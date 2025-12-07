import React, { useState } from 'react';
import { AuraProvider, useAura } from '@/contexts/AuraContext';
import { NavigationBar } from '@/components/NavigationBar';
import { ChatScreen } from '@/screens/ChatScreen';
import { MemoriesScreen } from '@/screens/MemoriesScreen';
import { RoutineScreen } from '@/screens/RoutineScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';

const AppContent: React.FC = () => {
  const { userProfile } = useAura();
  const [activeTab, setActiveTab] = useState('chat');

  if (!userProfile.onboardingComplete) {
    return <OnboardingScreen />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatScreen />;
      case 'memories':
        return <MemoriesScreen />;
      case 'routine':
        return <RoutineScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 overflow-hidden">
        {renderScreen()}
      </main>
      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

const Index = () => {
  return (
    <AuraProvider>
      <AppContent />
    </AuraProvider>
  );
};

export default Index;
