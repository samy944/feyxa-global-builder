import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { CartDrawer } from "@/components/market/CartDrawer";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardLandings from "./pages/DashboardLandings";
import DashboardLandingEditor from "./pages/DashboardLandingEditor";
import DashboardLandingAB from "./pages/DashboardLandingAB";
import LandingPagePublic from "./pages/LandingPagePublic";
import DashboardOverview from "./pages/DashboardOverview";
import DashboardProducts from "./pages/DashboardProducts";
import DashboardOrders from "./pages/DashboardOrders";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardLanding from "./pages/DashboardLanding";
import StorefrontHome from "./pages/StorefrontHome";
import OneProductLanding from "./pages/OneProductLanding";
import MarketHome from "./pages/MarketHome";
import MarketCategory from "./pages/MarketCategory";
import MarketProduct from "./pages/MarketProduct";
import MarketVendor from "./pages/MarketVendor";
import Checkout from "./pages/Checkout";
import DashboardWallet from "./pages/DashboardWallet";
import DashboardInsights from "./pages/DashboardInsights";
import DashboardTrends from "./pages/DashboardTrends";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardMarketing from "./pages/DashboardMarketing";
import TrackOrder from "./pages/TrackOrder";
import TrackingRedirect from "./pages/TrackingRedirect";
import AdminPayouts from "./pages/AdminPayouts";
import AdminReviews from "./pages/AdminReviews";
import MyOrders from "./pages/MyOrders";
import DashboardShipping from "./pages/DashboardShipping";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={
              <ProtectedRoute><Onboarding /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardLayout /></ProtectedRoute>
            }>
              <Route index element={<DashboardOverview />} />
              <Route path="products" element={<DashboardProducts />} />
              <Route path="orders" element={<DashboardOrders />} />
              <Route path="wallet" element={<DashboardWallet />} />
              <Route path="insights" element={<DashboardInsights />} />
              <Route path="trends" element={<DashboardTrends />} />
              <Route path="analytics" element={<DashboardAnalytics />} />
              <Route path="marketing" element={<DashboardMarketing />} />
              <Route path="landings" element={<DashboardLandings />} />
              <Route path="landings/:id/edit" element={<DashboardLandingEditor />} />
              <Route path="landings/:id/ab" element={<DashboardLandingAB />} />
              <Route path="landing" element={<DashboardLandings />} />
              <Route path="shipping" element={<DashboardShipping />} />
              <Route path="settings" element={<DashboardSettings />} />
            </Route>
            <Route path="/store/:slug" element={<StorefrontHome />} />
            <Route path="/store/:slug/lp" element={<OneProductLanding />} />
            <Route path="/lp/:slug" element={<LandingPagePublic />} />
            {/* Marketplace */}
            <Route path="/market" element={<MarketHome />} />
            <Route path="/market/category/:slug" element={<MarketCategory />} />
            <Route path="/market/product/:slug" element={<MarketProduct />} />
            <Route path="/market/vendor/:slug" element={<MarketVendor />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/r/:code" element={<TrackingRedirect />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/track/:orderNumber" element={<TrackOrder />} />
            <Route path="/admin/payouts" element={
              <ProtectedRoute><AdminPayouts /></ProtectedRoute>
            } />
            <Route path="/admin/reviews" element={
              <ProtectedRoute><AdminReviews /></ProtectedRoute>
            } />
            <Route path="/my-orders" element={
              <ProtectedRoute><MyOrders /></ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CartDrawer />
        </BrowserRouter>
      </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
