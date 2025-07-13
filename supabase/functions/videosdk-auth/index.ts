import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    const apiKey = Deno.env.get('VIDEOSDK_API_KEY');
    
    if (!apiKey) {
      throw new Error('VideoSDK API key not configured');
    }

    // Generate VideoSDK token
    const tokenResponse = await fetch('https://api.videosdk.live/v2/generate', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        permissions: ['allow_join', 'allow_mod'],
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to generate VideoSDK token');
    }

    const tokenData = await tokenResponse.json();

    // Create a meeting room
    const roomResponse = await fetch('https://api.videosdk.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Authorization': tokenData.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customRoomId: `room_${userId}_${Date.now()}`,
      }),
    });

    if (!roomResponse.ok) {
      throw new Error('Failed to create VideoSDK room');
    }

    const roomData = await roomResponse.json();

    return new Response(
      JSON.stringify({ 
        token: tokenData.token,
        meetingId: roomData.roomId 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('VideoSDK auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});