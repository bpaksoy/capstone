import "./index.css";
import Colleges from './pages/Colleges';
import Header from "./components/Header";
import Bookmarks from "./pages/Bookmarks";
import Trending from "./pages/Trending";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./components/NotFound";
import College from "./components/College";
import CollegeDetail from "./components/CollegeDetail";
import SearchResults from "./components/SearchResults";
import { UserProvider } from "./UserProvider/UserProvider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import PrivateRoute from "./pages/PrivateRoute";
import PublicProfile from "./components/PublicProfile";
import SmartBookmarks from "./components/SmartBookmarks";
import SmartCollegeDetail from "./components/SmartCollegeDetail";
import DetailedSearch from "./components/DetailedSearch";
import Settings from "./pages/Settings";
import Footer from "./components/Footer";
import AIAgent from "./components/AIAgent";
import Friends from "./pages/Friends";
import ForgotPassword from "./pages/ForgotPassword";
import CollegePortal from "./pages/CollegePortal";


import ScrollToTopOnNavigate from "./utils/ScrollToTopOnNavigate";

const App = () => {

  return (
    <BrowserRouter>
      <UserProvider>
        <ScrollToTopOnNavigate />
        <Header />
        <Routes>
          <Route path="/" element={<Colleges />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />

          <Route path="/colleges/:id" element={<College />} />
          <Route path="/colleges/:id/details" element={<CollegeDetail />} />
          <Route path="/smart-colleges/:id/details" element={<SmartCollegeDetail />} />
          <Route path="/search/:query" element={<SearchResults />} />
          <Route element={<PrivateRoute />} >
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/smart-bookmarks" element={<SmartBookmarks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/detailed-search" element={<DetailedSearch />} />
            <Route path="/college/portal" element={<CollegePortal />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <AIAgent />
        <Footer />
      </UserProvider>
    </BrowserRouter>
  );
};

export default App;