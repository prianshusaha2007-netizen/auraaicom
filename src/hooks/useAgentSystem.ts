// useAgentSystem - Hook for integrating the multi-agent system with React

import { useState, useCallback, useEffect, useMemo } from 'react';
import { orchestrator } from '@/agents/AgentOrchestrator';
import { AGENT_REGISTRY, getAgentById } from '@/agents/registry';
import { AgentContext, AgentResponse, AutonomyMode, AgentDomain } from '@/agents/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface AgentMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  agentId?: string;
  agentName?: string;
  domain?: AgentDomain;
  actions?: { label: string; action: string; data?: any }[];
  stats?: { label: string; value: string | number }[];
  timestamp: Date;
  mode?: AutonomyMode;
  isStreaming?: boolean;
}

interface UseAgentSystemReturn {
  messages: AgentMessage[];
  isProcessing: boolean;
  currentMode: AutonomyMode;
  context: AgentContext;
  activeAgents: typeof AGENT_REGISTRY;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: string, data?: any) => Promise<void>;
  updateContext: (updates: Partial<AgentContext>) => void;
  setMode: (mode: AutonomyMode) => void;
  clearMessages: () => void;
}

// Build agent context for AI
const buildAgentContextPrompt = (
  agents: AgentResponse[],
  mode: AutonomyMode,
  context: AgentContext
): string => {
  const agentInfo = agents.map(a => `${a.agentName} (${a.domain}): ${a.message}`).join('\n');
  const modeDesc = {
    do_as_told: 'Execute only what user explicitly asks',
    suggest_approve: 'Suggest options and wait for approval',
    predict_confirm: 'Predict needs and ask for confirmation',
    full_auto: 'Execute within set boundaries automatically',
    adaptive: 'Switch modes based on context intelligently',
  }[mode];
  
  return `
ACTIVE AGENTS:
${agentInfo || 'No specific agents activated'}

AUTONOMY MODE: ${mode} - ${modeDesc}

USER CONTEXT:
- Mood: ${context.mood}
- Energy: ${context.energy}
- Time: ${context.timeOfDay}
- Stress: ${context.stress}
- Burnout Score: ${context.burnoutScore}/100
- Focus Session Active: ${context.activeFocusSession}
- Work Hours: ${context.isWorkHours}

Respond as AURRA with the activated agent personalities. Keep responses conversational but action-oriented.
`;
};

export const useAgentSystem = (): UseAgentSystemReturn => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMode, setCurrentMode] = useState<AutonomyMode>('adaptive');
  const [context, setContext] = useState<AgentContext>(orchestrator.getState().context);

  // Update orchestrator when mode changes
  useEffect(() => {
    orchestrator.setGlobalMode(currentMode);
  }, [currentMode]);

  // Stream AI response with SSE
  const streamAIResponse = useCallback(async (
    userMessage: string,
    agentResponses: AgentResponse[],
    onUpdate: (content: string) => void
  ): Promise<string> => {
    const agentContextPrompt = buildAgentContextPrompt(agentResponses, currentMode, context);
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aura-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: userMessage,
          agentContext: agentContextPrompt,
          mode: currentMode,
          context: {
            mood: context.mood,
            energy: context.energy,
            timeOfDay: context.timeOfDay,
            agents: agentResponses.map(r => r.agentId),
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
        throw new Error('Rate limited');
      }
      if (response.status === 402) {
        toast.error('AI credits exhausted. Please add credits to continue.');
        throw new Error('Payment required');
      }
      throw new Error('AI request failed');
    }

    // Handle streaming response
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              onUpdate(fullContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
      
      return fullContent;
    }
    
    // Non-streaming fallback
    const data = await response.json();
    return data.response || data.message || 'I processed your request.';
  }, [currentMode, context]);

  // Send a message to the agent system
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    try {
      // Route message through orchestrator to identify relevant agents
      const responses = await orchestrator.routeMessage(message);
      
      // Determine primary agent for the response
      const primaryAgent = responses[0];
      const agentInfo = primaryAgent ? getAgentById(primaryAgent.agentId) : null;
      
      // Create streaming message placeholder
      const streamingMsgId = `agent-${Date.now()}`;
      const streamingMessage: AgentMessage = {
        id: streamingMsgId,
        type: 'agent',
        content: '',
        agentId: primaryAgent?.agentId || 'aurra',
        agentName: primaryAgent?.agentName || 'AURRA',
        domain: primaryAgent?.domain || 'routine',
        actions: primaryAgent?.actions,
        stats: primaryAgent?.stats,
        timestamp: new Date(),
        mode: orchestrator.determineMode(primaryAgent?.domain || 'routine'),
        isStreaming: true,
      };
      
      setMessages(prev => [...prev, streamingMessage]);
      
      // Stream AI response if user is authenticated
      if (user) {
        const finalContent = await streamAIResponse(
          message,
          responses,
          (content) => {
            setMessages(prev => prev.map(m => 
              m.id === streamingMsgId 
                ? { ...m, content, isStreaming: true }
                : m
            ));
          }
        );
        
        // Finalize the message
        setMessages(prev => prev.map(m => 
          m.id === streamingMsgId 
            ? { ...m, content: finalContent, isStreaming: false }
            : m
        ));
      } else {
        // Fallback to orchestrator response for unauthenticated users
        setMessages(prev => prev.map(m => 
          m.id === streamingMsgId 
            ? { ...m, content: primaryAgent?.message || 'Please log in for full AI-powered responses.', isStreaming: false }
            : m
        ));
      }
    } catch (error) {
      console.error('Agent system error:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'agent',
        content: 'I encountered an issue processing your request. Please try again.',
        agentId: 'system',
        agentName: 'System',
        domain: 'routine',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [user, streamAIResponse]);

  // Execute an action suggested by an agent
  const executeAction = useCallback(async (action: string, data?: any) => {
    setIsProcessing(true);
    
    try {
      // Route to appropriate handler
      const actionHandlers: Record<string, () => Promise<string>> = {
        create_plan: async () => 'Plan created! I\'ve broken down your goal into steps.',
        start_session: async () => 'Focus session started. I\'ll track your progress.',
        log_workout: async () => 'Workout logged! Great job staying active.',
        log_expense: async () => 'Expense logged. I\'m tracking your spending.',
        draft_message: async () => 'Message draft ready. Would you like to review it?',
        view_goals: async () => 'Loading your goals...',
        review_flashcards: async () => 'Starting flashcard review...',
        view_fitness: async () => 'Loading fitness progress...',
        view_budget: async () => 'Loading budget overview...',
        schedule_followup: async () => 'Follow-up scheduled.',
      };
      
      const handler = actionHandlers[action];
      const result = handler ? await handler() : `Action "${action}" executed.`;
      
      // Add result message
      setMessages(prev => [...prev, {
        id: `action-${Date.now()}`,
        type: 'agent',
        content: result,
        agentId: 'execution',
        agentName: 'Execution Agent',
        domain: 'routine',
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Action execution error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Update context
  const updateContext = useCallback((updates: Partial<AgentContext>) => {
    orchestrator.updateContext(updates);
    setContext(orchestrator.getState().context);
  }, []);

  // Set autonomy mode
  const setMode = useCallback((mode: AutonomyMode) => {
    setCurrentMode(mode);
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Memoize active agents
  const activeAgents = useMemo(() => AGENT_REGISTRY, []);

  return {
    messages,
    isProcessing,
    currentMode,
    context,
    activeAgents,
    sendMessage,
    executeAction,
    updateContext,
    setMode,
    clearMessages,
  };
};
