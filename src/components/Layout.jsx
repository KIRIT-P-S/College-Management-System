import React, { useState, useEffect } from "react";

export default function Layout({ sidebarColor, children, sidebar }) {
  const [open, setOpen] = useState(false);

  // close sidebar on route/tab change on mobile
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <div className="portal-layout">
      {/* hamburger */}
      <button
        className="hamburger"
        style={{ "--sidebar-color": sidebarColor }}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span style={open ? { transform: "rotate(45deg) translate(5px, 5px)" } : {}} />
        <span style={open ? { opacity: 0 } : {}} />
        <span style={open ? { transform: "rotate(-45deg) translate(5px, -5px)" } : {}} />
      </button>

      {/* overlay */}
      <div
        className={`sidebar-overlay ${open ? "" : "hidden"}`}
        onClick={() => setOpen(false)}
      />

      {/* sidebar */}
      <aside
        className={`sidebar ${open ? "open" : ""}`}
        style={{ "--sidebar-color": sidebarColor }}
        onClick={() => {
          // close on mobile when a nav item is clicked
          if (window.innerWidth <= 1024) setOpen(false);
        }}
      >
        {sidebar}
      </aside>

      {/* main */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
