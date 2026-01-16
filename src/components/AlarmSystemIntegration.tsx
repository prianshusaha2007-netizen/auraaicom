import React, { useState, useEffect } from 'react';
import AlarmTriggerModal from '@/components/AlarmTriggerModal';
import { useAlarmSystem, Alarm } from '@/hooks/useAlarmSystem';

const AlarmSystemIntegration: React.FC = () => {
  const { 
    pendingAlarms, 
    executeAlarm, 
    updateAlarm, 
    determineAdaptiveMode 
  } = useAlarmSystem();
  
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);

  // Watch for pending alarms and trigger modal
  useEffect(() => {
    if (pendingAlarms.length > 0 && !alarmModalOpen) {
      const nextAlarm = pendingAlarms[0];
      setActiveAlarm(nextAlarm);
      setAlarmModalOpen(true);
    }
  }, [pendingAlarms, alarmModalOpen]);

  const handleAlarmApprove = async () => {
    if (activeAlarm) {
      await executeAlarm(activeAlarm, true);
      setAlarmModalOpen(false);
      setActiveAlarm(null);
    }
  };

  const handleAlarmSnooze = async (minutes: number) => {
    if (activeAlarm) {
      const newScheduledAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      await updateAlarm(activeAlarm.id, { scheduled_at: newScheduledAt });
      setAlarmModalOpen(false);
      setActiveAlarm(null);
    }
  };

  const handleAlarmSkip = async () => {
    if (activeAlarm) {
      await updateAlarm(activeAlarm.id, { is_active: false });
      setAlarmModalOpen(false);
      setActiveAlarm(null);
    }
  };

  return (
    <AlarmTriggerModal
      alarm={alarmModalOpen ? activeAlarm : null}
      onApprove={handleAlarmApprove}
      onSnooze={handleAlarmSnooze}
      onSkip={handleAlarmSkip}
      onClose={() => setAlarmModalOpen(false)}
      adaptiveMode={activeAlarm ? determineAdaptiveMode(activeAlarm) : 'ring_ask_execute'}
    />
  );
};

export default AlarmSystemIntegration;
