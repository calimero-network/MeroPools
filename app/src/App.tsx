import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import { Providers } from "./providers/Providers";
import { Toaster } from "./components/ui/toaster";

import "./App.css";

function App() {
  return (
    <Providers>
      <>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Router>
        <Toaster />
      </>
    </Providers>
  );
}

export default App;
