import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to keep Supabase project active by performing periodic lightweight queries
 * This prevents the project from pausing due to inactivity
 */
export const useKeepAlive = () => {
    useEffect(() => {
        // Ping every 5 minutes (300000ms)
        const PING_INTERVAL = 5 * 60 * 1000;

        const keepAlive = async () => {
            try {
                // Perform a lightweight query to keep the connection active
                await supabase
                    .from('profiles')
                    .select('id')
                    .limit(1)
                    .maybeSingle();

                console.log('[Keep-Alive] Ping successful at', new Date().toISOString());
            } catch (error) {
                console.error('[Keep-Alive] Ping failed:', error);
            }
        };

        // Initial ping
        keepAlive();

        // Set up interval
        const intervalId = setInterval(keepAlive, PING_INTERVAL);

        // Cleanup on unmount
        return () => clearInterval(intervalId);
    }, []);
};
