import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { StreamChat } from "stream-chat";
import { getStreamToken } from "../lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

/**
 * Connects the signed-in Clerk user to Stream Chat and returns the ready client.
 * Each effect run owns its own client, so StrictMode's mount → unmount → mount
 * can never disconnect a client that the surviving run is still using.
 */
export const useStreamChat = () => {
  const { user, isLoaded } = useUser();
  const [chatClient, setChatClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Profile changes (name, avatar) shouldn't force a reconnect, so read them through a ref
  const profileRef = useRef(null);
  profileRef.current = user
    ? {
        id: user.id,
        name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress,
        image: user.imageUrl,
      }
    : null;

  const userId = user?.id;

  useEffect(() => {
    if (!isLoaded || !userId) return;

    if (!STREAM_API_KEY) {
      setError(new Error("Missing VITE_STREAM_API_KEY. Add it to frontend/.env."));
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const client = new StreamChat(STREAM_API_KEY);

    const connect = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { token } = await getStreamToken();
        if (cancelled) return;

        await client.connectUser(profileRef.current, token);
        if (cancelled) return;

        setChatClient(client);
      } catch (err) {
        if (cancelled) return;
        console.error("Error connecting to Stream:", err);
        setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    connect();

    return () => {
      cancelled = true;
      setChatClient(null);
      client.disconnectUser().catch(() => {});
    };
  }, [isLoaded, userId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { chatClient, isLoading, error, retry };
};
