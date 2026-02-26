import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/lib/i18n";
import { CartProvider } from "@/hooks/useCart";
import { CartDrawer } from "@/components/market/CartDrawer";
import { ThemeProvider } from "@/hooks/useTheme";
import { LocationProvider } from "@/hooks/useLocation";
import { BrandingProvider } from "@/hooks/useBranding";
import { LocationPickerModal } from "@/components/market/LocationPickerModal";
import { VendorRoute, AuthRoute } from "@/components/ProtectedRoute";
import { useStorefrontDomain } from "@/components/DomainRouter";
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
import DashboardOrderDetail from "./pages/DashboardOrderDetail";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardLanding from "./pages/DashboardLanding";
import StorefrontHome from "./pages/StorefrontHome";
import StorefrontProduct from "./pages/StorefrontProduct";
import OneProductLanding from "./pages/OneProductLanding";
import MarketHome from "./pages/MarketHome";
import MarketCategory from "./pages/MarketCategory";
import MarketProduct from "./pages/MarketProduct";
import MarketVendor from "./pages/MarketVendor";
import Checkout from "./pages/Checkout";
import DashboardWallet from "./pages/DashboardWallet";
import DashboardCapital from "./pages/DashboardCapital";
import DashboardFulfillment from "./pages/DashboardFulfillment";
import DashboardAccounting from "./pages/DashboardAccounting";
import DashboardInsights from "./pages/DashboardInsights";
import DashboardTrends from "./pages/DashboardTrends";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardMarketing from "./pages/DashboardMarketing";
import TrackOrder from "./pages/TrackOrder";
import TrackingRedirect from "./pages/TrackingRedirect";
import AdminPayouts from "./pages/AdminPayouts";
import AdminReviews from "./pages/AdminReviews";
import MyOrders from "./pages/MyOrders";
import DashboardCustomers from "./pages/DashboardCustomers";
import DashboardShipping from "./pages/DashboardShipping";
import DashboardTickets from "./pages/DashboardTickets";
import DashboardMessages from "./pages/DashboardMessages";
import DashboardReturns from "./pages/DashboardReturns";
import AdminTickets from "./pages/AdminTickets";
import AdminReturns from "./pages/AdminReturns";
import DashboardAI from "./pages/DashboardAI";
import ConfirmDelivery from "./pages/ConfirmDelivery";
import ClientDashboard from "./pages/ClientDashboard";
import ClientOrders from "./pages/ClientOrders";
import ClientProfile from "./pages/ClientProfile";
import ClientWishlist from "./pages/ClientWishlist";
import ClientOverview from "./pages/ClientOverview";
import BecomeVendor from "./pages/BecomeVendor";
import DashboardStores from "./pages/DashboardStores";
import DashboardStorefront from "./pages/DashboardStorefront";
import NewStore from "./pages/NewStore";
import AcceptInvite from "./pages/AcceptInvite";
import AdminLayout from "./pages/AdminLayout";
import AdminOverview from "./pages/AdminOverview";
import AdminStores from "./pages/AdminStores";
import AdminUsers from "./pages/AdminUsers";
import AdminOrders from "./pages/AdminOrders";
import AdminTeam from "./pages/AdminTeam";
import AcceptAdminInvite from "./pages/AcceptAdminInvite";
import AdminKyc from "./pages/AdminKyc";
import AdminSettings from "./pages/AdminSettings";
import AdminEmail from "./pages/AdminEmail";
import AdminBranding from "./pages/AdminBranding";
import AdminAccounting from "./pages/AdminAccounting";
import AdminEmailTemplates from "./pages/AdminEmailTemplates";
import AdminInfraMonitor from "./pages/AdminInfraMonitor";
import AdminRiskReputation from "./pages/AdminRiskReputation";
import AdminSystemHealth from "./pages/AdminSystemHealth";
import AdminProducts from "./pages/AdminProducts";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import StartStore from "./pages/StartStore";
import DashboardSocialCommerce from "./pages/DashboardSocialCommerce";
import DashboardHeatmap from "./pages/DashboardHeatmap";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 min
      retry: 1,
    },
  },
});

function StorefrontRoutes() {
  const { isStorefront, storeSlug, loading } = useStorefrontDomain();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>;
  }

  if (isStorefront && storeSlug) {
    return (
      <Routes>
        <Route path="/product/:productSlug" element={<StorefrontProduct />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="*" element={<StorefrontHome />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/start" element={<StartStore />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<VendorRoute><Onboarding /></VendorRoute>} />
      <Route path="/dashboard" element={<VendorRoute><DashboardLayout /></VendorRoute>}>
        <Route index element={<DashboardOverview />} />
        <Route path="products" element={<DashboardProducts />} />
        <Route path="orders" element={<DashboardOrders />} />
        <Route path="orders/:orderId" element={<DashboardOrderDetail />} />
        <Route path="customers" element={<DashboardCustomers />} />
        <Route path="wallet" element={<DashboardWallet />} />
        <Route path="capital" element={<DashboardCapital />} />
        <Route path="fulfillment" element={<DashboardFulfillment />} />
        <Route path="accounting" element={<DashboardAccounting />} />
        <Route path="insights" element={<DashboardInsights />} />
        <Route path="trends" element={<DashboardTrends />} />
        <Route path="analytics" element={<DashboardAnalytics />} />
        <Route path="marketing" element={<DashboardMarketing />} />
        <Route path="social" element={<DashboardSocialCommerce />} />
        <Route path="heatmap" element={<DashboardHeatmap />} />
        <Route path="landings" element={<DashboardLandings />} />
        <Route path="landings/:id/edit" element={<DashboardLandingEditor />} />
        <Route path="landings/:id/ab" element={<DashboardLandingAB />} />
        <Route path="landing" element={<DashboardLandings />} />
        <Route path="shipping" element={<DashboardShipping />} />
        <Route path="ai" element={<DashboardAI />} />
        <Route path="messages" element={<DashboardMessages />} />
        <Route path="tickets" element={<DashboardTickets />} />
        <Route path="returns" element={<DashboardReturns />} />
              <Route path="storefront" element={<DashboardStorefront />} />
        <Route path="stores" element={<DashboardStores />} />
        <Route path="stores/new" element={<NewStore />} />
        <Route path="settings" element={<DashboardSettings />} />
      </Route>
      <Route path="/store/:slug" element={<StorefrontHome />} />
      <Route path="/store/:slug/product/:productSlug" element={<StorefrontProduct />} />
      <Route path="/store/:slug/lp" element={<OneProductLanding />} />
      <Route path="/lp/:slug" element={<LandingPagePublic />} />
      <Route path="/lp/:slug/:subpage" element={<LandingPagePublic />} />
      <Route path="/market" element={<MarketHome />} />
      <Route path="/market/category/:slug" element={<MarketCategory />} />
      <Route path="/market/product/:slug" element={<MarketProduct />} />
      <Route path="/market/vendor/:slug" element={<MarketVendor />} />
      <Route path="/blog" element={<BlogIndex />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/invite/accept" element={<AcceptInvite />} />
      <Route path="/r/:code" element={<TrackingRedirect />} />
      <Route path="/track" element={<TrackOrder />} />
      <Route path="/track/:orderNumber" element={<TrackOrder />} />
      <Route path="/confirm-delivery/:token" element={<ConfirmDelivery />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="stores" element={<AdminStores />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="returns" element={<AdminReturns />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="kyc" element={<AdminKyc />} />
        <Route path="team" element={<AdminTeam />} />
        <Route path="email" element={<AdminEmail />} />
        <Route path="branding" element={<AdminBranding />} />
        <Route path="email-templates" element={<AdminEmailTemplates />} />
        <Route path="accounting" element={<AdminAccounting />} />
        <Route path="infra" element={<AdminInfraMonitor />} />
        <Route path="health" element={<AdminSystemHealth />} />
        <Route path="risk" element={<AdminRiskReputation />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="/admin/invite" element={<AcceptAdminInvite />} />
      <Route path="/my-orders" element={<AuthRoute><MyOrders /></AuthRoute>} />
      <Route path="/account" element={<AuthRoute><ClientDashboard /></AuthRoute>}>
        <Route index element={<ClientOverview />} />
        <Route path="orders" element={<ClientOrders />} />
        <Route path="wishlist" element={<ClientWishlist />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="become-vendor" element={<BecomeVendor />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrandingProvider>
      <LanguageProvider>
      <LocationProvider>
      <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <StorefrontRoutes />
          <CartDrawer />
          <LocationPickerModal />
        </BrowserRouter>
      </TooltipProvider>
      </CartProvider>
      </LocationProvider>
      </LanguageProvider>
      </BrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
