"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { SiZendesk } from "react-icons/si";
import {
  FaChartPie,
  FaInbox,
  FaUsers,
  FaRobot,
  FaSitemap,
  FaFileAlt,
  FaBookOpen,
  FaFolderOpen,
  FaBullhorn,
  FaUserFriends,
  FaChartLine,
  FaWhatsapp,
  FaCog,
  FaCreditCard,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSearch,
  FaBell,
  FaChevronDown,
} from "react-icons/fa";

interface Workspace {
  id: string;
  name: string;
  plan: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Workspace & Auth states
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch session & workspaces
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.success) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      setWorkspaces(data.workspaces);
      setActiveWorkspace(data.activeWorkspace);
    } catch (err) {
      console.error("Auth check failed:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSession();
  }, [fetchSession]);

  const handleWorkspaceChange = async (workspaceId: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.success) {
        // Force complete page reload to clear cache and refresh all tenant scopes
        window.location.reload();
      }
    } catch (err) {
      console.error("Workspace switch failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const sidebarLinks = [
    { name: "Dashboard", href: "/dashboard", icon: FaChartPie },
    { name: "Inbox", href: "/dashboard/inbox", icon: FaInbox },
    { name: "Contacts", href: "/dashboard/contacts", icon: FaUsers },
    { name: "Automation", href: "/dashboard/automation", icon: FaRobot },
    { name: "Flows", href: "/dashboard/flows", icon: FaSitemap },
    { name: "Templates", href: "/dashboard/templates", icon: FaFileAlt },
    { name: "Catalog", href: "/dashboard/catalog", icon: FaBookOpen },
    { name: "Media", href: "/dashboard/media", icon: FaFolderOpen },
    { name: "Broadcasts", href: "/dashboard/broadcasts", icon: FaBullhorn },
    { name: "Team", href: "/dashboard/team", icon: FaUserFriends },
    { name: "Analytics", href: "/dashboard/analytics", icon: FaChartLine },
    { name: "WhatsApp", href: "/dashboard/whatsapp", icon: FaWhatsapp },
    { name: "Settings", href: "/dashboard/settings", icon: FaCog },
    { name: "Billing", href: "/dashboard/billing", icon: FaCreditCard },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-100 flex-shrink-0 z-30">
        {/* Logo Section */}
        <div className="h-16 px-6 flex items-center gap-2 border-b border-slate-50">
          <div className="bg-emerald-500 text-white p-1 rounded-lg">
            <SiZendesk className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">Zaanway</span>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  active
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-emerald-500" : "text-slate-400"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout footer */}
        <div className="p-4 border-t border-slate-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl text-sm font-semibold transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
            Sign out
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Drawer content */}
          <div className="relative flex flex-col w-64 max-w-xs bg-white border-r border-slate-100 flex-1 z-50">
            <div className="h-16 px-6 flex justify-between items-center border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 text-white p-1 rounded-lg">
                  <SiZendesk className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg text-slate-800">Zaanway</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-500 hover:text-slate-800 p-1"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? "bg-emerald-50 text-emerald-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-emerald-500" : "text-slate-400"}`} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl text-sm font-semibold transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4 text-slate-400" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-20">
          
          {/* Mobile hamburger toggle */}
          <div className="flex items-center gap-3 lg:gap-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-lg"
            >
              <FaBars className="w-5 h-5" />
            </button>

            {/* Workspace Selector */}
            <div className="relative flex items-center gap-2">
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-slate-200 cursor-pointer hover:bg-slate-200 transition">
                <span className="text-xs font-bold text-slate-700">
                  {activeWorkspace ? activeWorkspace.name : "Select Workspace"}
                </span>
                {workspaces.length > 1 && (
                  <select
                    value={activeWorkspace?.id || ""}
                    onChange={(e) => handleWorkspaceChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  >
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.role})
                      </option>
                    ))}
                  </select>
                )}
                {workspaces.length > 1 && <FaChevronDown className="w-3 h-3 text-slate-400" />}
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            
            {/* Search */}
            <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-60">
              <FaSearch className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition">
              <FaBell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div className="hidden md:block text-left text-xs mr-1">
                  <div className="font-bold text-slate-800">{user?.name || "User"}</div>
                  <div className="text-slate-400">{activeWorkspace?.role || "Member"}</div>
                </div>
                <FaChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-20">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Billing
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </header>

        {/* Dashboard Pages Yield */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

    </div>
  );
}
