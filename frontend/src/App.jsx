import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";

import { Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import PageLoader from "./components/PageLoader.jsx";

// One route table per auth state — two <Routes> in the same state made "/" and "/auth"
// redirect to each other forever.
const App = () => {
  const { isLoaded } = useAuth();

  // Until Clerk knows the auth state both <SignedIn> and <SignedOut> render nothing
  if (!isLoaded) return <PageLoader label="Loading…" />;

  return (
    <>
      <SignedIn>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
