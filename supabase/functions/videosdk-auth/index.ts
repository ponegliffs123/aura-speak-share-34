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

    // Generate VideoSDK token
    const response = await fetch('https://api.videosdk.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('VIDEOSDK_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customRoomId: `room_${userId}_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create VideoSDK room');
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ meetingId: data.roomId }),
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