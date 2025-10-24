import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

import { Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";

const App = () => {
  return (
    <>
      <SignedIn>
        {/* <UserButton /> */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<Navigate to={"/"} replace />} />
        </Routes>
        <Routes>
          <Route path="/auth" element={<HomePage />} />
          <Route path="*" element={<Navigate to={"/auth"} replace />} />
        </Routes>
      </SignedIn>

      <SignedOut>
        {/* <SignInButton mode="modal" /> */}
        <Routes>
          {" "}
          <Route path="/auth" element={<AuthPage />} />{" "}
          <Route path="*" element={<Navigate to="/auth" replace />} />{" "}
        </Routes>
      </SignedOut>
    </>
  );
};

export default App;
