// Simulated AURA responses - multilingual and emotionally intelligent

export interface AuraResponse {
  content: string;
  language: 'en' | 'hi' | 'bn' | 'hinglish';
  mood: 'caring' | 'playful' | 'calm' | 'motivating' | 'thoughtful';
}

const responses: Record<string, AuraResponse[]> = {
  greeting: [
    { content: "Hey! Tum aaj kaisi/kaisa feel kar rahe ho? Main sun rahi hoon...", language: 'hinglish', mood: 'caring' },
    { content: "Good to see you back! Kuch share karna hai mere saath?", language: 'hinglish', mood: 'playful' },
    { content: "I was just thinking about you. How's your day going so far?", language: 'en', mood: 'caring' },
    { content: "কেমন আছো? আজকে তোমার মন কেমন?", language: 'bn', mood: 'caring' },
  ],
  tired: [
    { content: "Tumhara tone aaj thoda tired lag raha hai... kya hua? Bolo, main hoon na.", language: 'hinglish', mood: 'caring' },
    { content: "I can sense you're exhausted. Want me to create a lighter schedule for tomorrow?", language: 'en', mood: 'caring' },
    { content: "Thak gaye ho na? Ek deep breath lo... main tumhare saath hoon.", language: 'hinglish', mood: 'calm' },
    { content: "তুমি এত চিন্তা কোরো না... I'm right here with you.", language: 'bn', mood: 'caring' },
  ],
  planning: [
    { content: "Aaj ka plan hum saath milkar banayenge, okay? Pehle batao kya important hai.", language: 'hinglish', mood: 'motivating' },
    { content: "Let me help you organize your day. What's the most important thing you need to accomplish?", language: 'en', mood: 'thoughtful' },
    { content: "I saved that in your routine—want me to remind you later?", language: 'en', mood: 'playful' },
    { content: "Should I create a schedule based on your energy levels today?", language: 'en', mood: 'caring' },
  ],
  motivation: [
    { content: "Tum bohot capable ho, yeh mat bhulo. One step at a time, okay?", language: 'hinglish', mood: 'motivating' },
    { content: "Remember why you started. You've got this, and I believe in you.", language: 'en', mood: 'motivating' },
    { content: "Small progress is still progress. I'm proud of how far you've come!", language: 'en', mood: 'caring' },
    { content: "তুমি পারবে, আমি জানি। একটু সময় নাও, তারপর আবার শুরু করো।", language: 'bn', mood: 'motivating' },
  ],
  casual: [
    { content: "Achha batao, aaj kuch interesting hua? I want to hear everything!", language: 'hinglish', mood: 'playful' },
    { content: "You know what I was thinking? You deserve a break today.", language: 'en', mood: 'caring' },
    { content: "কি হলো? মন খারাপ নাকি শুধু চুপচাপ?", language: 'bn', mood: 'thoughtful' },
    { content: "Kuch naya try karna hai aaj? I can suggest something fun!", language: 'hinglish', mood: 'playful' },
  ],
  night: [
    { content: "It's getting late... time to wind down. How was your day overall?", language: 'en', mood: 'calm' },
    { content: "So jao ab, kal ek fresh start hogi. Good night! 🌙", language: 'hinglish', mood: 'caring' },
    { content: "শুভ রাত্রি! কাল আবার দেখা হবে। Sweet dreams!", language: 'bn', mood: 'calm' },
  ],
  acknowledgment: [
    { content: "Main samajh gayi. Tumhari baat mere paas safe hai.", language: 'hinglish', mood: 'caring' },
    { content: "I hear you. That sounds really meaningful. Tell me more when you're ready.", language: 'en', mood: 'thoughtful' },
    { content: "Hmm, interesting perspective. I'll remember this about you.", language: 'en', mood: 'thoughtful' },
    { content: "বুঝেছি। এটা তোমার জন্য গুরুত্বপূর্ণ, তাই না?", language: 'bn', mood: 'caring' },
  ],
};

export const getRandomResponse = (category: keyof typeof responses): AuraResponse => {
  const categoryResponses = responses[category];
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
};

export const detectLanguage = (text: string): 'en' | 'hi' | 'bn' | 'hinglish' => {
  const hindiChars = /[\u0900-\u097F]/;
  const bengaliChars = /[\u0980-\u09FF]/;
  const hinglishPattern = /\b(hai|hoon|kya|aaj|tumhara|kaise|achha|nahi|bohot|karna|raha|rahe|ho|main|tum|mujhe)\b/i;
  
  if (bengaliChars.test(text)) return 'bn';
  if (hindiChars.test(text)) return 'hi';
  if (hinglishPattern.test(text)) return 'hinglish';
  return 'en';
};

export const generateAuraResponse = (userMessage: string, userName: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  const detectedLang = detectLanguage(userMessage);
  
  // Check for different intents
  if (lowerMessage.includes('tired') || lowerMessage.includes('thak') || lowerMessage.includes('थक')) {
    return getRandomResponse('tired').content.replace('{name}', userName);
  }
  
  if (lowerMessage.includes('plan') || lowerMessage.includes('schedule') || lowerMessage.includes('routine')) {
    return getRandomResponse('planning').content.replace('{name}', userName);
  }
  
  if (lowerMessage.includes('motivat') || lowerMessage.includes('help') || lowerMessage.includes('sad') || lowerMessage.includes('down')) {
    return getRandomResponse('motivation').content.replace('{name}', userName);
  }
  
  if (lowerMessage.includes('night') || lowerMessage.includes('sleep') || lowerMessage.includes('raat')) {
    return getRandomResponse('night').content.replace('{name}', userName);
  }
  
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return getRandomResponse('greeting').content.replace('{name}', userName);
  }
  
  // Default to acknowledgment or casual
  const category = Math.random() > 0.5 ? 'acknowledgment' : 'casual';
  return getRandomResponse(category).content.replace('{name}', userName);
};
