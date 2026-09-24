"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FaWhatsapp,
  FaCheckCircle,
  FaExclamationCircle,
  FaSync,
  FaShieldAlt,
  FaRegTimesCircle,
} from "react-icons/fa";
import ConnectWhatsAppButton from "@/components/whatsapp/ConnectWhatsAppButton";
import FacebookSDK from "@/components/FacebookSDK";

interface ConnectionChecks {
  metaAuth: boolean;
  waba: boolean;
  phoneNumber: boolean;
  webhook: boolean;
  messagingApi: boolean;
}

interface WhatsAppStatusData {
  connected: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string;
  businessName?: string;
  wabaId?: string;
  phoneNumberId?: string;
  qualityRating?: string;
  messagingLimit?: string;
  webhookStatus?: string;
  error?: string | null;
}

export default function WhatsAppConnectionPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<WhatsAppStatusData | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [healthChecks, setHealthChecks] = useState<ConnectionChecks | null>(null);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to load connection status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      fetchStatus();
    }
    return () => {
      mounted = false;
    };
  }, [fetchStatus]);

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to disconnect this WhatsApp number? Your historical messages will be preserved, but automations and outbound messages will stop."
    );
    if (!confirmed) return;

    try {
      setDisconnecting(true);
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatus(null);
        await fetchStatus();
      } else {
        alert(data.message || "Failed to disconnect WhatsApp number.");
      }
    } catch (err) {
      console.error("Error disconnecting:", err);
      alert("An unexpected error occurred while disconnecting.");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleCheckHealth = async () => {
    try {
      setCheckingHealth(true);
      const res = await fetch("/api/whatsapp/health", { cache: "no-store" });
      const data = await res.json();
      if (data.checks) {
        setHealthChecks(data.checks);
        setHealthModalOpen(true);
      }
    } catch (err) {
      console.error("Error checking health:", err);
      alert("Failed to run connection health check.");
    } finally {
      setCheckingHealth(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const isConnected = !!status?.connected;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <FacebookSDK />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">WhatsApp Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your WhatsApp Cloud API connection, business profile, and webhook subscriptions.
        </p>
      </div>

      {/* Connection Panel */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition duration-200">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <FaWhatsapp className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">WhatsApp Business Profile</h2>
              <p className="text-xs text-slate-400">Meta Cloud API Multi-Tenant Integration</p>
            </div>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckHealth}
                disabled={checkingHealth}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <FaSync className={checkingHealth ? "animate-spin" : ""} />
                {checkingHealth ? "Checking..." : "Check Connection"}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          )}
        </div>

        {/* State 1: Connected */}
        {isConnected ? (
          <div className="mt-8 space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
                    WhatsApp Connected ✓
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    Live and ready to send & receive automated messages.
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/60">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Business Name</div>
                <div className="font-bold text-slate-800 text-base mt-1">
                  {status.businessName || status.verifiedName || "My Business"}
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/60">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp Phone</div>
                <div className="font-bold text-slate-800 text-base mt-1">
                  {status.displayPhoneNumber || "Not Set"}
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/60">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp Business Account (WABA)</div>
                <div className="font-mono text-slate-700 text-xs mt-1">
                  {status.wabaId || "Not Available"}
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/60">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Phone Number ID</div>
                <div className="font-mono text-slate-700 text-xs mt-1">
                  {status.phoneNumberId || "Not Available"}
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/60">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Quality Rating</div>
                <div className="font-bold text-emerald-600 text-sm mt-1">
                  {status.qualityRating || "GREEN"}
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/60">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Messaging Tier Limit</div>
                <div className="font-bold text-slate-700 text-sm mt-1">
                  {status.messagingLimit || "TIER_1K (1,000 conversations/24h)"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* State 2: Not Connected */
          <div className="mt-8 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <FaWhatsapp className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Connect your WhatsApp</h3>
                <p className="text-slate-500 text-sm mt-2">
                  Connect your business WhatsApp number to start automating conversations, managing customer leads, and sending interactive flows.
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <ConnectWhatsAppButton onConnectSuccess={() => fetchStatus()} />
              </div>
            </div>

            {status?.error && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
                <FaExclamationCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Connection Note:</span> {status.error}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Webhook Endpoint Info */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <FaShieldAlt className="w-5 h-5 text-slate-400" />
          <h3 className="font-bold text-slate-800 text-base">Meta Webhook Configuration</h3>
        </div>
        <p className="text-slate-500 text-xs leading-relaxed">
          Zaanway provides a production-grade webhook that verifies Meta challenge requests and validates incoming event HMAC-SHA256 signatures with timing-safe protection.
        </p>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 font-mono text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>Callback URL: <strong className="text-emerald-700">https://zaanway.in/api/webhooks/whatsapp</strong></span>
          <span className="text-slate-400 text-[11px]">Method: GET (Verify) / POST (Events)</span>
        </div>
      </div>

      {/* Health Check Modal */}
      {healthModalOpen && healthChecks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Connection Health Check</h3>
              <button
                onClick={() => setHealthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Meta Authorization</span>
                {healthChecks.metaAuth ? (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1.5">
                    <FaCheckCircle /> Passed
                  </span>
                ) : (
                  <span className="text-red-500 font-bold text-xs flex items-center gap-1.5">
                    <FaRegTimesCircle /> Failed
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-semibold text-slate-700">WABA Portfolio Access</span>
                {healthChecks.waba ? (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1.5">
                    <FaCheckCircle /> Passed
                  </span>
                ) : (
                  <span className="text-red-500 font-bold text-xs flex items-center gap-1.5">
                    <FaRegTimesCircle /> Failed
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Phone Number Registration</span>
                {healthChecks.phoneNumber ? (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1.5">
                    <FaCheckCircle /> Passed
                  </span>
                ) : (
                  <span className="text-red-500 font-bold text-xs flex items-center gap-1.5">
                    <FaRegTimesCircle /> Failed
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Webhook Subscription</span>
                {healthChecks.webhook ? (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1.5">
                    <FaCheckCircle /> Active
                  </span>
                ) : (
                  <span className="text-amber-500 font-bold text-xs flex items-center gap-1.5">
                    <FaExclamationCircle /> Pending
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Cloud Messaging API</span>
                {healthChecks.messagingApi ? (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1.5">
                    <FaCheckCircle /> Ready
                  </span>
                ) : (
                  <span className="text-red-500 font-bold text-xs flex items-center gap-1.5">
                    <FaRegTimesCircle /> Offline
                  </span>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setHealthModalOpen(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
