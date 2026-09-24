"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FaPaperPlane,
  FaInbox,
  FaRobot,
  FaWhatsapp,
  FaCheckCircle,
  FaTimesCircle,
  FaSync,
} from "react-icons/fa";

interface AnalyticsData {
  messagesReceived: number;
  messagesSent: number;
  messagesToday: number;
  totalConversations: number;
  activeConversations: number;
  totalContacts: number;
  automationExecutions: number;
  automationFailures: number;
  connectedPhoneNumber?: string;
  verifiedName?: string;
  connectionStatus: string;
  wabaId?: string;
  qualityRating?: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setData(json.metrics);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const successRate =
    data && data.automationExecutions > 0
      ? (
          ((data.automationExecutions - data.automationFailures) /
            data.automationExecutions) *
          100
        ).toFixed(1)
      : "100.0";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">WhatsApp Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time messaging, conversation, and automation performance for your business.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-sm"
        >
          <FaSync size={11} /> Refresh Metrics
        </button>
      </div>

      {/* WhatsApp Connection Summary Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FaWhatsapp size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Connected Number</div>
            <div className="font-bold text-slate-800 text-base mt-0.5">
              {data?.connectedPhoneNumber || "No Number Connected"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              data?.connectionStatus === "connected"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                data?.connectionStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            ></span>
            {data?.connectionStatus === "connected" ? "Cloud API Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Messages Received</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FaInbox size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{data?.messagesReceived ?? 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Inbound from customers</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Messages Sent</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <FaPaperPlane size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{data?.messagesSent ?? 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Outbound automated & manual</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Conversations</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <FaInbox size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{data?.activeConversations ?? 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Open support threads</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Automation Runs</span>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
              <FaRobot size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{data?.automationExecutions ?? 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">{successRate}% success rate</p>
        </div>
      </div>

      {/* Automation Health Breakdown */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="font-extrabold text-slate-800 text-lg">Automation Execution Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <FaCheckCircle size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold">Successful Executions</div>
              <div className="text-2xl font-black text-slate-800 mt-0.5">
                {(data?.automationExecutions ?? 0) - (data?.automationFailures ?? 0)}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-red-50/50 border border-red-100 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
              <FaTimesCircle size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold">Failed / Aborted Executions</div>
              <div className="text-2xl font-black text-slate-800 mt-0.5">
                {data?.automationFailures ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
