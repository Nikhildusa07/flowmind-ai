import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { apiFetch, logout } from "../services/auth";

const navigation = [
  {
    section: "WORKSPACE",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: "⌂",
      },
      {
        label: "Requests",
        path: "/requests",
        icon: "▣",
      },
      {
        label: "Workflows",
        path: "/workflows",
        icon: "↗",
      },
      {
        label: "Documents",
        path: "/documents",
        icon: "▤",
      },
    ],
  },
  {
    section: "INTELLIGENCE",
    items: [
      {
        label: "AI Assistant",
        path: "/assistant",
        icon: "✦",
      },
      {
        label: "Human Review",
        path: "/reviews",
        icon: "✓",
      },
      {
        label: "Analytics",
        path: "/analytics",
        icon: "▥",
      },
      {
        label: "Monitoring",
        path: "/monitoring",
        icon: "◉",
      },
    ],
  },
];

function Layout() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await apiFetch("/auth/me");

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Unable to load current user:", error);
      }
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const userName = user?.full_name || "Administrator";
  const userEmail = user?.email || "Workspace User";

  return (
    <div className="app-shell">
      {/* ============================================================
          SIDEBAR
      ============================================================ */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>

          <div className="brand-content">
            <div className="brand-name">FlowMind AI</div>
            <div className="brand-subtitle">
              Business Automation
            </div>
          </div>
        </div>

        <nav className="navigation">
          {navigation.map((group) => (
            <div
              className="navigation-group"
              key={group.section}
            >
              <div className="navigation-title">
                {group.section}
              </div>

              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `navigation-item ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <span className="navigation-icon">
                    {item.icon}
                  </span>

                  <span className="navigation-label">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ============================================================
            SIDEBAR FOOTER
        ============================================================ */}

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot" />

            <div>
              <div className="status-title">
                System Operational
              </div>

              <div className="status-text">
                All services running
              </div>
            </div>
          </div>

          <div className="user-card">
            <div className="user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="user-info">
              <div className="user-name">
                {userName}
              </div>

              <div className="user-role">
                {userEmail}
              </div>
            </div>

            <button
              className="logout-button"
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN APPLICATION
      ============================================================ */}

      <main className="main-content">
        {/* ==========================================================
            TOPBAR
        ========================================================== */}

        <header className="topbar">
          <div className="topbar-heading">
            <div className="topbar-title">
              FlowMind AI
            </div>

            <div className="topbar-subtitle">
              Autonomous AI-Powered Business Automation
            </div>
          </div>

          <div className="topbar-actions">
            <div className="connection-status">
              <span className="status-dot" />
              <span>Backend Connected</span>
            </div>

            <button
              className="notification-button"
              type="button"
              aria-label="Notifications"
            >
              ♢
            </button>

            <button
              className="topbar-avatar"
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              {userName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        {/* ==========================================================
            PAGE CONTENT
        ========================================================== */}

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default Layout;