import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/login";
import Register from "./pages/register";
import Articles from "./pages/articles";
import Cinema from "./pages/cinema";
import Combo from "./pages/combo";
import Movie from "./pages/movie";
import Order from "./pages/order";
function App() {
  return (
    <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/order" element={<Order />} />
        <Route path="/movie" element={<Movie />} />
        <Route path="/combo" element={<Combo />} />
        <Route path="/cinema" element={<Cinema />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/articles" element={<Articles />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
