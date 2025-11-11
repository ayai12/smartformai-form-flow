import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./components/AlertProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Templates from "./pages/Templates";
import About from "./pages/About";
import Blog from "./pages/Blog";
import SignInPage from "./pages/Signin";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import FormResponses from "./pages/FormResponses";
import Settings from "./pages/Settings";
import SurveyPage from "./pages/SurveyPage";
import AIFormGeneratorForSurveys from "./pages/AIFormGeneratorForSurveys";
import AIFormGeneratorForFeedback from "./pages/AIFormGeneratorForFeedback";
import AIFormGeneratorTypes from "./pages/AIFormGeneratorTypes";
import Mock from "./pages/Mock";
import CreateAgent from "./pages/CreateAgent";
import Pricing from "./pages/Pricing";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import CreditPurchaseSuccess from "./pages/CreditPurchaseSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AlertProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/mock" element={<Mock />} />
              {/* <Route path="/templates" element={<Templates />} /> */}
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/login" element={<SignInPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/survey/:formId" element={<SurveyPage />} />
              <Route path="/train-agent" element={<CreateAgent />} />
              
              {/* AI Form Generator Pages for SEO */}
              <Route path="/ai-form-generator-for-surveys" element={<AIFormGeneratorForSurveys />} />
              <Route path="/ai-form-generator-for-feedback" element={<AIFormGeneratorForFeedback />} />
              <Route path="/ai-form-generator-types" element={<AIFormGeneratorTypes />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/credit-purchase-success" element={<CreditPurchaseSuccess />} />
                <Route path="/subscription-management" element={<SubscriptionManagement />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/analytics/:formId" element={<Analytics />} />
                <Route path="/forms" element={<Forms />} />
                <Route path="/forms/:formId" element={<FormResponses />} />
                <Route path="/builder" element={<FormBuilder />} />
                <Route path="/builder/:formId" element={<FormBuilder />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AlertProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;