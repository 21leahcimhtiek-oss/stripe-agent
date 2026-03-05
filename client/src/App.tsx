import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Subscriptions from "./pages/Subscriptions";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Webhooks from "./pages/Webhooks";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/chat/:sessionId" component={Chat} />
        <Route path="/customers" component={Customers} />
        <Route path="/products" component={Products} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/payments" component={Payments} />
        <Route path="/webhooks" component={Webhooks} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
