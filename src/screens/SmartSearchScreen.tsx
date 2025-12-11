import React from 'react';
import { 
  Search, 
  Chrome, 
  Youtube, 
  ShoppingBag, 
  Utensils, 
  ShoppingCart,
  Music,
  Image,
  Folder,
  Calculator,
  Calendar,
  Phone,
  MessageSquare,
  Map,
  Camera,
  Settings,
  Mail,
  Cloud,
  Gamepad2,
  BookOpen
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AppItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  category: 'search' | 'shopping' | 'food' | 'entertainment' | 'utilities' | 'communication';
}

const apps: AppItem[] = [
  // Search & Web
  { id: 'google', name: 'Google Search', icon: Chrome, color: 'text-blue-500', bgColor: 'bg-blue-500/10', category: 'search' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500', bgColor: 'bg-red-500/10', category: 'search' },
  
  // Shopping
  { id: 'amazon', name: 'Amazon', icon: ShoppingBag, color: 'text-orange-500', bgColor: 'bg-orange-500/10', category: 'shopping' },
  { id: 'flipkart', name: 'Flipkart', icon: ShoppingCart, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', category: 'shopping' },
  
  // Food Delivery
  { id: 'swiggy', name: 'Swiggy', icon: Utensils, color: 'text-orange-600', bgColor: 'bg-orange-600/10', category: 'food' },
  { id: 'zomato', name: 'Zomato', icon: Utensils, color: 'text-red-600', bgColor: 'bg-red-600/10', category: 'food' },
  { id: 'blinkit', name: 'Blinkit', icon: ShoppingCart, color: 'text-yellow-600', bgColor: 'bg-yellow-600/10', category: 'food' },
  { id: 'zepto', name: 'Zepto', icon: ShoppingCart, color: 'text-purple-500', bgColor: 'bg-purple-500/10', category: 'food' },
  
  // Entertainment
  { id: 'spotify', name: 'Spotify', icon: Music, color: 'text-green-500', bgColor: 'bg-green-500/10', category: 'entertainment' },
  { id: 'games', name: 'Games', icon: Gamepad2, color: 'text-pink-500', bgColor: 'bg-pink-500/10', category: 'entertainment' },
  { id: 'books', name: 'Books', icon: BookOpen, color: 'text-amber-600', bgColor: 'bg-amber-600/10', category: 'entertainment' },
  
  // Utilities
  { id: 'gallery', name: 'Gallery', icon: Image, color: 'text-purple-600', bgColor: 'bg-purple-600/10', category: 'utilities' },
  { id: 'files', name: 'Files', icon: Folder, color: 'text-blue-600', bgColor: 'bg-blue-600/10', category: 'utilities' },
  { id: 'calculator', name: 'Calculator', icon: Calculator, color: 'text-gray-500', bgColor: 'bg-gray-500/10', category: 'utilities' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, color: 'text-red-500', bgColor: 'bg-red-500/10', category: 'utilities' },
  { id: 'camera', name: 'Camera', icon: Camera, color: 'text-slate-600', bgColor: 'bg-slate-600/10', category: 'utilities' },
  { id: 'settings', name: 'Settings', icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-600/10', category: 'utilities' },
  { id: 'cloud', name: 'Cloud Storage', icon: Cloud, color: 'text-sky-500', bgColor: 'bg-sky-500/10', category: 'utilities' },
  
  // Communication
  { id: 'phone', name: 'Phone', icon: Phone, color: 'text-green-600', bgColor: 'bg-green-600/10', category: 'communication' },
  { id: 'messages', name: 'Messages', icon: MessageSquare, color: 'text-blue-500', bgColor: 'bg-blue-500/10', category: 'communication' },
  { id: 'mail', name: 'Email', icon: Mail, color: 'text-red-500', bgColor: 'bg-red-500/10', category: 'communication' },
  { id: 'maps', name: 'Maps', icon: Map, color: 'text-green-500', bgColor: 'bg-green-500/10', category: 'communication' },
];

const categories = [
  { id: 'search', label: 'Search & Web' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'food', label: 'Food & Groceries' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'communication', label: 'Communication' },
];

export const SmartSearchScreen: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleAppClick = (app: AppItem) => {
    toast({
      title: `Opening ${app.name}...`,
      description: "This will open the actual app in the full version of AURA.",
    });
  };

  const filteredApps = searchQuery
    ? apps.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : apps;

  const groupedApps = categories.reduce((acc, category) => {
    const categoryApps = filteredApps.filter(app => app.category === category.id);
    if (categoryApps.length > 0) {
      acc[category.id] = { label: category.label, apps: categoryApps };
    }
    return acc;
  }, {} as Record<string, { label: string; apps: AppItem[] }>);

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="p-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Smart Search</h1>
        </div>
        <p className="text-sm text-muted-foreground">Quick access to apps and services</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps and services..."
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        {/* Quick Actions */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-4">
            <p className="text-sm text-center text-muted-foreground mb-4">
              Say something like:
            </p>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">"Search for best restaurants nearby"</p>
              <p className="text-sm font-medium">"Order groceries from Blinkit"</p>
              <p className="text-sm font-medium">"Play music on Spotify"</p>
            </div>
          </CardContent>
        </Card>

        {/* Apps Grid by Category */}
        {Object.entries(groupedApps).map(([categoryId, { label, apps: categoryApps }]) => (
          <div key={categoryId}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{label}</h3>
            <div className="grid grid-cols-4 gap-3">
              {categoryApps.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn('p-3 rounded-xl', app.bgColor)}>
                      <Icon className={cn('w-6 h-6', app.color)} />
                    </div>
                    <span className="text-xs font-medium text-center line-clamp-1">{app.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* No Results */}
        {searchQuery && filteredApps.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No apps found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
