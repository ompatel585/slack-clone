import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useUser } from "@clerk/clerk-react";
import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { ArrowLeft, Link2, Users, VideoOff } from "lucide-react";
import toast from "react-hot-toast";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "../styles/call.css";

import { getStreamToken } from "../lib/api";
import PageLoader from "../components/PageLoader";
import EmptyState from "../components/EmptyState";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const CALL_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

const CallStage = ({ callId, onLeave }) => {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  // Covers being removed from the call or the call ending elsewhere
  useEffect(() => {
    if (callingState === CallingState.LEFT) onLeave();
  }, [callingState, onLeave]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Call link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  if (callingState !== CallingState.JOINED) {
    return <PageLoader label="Joining the call…" />;
  }

  return (
    <div className="call-page">
      <header className="call-header">
        <button type="button" className="call-header__back" onClick={onLeave} aria-label="Leave call">
          <ArrowLeft size={18} />
        </button>
        <div className="call-header__info">
          <h1 className="call-header__title">Slap call</h1>
          <p className="call-header__meta">
            <span className="call-header__live" aria-hidden="true" />
            Live · <Users size={14} aria-hidden="true" /> {participantCount}{" "}
            {participantCount === 1 ? "participant" : "participants"}
          </p>
        </div>
        <button type="button" className="call-header__copy" onClick={copyLink}>
          <Link2 size={16} aria-hidden="true" />
          <span>Copy invite link</span>
        </button>
        <span className="sr-only">Call id {callId}</span>
      </header>

      <main className="call-stage">
        <SpeakerLayout participantsBarPosition="bottom" />
      </main>

      <footer className="call-controls">
        <CallControls onLeave={onLeave} />
      </footer>
    </div>
  );
};

const CallPage = () => {
  const { id: callId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);

  const isValidCallId = CALL_ID_PATTERN.test(callId ?? "");
  const userId = user?.id;

  // Read through a ref so profile edits don't drop the user out of the call
  const profileRef = useRef(null);
  profileRef.current = user
    ? { id: user.id, name: user.fullName || user.username || "Guest", image: user.imageUrl }
    : null;

  useEffect(() => {
    if (!isLoaded || !userId || !isValidCallId) return;

    if (!STREAM_API_KEY) {
      setError(new Error("Missing VITE_STREAM_API_KEY. Add it to frontend/.env."));
      return;
    }

    let cancelled = false;
    let client = null;
    let activeCall = null;

    const join = async () => {
      try {
        const { token } = await getStreamToken();
        if (cancelled) return;

        // The chat token is signed with the same Stream secret, so it authenticates video too
        client = new StreamVideoClient({ apiKey: STREAM_API_KEY, user: profileRef.current, token });
        activeCall = client.call("default", callId);
        await activeCall.join({ create: true });
        if (cancelled) return;

        setVideoClient(client);
        setCall(activeCall);
      } catch (err) {
        if (cancelled) return;
        console.error("Error joining call:", err);
        setError(err);
      }
    };

    join();

    return () => {
      cancelled = true;
      setCall(null);
      setVideoClient(null);
      activeCall?.leave().catch(() => {});
      client?.disconnectUser().catch(() => {});
    };
  }, [isLoaded, userId, callId, isValidCallId]);

  const goBack = () => navigate("/", { replace: true });

  if (!isValidCallId || error) {
    return (
      <div className="error-screen call-error" role="alert">
        <EmptyState
          tone="dark"
          icon={<VideoOff size={28} />}
          title={isValidCallId ? "Couldn't join the call" : "This call link isn't valid"}
          description={
            isValidCallId
              ? "Check your camera and microphone permissions and your connection, then try again."
              : "Ask whoever shared it to send a new link."
          }
          action={
            <button type="button" className="btn btn--primary" onClick={goBack}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back to workspace
            </button>
          }
        />
      </div>
    );
  }

  if (!videoClient || !call) return <PageLoader label="Connecting to the call…" />;

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <StreamTheme className="call-theme">
          <CallStage callId={callId} onLeave={goBack} />
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
};

export default CallPage;
