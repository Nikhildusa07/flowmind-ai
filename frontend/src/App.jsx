import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import Workflows from "./pages/Workflows";
import Documents from "./pages/Documents";
import Assistant from "./pages/Assistant";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reviews from "./pages/Reviews";
import Analytics from "./pages/Analytics";
import Monitoring from "./pages/Monitoring";

import { isAuthenticated } from "./services/auth";

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* ============================================================
          PUBLIC AUTHENTICATION ROUTES
      ============================================================ */}

      <Route
        path="/login"
        element={
          isAuthenticated() ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated() ? (
            <Navigate to="/" replace />
          ) : (
            <Register />
          )
        }
      />

      {/* ============================================================
          PROTECTED APPLICATION ROUTES
      ============================================================ */}

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/requests"
          element={<Requests />}
        />

        <Route
          path="/workflows"
          element={<Workflows />}
        />

        <Route
          path="/documents"
          element={<Documents />}
        />

        <Route
          path="/assistant"
          element={<Assistant />}
        />

        <Route
          path="/reviews"
          element={<Reviews />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        <Route
          path="/monitoring"
          element={<Monitoring />}
        />
      </Route>

      {/* ============================================================
          UNKNOWN ROUTES
      ============================================================ */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;