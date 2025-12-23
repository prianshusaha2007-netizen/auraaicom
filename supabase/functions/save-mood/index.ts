import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_FIELD_LENGTH = 50;
const MAX_NOTES_LENGTH = 1000;
const VALID_MOODS = ['happy', 'sad', 'anxious', 'calm', 'excited', 'stressed', 'neutral', 'angry', 'tired', 'energetic'];
const VALID_ENERGY_LEVELS = ['low', 'medium', 'high', 'very_low', 'very_high'];
const VALID_STRESS_LEVELS = ['low', 'medium', 'high', 'none', 'extreme'];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    let requestData;
    try {
      requestData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { mood, energy, stress, notes } = requestData;

    // Validate mood
    if (!mood || typeof mood !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Mood is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedMood = mood.trim().toLowerCase();
    if (trimmedMood.length === 0 || trimmedMood.length > MAX_FIELD_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Invalid mood value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate energy
    if (!energy || typeof energy !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Energy level is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedEnergy = energy.trim().toLowerCase();
    if (trimmedEnergy.length === 0 || trimmedEnergy.length > MAX_FIELD_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Invalid energy value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate stress
    if (!stress || typeof stress !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Stress level is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedStress = stress.trim().toLowerCase();
    if (trimmedStress.length === 0 || trimmedStress.length > MAX_FIELD_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Invalid stress value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate notes (optional)
    let sanitizedNotes = null;
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Notes must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const trimmedNotes = notes.trim();
      if (trimmedNotes.length > MAX_NOTES_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Notes too long. Maximum ${MAX_NOTES_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      sanitizedNotes = trimmedNotes.length > 0 ? trimmedNotes : null;
    }

    console.log('Saving mood checkin for user:', user.id);

    const { data, error } = await supabase
      .from('mood_checkins')
      .insert({
        user_id: user.id,
        mood: trimmedMood,
        energy: trimmedEnergy,
        stress: trimmedStress,
        notes: sanitizedNotes,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, checkin: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Save mood error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred saving the mood check-in' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});