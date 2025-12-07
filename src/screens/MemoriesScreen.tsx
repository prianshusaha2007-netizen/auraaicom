import React, { useState } from 'react';
import { Plus, Trash2, User, Briefcase, Heart, Calendar, BookOpen, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ElementType> = {
  personal: User,
  work: Briefcase,
  hobbies: Heart,
  dates: Calendar,
  notes: BookOpen,
  phrases: MessageSquare,
};

const categoryColors: Record<string, string> = {
  personal: 'text-blue-500 bg-blue-500/10',
  work: 'text-orange-500 bg-orange-500/10',
  hobbies: 'text-pink-500 bg-pink-500/10',
  dates: 'text-purple-500 bg-purple-500/10',
  notes: 'text-yellow-500 bg-yellow-500/10',
  phrases: 'text-green-500 bg-green-500/10',
};

export const MemoriesScreen: React.FC = () => {
  const { userProfile, memories, addMemory, deleteMemory } = useAura();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('notes');
  const [newContent, setNewContent] = useState('');

  const handleAddMemory = () => {
    if (!newContent.trim()) return;
    addMemory({ category: newCategory, content: newContent.trim() });
    setNewContent('');
    setIsDialogOpen(false);
  };

  const profileMemories = [
    { icon: User, label: 'Name', value: userProfile.name || 'Not set', color: 'text-primary' },
    { icon: Calendar, label: 'Age', value: userProfile.age || 'Not set', color: 'text-accent' },
    { icon: Briefcase, label: 'Profession', value: userProfile.profession || 'Not set', color: 'text-orange-500' },
  ];

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold aura-gradient-text">Memories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything AURA remembers about you
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-card rounded-2xl p-4 mb-6 border border-border/50">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">YOUR PROFILE</h2>
        <div className="grid grid-cols-3 gap-3">
          {profileMemories.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center">
                <div className={cn('inline-flex p-2 rounded-xl bg-muted/50 mb-2', item.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium truncate">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Memory Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4 rounded-xl aura-gradient">
            <Plus className="w-4 h-4 mr-2" />
            Add Memory
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal Info</SelectItem>
                <SelectItem value="work">Work Related</SelectItem>
                <SelectItem value="hobbies">Hobbies & Interests</SelectItem>
                <SelectItem value="dates">Important Dates</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="phrases">Frequent Phrases</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What should AURA remember?"
              className="rounded-xl"
            />
            <Button onClick={handleAddMemory} className="w-full rounded-xl aura-gradient">
              Save Memory
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Memories List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {memories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No memories saved yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add things you want AURA to remember
            </p>
          </div>
        ) : (
          memories.map((memory) => {
            const Icon = categoryIcons[memory.category] || BookOpen;
            const colorClass = categoryColors[memory.category] || 'text-primary bg-primary/10';
            
            return (
              <div
                key={memory.id}
                className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border/50 animate-fade-in"
              >
                <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground capitalize mb-1">
                    {memory.category.replace('_', ' ')}
                  </p>
                  <p className="text-sm">{memory.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMemory(memory.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
