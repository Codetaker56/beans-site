import { Route, Routes, useLocation, type Location } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Projects from "./pages/Projects";
import Notebook from "./pages/Notebook";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

function AppRoutes({ location }: { location: Location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/notebook" element={<Notebook />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// nav order — going to a lower index slides the other way (back).
const ORDER: Record<string, number> = { "/": 0, "/about": 1, "/projects": 2, "/notebook": 3 };
const orderOf = (p: string) => ORDER[p] ?? 99;

export default function App() {
  const location = useLocation();
  const [display, setDisplay] = useState(location);
  const [leaving, setLeaving] = useState<Location | null>(null);
  const [back, setBack] = useState(false);

  // On route change: keep the old page around as a "leaving" layer, show the new
  // one, then drop the old after the animation. Direction follows the nav order.
  useEffect(() => {
    if (location.pathname !== display.pathname) {
      setBack(orderOf(location.pathname) < orderOf(display.pathname));
      setLeaving(display);
      setDisplay(location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), 320);
    return () => clearTimeout(t);
  }, [leaving]);

  return (
    <>
      <Navbar />
      <main className={`stage${leaving ? " sliding" : ""}${back ? " back" : ""}`}>
        {leaving && (
          <div className="layer leaving" key={leaving.pathname}>
            <AppRoutes location={leaving} />
          </div>
        )}
        <div className="layer entering" key={display.pathname}>
          <AppRoutes location={display} />
        </div>
      </main>
      <Footer />
    </>
  );
}
