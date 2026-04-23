// Supabase Edge Function to keep the project active
// This function can be called periodically to prevent project pausing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        // Get Supabase credentials from environment
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Perform a simple query to keep the database active
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)

        if (error) {
            console.error('Keep-alive query error:', error)
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Keep-alive ping successful',
                timestamp: new Date().toISOString(),
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
