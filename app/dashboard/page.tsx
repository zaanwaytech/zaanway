"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaInbox,
  FaUsers,
  FaRobot,
  FaCheckCircle,
  FaPaperPlane,
  FaArrowRight,
  FaWhatsapp,
} from "react-icons/fa";

interface Workspace {
  id: string;
  name: string;
  plan: string;
  role: string;
}

export default function DashboardPage() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const metrics = {
    conversationsCount: 154,
    unreadCount: 8,
    messagesToday: 42,
    customersCount: 120,
    automationExecutions: 890,
    responseRate: 98.5,
  };
  const [whatsappStatus, setWhatsappStatus] = useState<string>("disconnected");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setActiveWorkspace(data.activeWorkspace);

          // In dev mode, fetch real workspace settings/status if connected
          if (data.activeWorkspace) {
            const statusRes = await fetch(`/api/whatsapp/status?userId=${data.user.id}`);
            const statusData = await statusRes.json();
            if (statusData && statusData.connected) {
              setWhatsappStatus("connected");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    }
    loadDashboardData();
  }, []);

  const kpis = [
    {
      name: "Total Conversations",
      value: metrics.conversationsCount,
      change: "+12.4%",
      changeType: "positive",
      icon: FaInbox,
      color: "text-blue-600 bg-blue-50",
    },
    {
      name: "Unread Messages",
      value: metrics.unreadCount,
      change: "Action required",
      changeType: "neutral",
      icon: FaInbox,
      color: "text-amber-600 bg-amber-50",
    },
    {
      name: "Messages Today",
      value: metrics.messagesToday,
      change: "+24.8%",
      changeType: "positive",
      icon: FaPaperPlane,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      name: "Total Customers",
      value: metrics.customersCount,
      change: "+8.2%",
      changeType: "positive",
      icon: FaUsers,
      color: "text-purple-600 bg-purple-50",
    },
    {
      name: "Automation Executions",
      value: metrics.automationExecutions,
      change: "94.2% success",
      changeType: "positive",
      icon: FaRobot,
      color: "text-pink-600 bg-pink-50",
    },
    {
      name: "Response Rate",
      value: `${metrics.responseRate}%`,
      change: "Avg. 1.8 mins",
      changeType: "positive",
      icon: FaCheckCircle,
      color: "text-teal-600 bg-teal-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Welcome to {activeWorkspace?.name || "Zaanway"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here&apos;s how your WhatsApp automation channels are performing today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
              whatsappStatus === "connected"
                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                : "bg-red-50 border-red-100 text-red-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                whatsappStatus === "connected" ? "bg-emerald-500" : "bg-red-500"
              }`}
            ></span>
            WhatsApp Status: {whatsappStatus === "connected" ? "Connected" : "Disconnected"}
          </span>
          {whatsappStatus !== "connected" && (
            <Link
              href="/dashboard/whatsapp"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <FaWhatsapp className="w-3.5 h-3.5" /> Connect
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.name}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400">{kpi.name}</span>
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-800">{kpi.value}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    kpi.changeType === "positive"
                      ? "bg-emerald-50 text-emerald-700"
                      : kpi.changeType === "negative"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Messages Trend SVG Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-lg mb-6">Messages Per Day</h3>
          <div className="relative h-60 w-full flex items-end justify-between">
            {/* SVG Line representation */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <path
                d="M 0 160 Q 60 120 120 140 T 240 80 T 360 110 T 480 50 T 600 70"
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 0 160 Q 60 120 120 140 T 240 80 T 360 110 T 480 50 T 600 70 L 600 240 L 0 240 Z"
                fill="url(#emerald-gradient)"
                opacity="0.12"
              />
              <defs>
                <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Labels overlay */}
            <div className="absolute left-0 bottom-0 text-[10px] text-slate-400 font-semibold">Mon</div>
            <div className="absolute left-1/4 bottom-0 text-[10px] text-slate-400 font-semibold">Wed</div>
            <div className="absolute left-2/4 bottom-0 text-[10px] text-slate-400 font-semibold">Fri</div>
            <div className="absolute left-3/4 bottom-0 text-[10px] text-slate-400 font-semibold">Sun</div>
          </div>
        </div>

        {/* Incoming vs Outgoing Bars SVG Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-lg mb-6">Incoming vs Outgoing</h3>
          <div className="h-60 w-full flex items-end justify-around pb-6 border-b border-slate-100">
            {/* Monday bar */}
            <div className="flex flex-col items-center gap-2 w-12">
              <div className="flex gap-1 h-36 items-end w-full">
                <div className="bg-emerald-500 rounded-t-md w-1/2" style={{ height: "45%" }}></div>
                <div className="bg-blue-500 rounded-t-md w-1/2" style={{ height: "65%" }}></div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Mon</span>
            </div>

            {/* Wednesday bar */}
            <div className="flex flex-col items-center gap-2 w-12">
              <div className="flex gap-1 h-36 items-end w-full">
                <div className="bg-emerald-500 rounded-t-md w-1/2" style={{ height: "70%" }}></div>
                <div className="bg-blue-500 rounded-t-md w-1/2" style={{ height: "85%" }}></div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Wed</span>
            </div>

            {/* Friday bar */}
            <div className="flex flex-col items-center gap-2 w-12">
              <div className="flex gap-1 h-36 items-end w-full">
                <div className="bg-emerald-500 rounded-t-md w-1/2" style={{ height: "80%" }}></div>
                <div className="bg-blue-500 rounded-t-md w-1/2" style={{ height: "75%" }}></div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Fri</span>
            </div>

            {/* Sunday bar */}
            <div className="flex flex-col items-center gap-2 w-12">
              <div className="flex gap-1 h-36 items-end w-full">
                <div className="bg-emerald-500 rounded-t-md w-1/2" style={{ height: "90%" }}></div>
                <div className="bg-blue-500 rounded-t-md w-1/2" style={{ height: "95%" }}></div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Sun</span>
            </div>
          </div>
          <div className="flex gap-4 justify-center mt-4 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Incoming Messages
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Outgoing Messages
            </span>
          </div>
        </div>

      </div>

      {/* Quick Setup Checklist */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="font-extrabold text-slate-800 text-lg mb-6">Workspace Setup Steps</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full flex-shrink-0">
              <FaCheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700 text-sm">Account Registration & Workspace Creation</h4>
              <p className="text-xs text-slate-400 mt-0.5">Completed successfully</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className={`p-1.5 rounded-full flex-shrink-0 ${
              whatsappStatus === "connected" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              {whatsappStatus === "connected" ? <FaCheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 block rounded-full border-2 border-amber-600"></span>}
            </div>
            <div>
              <h4 className="font-bold text-slate-700 text-sm">Link WhatsApp Account (WABA)</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {whatsappStatus === "connected" ? "Meta API verification passed" : "Meta authorization required"}
              </p>
              {whatsappStatus !== "connected" && (
                <Link
                  href="/dashboard/whatsapp"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
                >
                  Configure connection <FaArrowRight className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full flex-shrink-0">
              <FaCheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700 text-sm">Welcome Greeting Chatbot</h4>
              <p className="text-xs text-slate-400 mt-0.5">Editable template saved during onboarding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
