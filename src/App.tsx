import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Layout } from "./components/layout";
import { Home, Collection, Artwork, About, Admin } from "./pages";
import { AuthProvider } from "./lib/auth";

const defaultClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

interface AppProps {
  client?: ConvexReactClient;
}

function App({ client = defaultClient }: AppProps) {
  return (
    <ConvexProvider client={client}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/collection/:slug" element={<Collection />} />
              <Route path="/artwork/:id" element={<Artwork />} />
              <Route path="/about" element={<About />} />
            </Route>
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConvexProvider>
  );
}

export default App;
