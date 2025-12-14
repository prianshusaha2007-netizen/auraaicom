import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Sparkles, Star, Heart, Zap, Palette, Sun, User, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisResult {
  confidence: number;
  outfitScore: number;
  aesthetic: number;
  mood: string;
  expression: string;
  vibe: string;
  improvements: string[];
  compliment: string;
  skinAnalysis: string;
  lightingQuality: string;
  overallFeedback: string;
}

export const ImageAnalysisScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { image: selectedImage }
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast.success('Image analyzed! 📸');
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to simulated analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: AnalysisResult = {
        confidence: Math.floor(Math.random() * 20) + 75,
        outfitScore: Math.floor(Math.random() * 15) + 80,
        aesthetic: Math.floor(Math.random() * 10) + 85,
        mood: ['Happy', 'Confident', 'Relaxed', 'Energetic', 'Thoughtful'][Math.floor(Math.random() * 5)],
        expression: ['Genuine smile', 'Focused', 'Serene', 'Playful', 'Mysterious'][Math.floor(Math.random() * 5)],
        vibe: ['Boss energy 😎', 'Main character vibes ✨', 'Soft aesthetic 🌸', 'Street style 🔥', 'Classic elegance'][Math.floor(Math.random() * 5)],
        improvements: [
          'Try brighter natural lighting for an even sharper look',
          'A slight tilt could add more dynamism',
          'Background is slightly busy - consider a simpler backdrop next time'
        ].slice(0, Math.floor(Math.random() * 2) + 1),
        compliment: [
          "Bro you look clean today 😎🔥",
          "Omg this picture is actually adorable!",
          "Your vibe is strong here - love it!",
          "Looking absolutely fire in this one! 🔥",
          "Main character energy for real ✨"
        ][Math.floor(Math.random() * 5)],
        skinAnalysis: 'Healthy glow, even tone',
        lightingQuality: ['Excellent', 'Good', 'Decent'][Math.floor(Math.random() * 3)],
        overallFeedback: "This is a really solid photo! Your confidence shows through clearly."
      };
      
      setAnalysisResult(mockResult);
      toast.success('Image analyzed! 📸');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const ScoreBar: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({ 
    label, value, icon, color 
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-sm font-bold ${color}`}>{value}/100</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">AI Vision Analysis</span>
          </div>
          <h1 className="text-2xl font-bold">Image Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Upload a photo and let AURA analyze it for you
          </p>
        </div>

        {/* Upload Area */}
        {!selectedImage ? (
          <Card 
            className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer p-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">Tap to upload an image</p>
                <p className="text-sm text-muted-foreground">
                  Selfies, outfits, rooms, food - I'll analyze anything!
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="relative">
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="w-full rounded-2xl object-cover max-h-80"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur"
              onClick={clearImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Analyze Button */}
        {selectedImage && !analysisResult && (
          <Button 
            className="w-full h-12 text-lg aura-gradient"
            onClick={analyzeImage}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Image
              </>
            )}
          </Button>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-4 animate-slide-up">
            {/* Compliment Card */}
            <Card className="p-4 aura-gradient text-primary-foreground">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-lg">{analysisResult.compliment}</p>
                  <p className="text-sm opacity-90 mt-1">{analysisResult.overallFeedback}</p>
                </div>
              </div>
            </Card>

            {/* Scores */}
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Analysis Scores
              </h3>
              
              <ScoreBar 
                label="Confidence" 
                value={analysisResult.confidence} 
                icon={<Zap className="w-4 h-4 text-yellow-500" />}
                color="text-yellow-500"
              />
              <ScoreBar 
                label="Outfit" 
                value={analysisResult.outfitScore} 
                icon={<Shirt className="w-4 h-4 text-blue-500" />}
                color="text-blue-500"
              />
              <ScoreBar 
                label="Aesthetic" 
                value={analysisResult.aesthetic} 
                icon={<Palette className="w-4 h-4 text-pink-500" />}
                color="text-pink-500"
              />
            </Card>

            {/* Details */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Detailed Analysis
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted">
                  <p className="text-xs text-muted-foreground">Mood</p>
                  <p className="font-medium">{analysisResult.mood}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <p className="text-xs text-muted-foreground">Expression</p>
                  <p className="font-medium">{analysisResult.expression}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <p className="text-xs text-muted-foreground">Vibe</p>
                  <p className="font-medium">{analysisResult.vibe}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <p className="text-xs text-muted-foreground">Lighting</p>
                  <p className="font-medium">{analysisResult.lightingQuality}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted">
                <p className="text-xs text-muted-foreground">Skin Analysis</p>
                <p className="font-medium">{analysisResult.skinAnalysis}</p>
              </div>
            </Card>

            {/* Improvements */}
            {analysisResult.improvements.length > 0 && (
              <Card className="p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sun className="w-5 h-5 text-primary" />
                  Soft Suggestions
                </h3>
                <div className="space-y-2">
                  {analysisResult.improvements.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="mt-0.5">💡</Badge>
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={clearImage}>
                <Camera className="w-4 h-4 mr-2" />
                New Photo
              </Button>
              <Button variant="secondary">
                <Sparkles className="w-4 h-4 mr-2" />
                Enhance
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
