import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from "@clerk/clerk-react";
import {BrowserRouter} from "react-router";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Copy frontend/.env.example to frontend/.env and add your Clerk publishable key.'
  )
}

// Keep Clerk's sign-in modal and user menu on-brand
const clerkAppearance = {
  variables: {
    colorPrimary: "#7209b7",
    colorText: "#1d1c1d",
    borderRadius: "0.75rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

const toastOptions = {
  duration: 3500,
  style: {
    background: "#2a1145",
    color: "#fff",
    borderRadius: "12px",
    fontSize: "0.875rem",
    boxShadow: "0 12px 32px rgba(18, 7, 31, 0.35)",
  },
  success: { iconTheme: { primary: "#2bac76", secondary: "#fff" } },
  error: { iconTheme: { primary: "#e01e5a", secondary: "#fff" } },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/auth" appearance={clerkAppearance}>
        <BrowserRouter>
          <App />
          <Toaster position="top-center" toastOptions={toastOptions} />
        </BrowserRouter>
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>
);
