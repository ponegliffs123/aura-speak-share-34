import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const PushNotificationPrompt: React.FC = () => {
  const { permission, isSupported, requestPermission, canShowNotifications } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show prompt if notifications are supported but not granted and not previously dismissed
    const dismissed = localStorage.getItem('notificationPromptDismissed');
    if (isSupported && permission === 'default' && !dismissed) {
      // Delay showing the prompt to avoid overwhelming the user immediately
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  if (!isVisible || canShowNotifications || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                Stay Connected
              </h3>
              <p className="text-xs text-white/90 mb-3">
                Enable notifications to receive messages even when the app is closed
              </p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleEnable}
                  className="bg-white text-purple-600 hover:bg-white/90 text-xs"
                >
                  Enable
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/20 text-xs"
                >
                  Later
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              className="h-6 w-6 text-white hover:bg-white/20 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationPrompt;