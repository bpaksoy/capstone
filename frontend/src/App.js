
import "./index.css"
import Colleges from './pages/Colleges';
import Header from "./components/Header";
import Bookmarks from "./pages/Bookmarks";
import Trending from "./pages/Trending";
import Profile from "./pages/Profile";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
      <Header>
        <Routes>
          <Route path="/" element={<Colleges />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Header>
    </BrowserRouter>
  );
}

export default App;
