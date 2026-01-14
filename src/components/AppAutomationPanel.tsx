import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Instagram, Linkedin, Music2, Youtube, Chrome,
  MapPin, Calendar, Camera, Phone, ShoppingCart, Send, Play, Pause,
  Search, MousePointer, Check, X, Loader2, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAccessibilityService, SUPPORTED_APPS, AppId } from '@/hooks/useAccessibilityService';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AppAutomationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const appIcons: Partial<Record<AppId, React.ReactNode>> = {
  whatsapp: <MessageSquare className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  spotify: <Music2 className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  chrome: <Chrome className="w-5 h-5" />,
  maps: <MapPin className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  camera: <Camera className="w-5 h-5" />,
  messages: <MessageSquare className="w-5 h-5" />,
  blinkit: <ShoppingCart className="w-5 h-5" />,
  swiggy: <ShoppingCart className="w-5 h-5" />,
  zepto: <ShoppingCart className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  contacts: <Phone className="w-5 h-5" />,
};

const AppAutomationPanel: React.FC<AppAutomationPanelProps> = ({ open, onOpenChange }) => {
  const {
    serviceState,
    executionLog,
    openApp,
    searchInApp,
    sendMessage,
    playSpotify,
    controlMedia,
    clearLog,
    isNative,
  } = useAccessibilityService();

  const [searchQuery, setSearchQuery] = useState('');
  const [messageContact, setMessageContact] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleOpenApp = async (appId: AppId) => {
    setIsExecuting(true);
    await openApp(appId);
    setIsExecuting(false);
  };

  const handleSearch = async (appId: AppId) => {
    if (!searchQuery.trim()) return;
    setIsExecuting(true);
    await openApp(appId);
    await new Promise(r => setTimeout(r, 1000));
    await searchInApp(searchQuery);
    setSearchQuery('');
    setIsExecuting(false);
  };

  const handleSendMessage = async () => {
    if (!messageContact.trim() || !messageText.trim()) return;
    setIsExecuting(true);
    await sendMessage(messageContact, messageText);
    setMessageContact('');
    setMessageText('');
    setIsExecuting(false);
  };

  const handlePlayMusic = async (query?: string) => {
    setIsExecuting(true);
    await playSpotify(query);
    setIsExecuting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MousePointer className="w-4 h-4 text-primary" />
            </div>
            App Automation
          </DialogTitle>
        </DialogHeader>

        {/* Status indicator */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
          <div className={`w-2 h-2 rounded-full ${serviceState.isEnabled ? 'bg-green-500' : isNative ? 'bg-yellow-500' : 'bg-blue-500'}`} />
          <span className="text-muted-foreground">
            {serviceState.isEnabled 
              ? 'Accessibility Service Active' 
              : isNative 
              ? 'Enable Accessibility for full control' 
              : 'Running in simulation mode (web)'}
          </span>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(SUPPORTED_APPS) as AppId[]).slice(0, 8).map((appId) => (
                  <Button
                    key={appId}
                    variant="outline"
                    size="sm"
                    className="flex flex-col h-16 gap-1"
                    onClick={() => handleOpenApp(appId)}
                    disabled={isExecuting}
                  >
                    {appIcons[appId] || <Smartphone className="w-5 h-5" />}
                    <span className="text-[10px] truncate">{SUPPORTED_APPS[appId].name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Search in App */}
            <div>
              <h3 className="text-sm font-medium mb-2">Search in App</h3>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Search query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['instagram', 'youtube', 'linkedin', 'chrome'] as AppId[]).map((appId) => (
                  <Button
                    key={appId}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSearch(appId)}
                    disabled={isExecuting || !searchQuery.trim()}
                  >
                    <Search className="w-3 h-3 mr-1" />
                    {SUPPORTED_APPS[appId].name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Send Message */}
            <div>
              <h3 className="text-sm font-medium mb-2">Send Message</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Contact name..."
                  value={messageContact}
                  onChange={(e) => setMessageContact(e.target.value)}
                />
                <Input
                  placeholder="Message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isExecuting || !messageContact.trim() || !messageText.trim()}
                  className="w-full"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send via WhatsApp
                </Button>
              </div>
            </div>

            {/* Music Controls */}
            <div>
              <h3 className="text-sm font-medium mb-2">Spotify</h3>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlayMusic()}
                  disabled={isExecuting}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => controlMedia('pause')}
                  disabled={isExecuting}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlayMusic('focus music')}
                  disabled={isExecuting}
                >
                  <Music2 className="w-4 h-4 mr-1" />
                  Focus Mode
                </Button>
              </div>
            </div>

            {/* Execution Log */}
            <AnimatePresence>
              {executionLog.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Execution Log</h3>
                    <Button variant="ghost" size="sm" onClick={clearLog}>
                      Clear
                    </Button>
                  </div>
                  <Card className="p-3 bg-black/50 font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
                    {executionLog.map((log, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {log.startsWith('✓') ? (
                          <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : log.startsWith('✗') ? (
                          <X className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Loader2 className="w-3 h-3 text-primary animate-spin mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-muted-foreground">{log.replace(/^[✓✗]\s*/, '')}</span>
                      </div>
                    ))}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {isNative 
              ? 'AURRA will control apps on your device' 
              : 'Install the Android APK for full automation capabilities'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppAutomationPanel;
