
import "./index.css"
import { createContext, useState, useEffect } from 'react';
import Colleges from './pages/Colleges';
import Header from "./components/Header";
import Bookmarks from "./pages/Bookmarks";
import Trending from "./pages/Trending";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./components/NotFound";
import College from "./components/College";
import SearchResults from "./components/SearchResults";
import { UserProvider } from "./UserProvider/UserProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { baseUrl } from './shared';
import PrivateRoute from "./pages/PrivateRoute";


export const LoginContext = createContext();

const App = () => {
  useEffect(() => {
    const refreshTokens = () => {
      if (localStorage.refresh) {
        const url = baseUrl + 'api/token/refresh/';
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: localStorage.refresh,
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            localStorage.access = data.access;
            localStorage.refresh = data.refresh;
            setLoggedIn(true);
          });
      }
    }

    const minute = 1000 * 60;
    refreshTokens();
    setInterval(refreshTokens, minute * 3);
  }, []);

  const [loggedIn, setLoggedIn] = useState(
    localStorage.access ? true : false
  );

  function changeLoggedIn(value) {
    setLoggedIn(value);
    if (value === false) {
      localStorage.clear();
    }
  }

  return (
    <LoginContext.Provider value={[loggedIn, changeLoggedIn]}>
      <UserProvider>
        <BrowserRouter>
          <Header>
            <Routes>
              <Route path="/" element={<PrivateRoute loggedIn={loggedIn} />}>
                <Route path="/" element={<Colleges />} />
                <Route path="/colleges/:id" element={<College />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/search/:query" element={<SearchResults key={new Date().getTime()} />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Header>
        </BrowserRouter>
      </UserProvider>
    </LoginContext.Provider >
  );
}

export default App;
