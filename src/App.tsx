import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./components/AlertProvider";
import StripeProvider from "./context/StripeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Templates from "./pages/Templates";
import About from "./pages/About";
import Blog from "./pages/Blog";
import SignInPage from "./pages/Signin";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import FormResponses from "./pages/FormResponses";
import Settings from "./pages/Settings";
import SurveyPage from "./pages/SurveyPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import Payment from "./pages/Payment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AlertProvider>
        <AuthProvider>
          <StripeProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                {/* <Route path="/templates" element={<Templates />} /> */}
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/login" element={<SignInPage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/survey/:formId" element={<SurveyPage />} />
                
                {/* Protected dashboard routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/analytics/:formId" element={<Analytics />} />
                  <Route path="/forms" element={<Forms />} />
                  <Route path="/forms/:formId" element={<FormResponses />} />
                  <Route path="/builder" element={<FormBuilder />} />
                  <Route path="/builder/:formId" element={<FormBuilder />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/payment" element={<Payment />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </StripeProvider>
        </AuthProvider>
      </AlertProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
