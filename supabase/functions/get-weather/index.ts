import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { latitude, longitude } = await req.json();
    
    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude must be valid numbers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (latitude < -90 || latitude > 90) {
      return new Response(
        JSON.stringify({ error: 'Latitude must be between -90 and 90' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return new Response(
        JSON.stringify({ error: 'Longitude must be between -180 and 180' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Weather request for coordinates:', { latitude, longitude });

    // Use Open-Meteo API (free, no API key required)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    
    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Weather API response:', data);
    
    const current = data.current;
    
    // Weather code descriptions
    const weatherDescriptions: Record<number, { description: string; emoji: string }> = {
      0: { description: 'Clear sky', emoji: '☀️' },
      1: { description: 'Mainly clear', emoji: '🌤️' },
      2: { description: 'Partly cloudy', emoji: '⛅' },
      3: { description: 'Overcast', emoji: '☁️' },
      45: { description: 'Foggy', emoji: '🌫️' },
      48: { description: 'Depositing rime fog', emoji: '🌫️' },
      51: { description: 'Light drizzle', emoji: '🌦️' },
      53: { description: 'Moderate drizzle', emoji: '🌦️' },
      55: { description: 'Dense drizzle', emoji: '🌧️' },
      61: { description: 'Slight rain', emoji: '🌧️' },
      63: { description: 'Moderate rain', emoji: '🌧️' },
      65: { description: 'Heavy rain', emoji: '🌧️' },
      71: { description: 'Slight snow', emoji: '🌨️' },
      73: { description: 'Moderate snow', emoji: '🌨️' },
      75: { description: 'Heavy snow', emoji: '❄️' },
      77: { description: 'Snow grains', emoji: '🌨️' },
      80: { description: 'Slight rain showers', emoji: '🌦️' },
      81: { description: 'Moderate rain showers', emoji: '🌧️' },
      82: { description: 'Violent rain showers', emoji: '⛈️' },
      85: { description: 'Slight snow showers', emoji: '🌨️' },
      86: { description: 'Heavy snow showers', emoji: '❄️' },
      95: { description: 'Thunderstorm', emoji: '⛈️' },
      96: { description: 'Thunderstorm with slight hail', emoji: '⛈️' },
      99: { description: 'Thunderstorm with heavy hail', emoji: '⛈️' },
    };
    
    const weatherInfo = weatherDescriptions[current.weather_code] || { description: 'Unknown', emoji: '🌡️' };
    
    const weatherData = {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      description: weatherInfo.description,
      emoji: weatherInfo.emoji,
      timezone: data.timezone,
    };
    
    console.log('Processed weather data:', weatherData);
    
    return new Response(JSON.stringify(weatherData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in get-weather function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
