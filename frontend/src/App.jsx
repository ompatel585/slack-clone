import { lazy, Suspense } from "react";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";

import { Routes, Route, Navigate } from "react-router";
import AuthPage from "./pages/AuthPage.jsx";
import PageLoader from "./components/PageLoader.jsx";

// The chat and video SDKs are large, so each signed-in page loads its own bundle on demand
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const CallPage = lazy(() => import("./pages/CallPage.jsx"));

// One route table per auth state — two <Routes> in the same state made "/" and "/auth"
// redirect to each other forever.
const App = () => {
  const { isLoaded } = useAuth();

  // Until Clerk knows the auth state both <SignedIn> and <SignedOut> render nothing
  if (!isLoaded) return <PageLoader label="Loading…" />;

  return (
    <>
      <SignedIn>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/call/:id" element={<CallPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SignedIn>

      <SignedOut>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </SignedOut>
    </>
  );
};

export default App;
