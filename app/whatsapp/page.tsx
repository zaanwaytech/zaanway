"use client";
import React, { useState, useEffect } from "react";
import FacebookSDK from "@/components/FacebookSDK";
import ConnectWhatsAppButton from "@/components/whatsapp/ConnectWhatsAppButton";
import {
  FaWhatsapp,
  FaCheckCircle,
  FaRobot,
  FaPlus,
  FaTrash,
  FaSave,
  FaCalendarAlt,
  FaClock,
  FaBuilding,
  FaUser,
  FaPhone,
  FaCog
} from "react-icons/fa";

interface Settings {
  turfName: string;
  openTime: string;
  closeTime: string;
  welcomeMessage: string;
}

interface KeywordRule {
  _id: string;
  keyword: string;
  reply: string;
}

interface Booking {
  _id: string;
  customerPhone: string;
  customerName: string;
  date: string;
  timeSlot: string;
  createdAt: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, "0");
  return `${h}:00`;
});

export default function WhatsAppPage() {
  const [users, setUsers] = useState<{ _id: string; name: string; phoneNumberId?: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [fetchingUsers, setFetchingUsers] = useState(true);

  const [settings, setSettings] = useState<Settings>({
    turfName: "ABC Turf",
    openTime: "06:00",
    closeTime: "22:00",
    welcomeMessage: "Welcome to ABC Turf! ⚽🏏\n\nClick the button below to book a slot.",
  });
  const [keywords, setKeywords] = useState<KeywordRule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<{
    connected: boolean;
    displayPhoneNumber?: string;
    verifiedName?: string;
    platform?: string;
    error?: any;
  } | null>(null);

  const [newKeyword, setNewKeyword] = useState("");
  const [newReply, setNewReply] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingKeyword, setSavingKeyword] = useState(false);

  // Fetch users/clients list
  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      const res = await fetch("/api/whatsapp/users");
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
        if (data.users.length > 0) {
          setSelectedUserId((prev) => {
            const exists = data.users.some((u: any) => u._id === prev);
            return exists ? prev : data.users[0]._id;
          });
        } else {
          setSelectedUserId("");
        }
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setFetchingUsers(false);
    }
  };

  // Fetch all dashboard data for selected client
  const fetchData = async () => {
    if (!selectedUserId) {
      setKeywords([]);
      setBookings([]);
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userParam = `?userId=${selectedUserId}`;

      // Fetch Settings
      const settingsRes = await fetch(`/api/whatsapp/settings${userParam}`);
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.settings) {
        setSettings(settingsData.settings);
      }

      // Fetch Keywords
      const keywordsRes = await fetch(`/api/whatsapp/keywords${userParam}`);
      const keywordsData = await keywordsRes.json();
      if (keywordsData.success) {
        setKeywords(keywordsData.keywords);
      }

      // Fetch Bookings
      const bookingsRes = await fetch(`/api/whatsapp/bookings${userParam}`);
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.bookings);
      }

      // Fetch Connection Status
      try {
        const statusRes = await fetch(`/api/whatsapp/status${userParam}`);
        const statusData = await statusRes.json();
        setStatus(statusData);
      } catch (err) {
        console.error("Error fetching connection status:", err);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchData();
    }
  }, [selectedUserId]);

  // Save Turf Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      setSavingSettings(true);
      const res = await fetch(`/api/whatsapp/settings?userId=${selectedUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        alert("Settings saved successfully!");
      } else {
        alert(data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Save settings error:", error);
      alert("An error occurred while saving settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Add Keyword Automation Rule
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newReply.trim() || !selectedUserId) return;

    try {
      setSavingKeyword(true);
      const res = await fetch(`/api/whatsapp/keywords?userId=${selectedUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword, reply: newReply }),
      });
      const data = await res.json();
      if (data.success) {
        setNewKeyword("");
        setNewReply("");
        // Reload keywords
        const keywordsRes = await fetch(`/api/whatsapp/keywords?userId=${selectedUserId}`);
        const keywordsData = await keywordsRes.json();
        if (keywordsData.success) {
          setKeywords(keywordsData.keywords);
        }
      } else {
        alert(data.message || "Failed to add keyword rule");
      }
    } catch (error) {
      console.error("Add keyword error:", error);
    } finally {
      setSavingKeyword(false);
    }
  };

  // Delete Keyword Rule
  const handleDeleteKeyword = async (id: string) => {
    if (!selectedUserId) return;
    if (!confirm("Are you sure you want to delete this auto-reply rule?")) return;
    try {
      const res = await fetch(`/api/whatsapp/keywords?id=${id}&userId=${selectedUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setKeywords(keywords.filter((kw) => kw._id !== id));
      } else {
        alert(data.message || "Failed to delete keyword rule");
      }
    } catch (error) {
      console.error("Delete keyword error:", error);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (id: string) => {
    if (!selectedUserId) return;
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await fetch(`/api/whatsapp/bookings?id=${id}&userId=${selectedUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setBookings(bookings.filter((b) => b._id !== id));
        alert("Booking cancelled successfully.");
      } else {
        alert(data.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Cancel booking error:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-green-50 pb-20">
      <FacebookSDK />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center shadow-md">
            <FaWhatsapp size={40} className="text-green-600" />
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            WhatsApp Automation Dashboard
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            Connect your WhatsApp Business account, customize opening hours, welcome greeting, 
            automated keyword responses, and manage bookings live.
          </p>
        </div>

        {/* Client Account Switcher */}
        <div className="max-w-xl mx-auto mt-10 bg-white rounded-2xl border border-gray-100 shadow-md p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full">
            <span className="font-bold text-gray-700 text-sm whitespace-nowrap">Active Client:</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="border w-full rounded-xl p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-gray-800 text-sm"
            >
              {users.length === 0 ? (
                <option value="">No accounts connected</option>
              ) : (
                users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} {u.phoneNumberId ? `(${u.phoneNumberId})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-10">
          {/* Connect */}
          <div className="rounded-3xl bg-white border border-gray-100 shadow-xl p-8 hover:shadow-2xl transition duration-300">
            <div className="flex items-center gap-3">
              <FaWhatsapp size={24} className="text-green-500" />
              <h2 className="text-xl font-bold text-gray-800">Connect WhatsApp</h2>
            </div>
            <p className="text-gray-600 mt-3 text-sm">
              Link your WhatsApp Business phone number using Meta's official API to start receiving turf queries and bookings automatically.
            </p>
            <div className="mt-6">
              <ConnectWhatsAppButton onConnectSuccess={fetchUsers} />
            </div>
            {status && (
              <div className="mt-6 p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full ${status.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="font-bold text-sm text-gray-800">
                    {status.connected ? "Active WhatsApp Link" : "Meta Link Inactive"}
                  </span>
                </div>
                {status.connected ? (
                  <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-gray-200">
                    <div><strong>Name:</strong> {status.verifiedName}</div>
                    <div><strong>Number:</strong> {status.displayPhoneNumber}</div>
                    <div><strong>Engine:</strong> {status.platform}</div>
                  </div>
                ) : (
                  <div className="text-xs text-red-500 pt-1 border-t border-gray-200">
                    <strong>Notice:</strong> Please configure your Meta credentials or complete connection.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Setup / Features Summary */}
          <div className="rounded-3xl bg-white border border-gray-100 shadow-xl p-8 hover:shadow-2xl transition duration-300">
            <h2 className="text-xl font-bold text-gray-800">Bot Automation Mode</h2>
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <FaCheckCircle className="text-green-500 flex-shrink-0" />
                <span><strong>Instant Booking Flow:</strong> Welcome message with "Book Now" interactive button.</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <FaCheckCircle className="text-green-500 flex-shrink-0" />
                <span><strong>Dynamic Slotting:</strong> Fetches available 1-hour slots matching opening/closing times.</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <FaCheckCircle className="text-green-500 flex-shrink-0" />
                <span><strong>Keyword Responses:</strong> Auto-reply to custom keywords configured by you.</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent mb-4"></div>
            <p>Loading automation details...</p>
          </div>
        ) : (
          <div className="space-y-12 mt-12">
            {/* Turf Settings Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <FaCog size={22} className="text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Turf Booking Configuration</h2>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Turf Name</label>
                    <input
                      type="text"
                      className="border w-full rounded-xl p-3 bg-gray-55 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={settings.turfName}
                      onChange={(e) => setSettings({ ...settings, turfName: e.target.value })}
                      placeholder="e.g. ABC Turf"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Opening Time</label>
                    <select
                      className="border w-full rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={settings.openTime}
                      onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                    >
                      {HOURS.map((hr) => (
                        <option key={`open-${hr}`} value={hr}>
                          {hr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Closing Time</label>
                    <select
                      className="border w-full rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={settings.closeTime}
                      onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                    >
                      {HOURS.map((hr) => (
                        <option key={`close-${hr}`} value={hr}>
                          {hr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    WhatsApp Welcome greeting message
                  </label>
                  <textarea
                    rows={4}
                    className="border w-full rounded-xl p-3 bg-gray-55 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    value={settings.welcomeMessage}
                    onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                    placeholder="Welcome message..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use <code className="bg-gray-100 px-1 py-0.5 rounded">{`{name}`}</code> to dynamically insert the customer's WhatsApp profile name.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow transition duration-200"
                >
                  <FaSave />
                  {savingSettings ? "Saving Settings..." : "Save Settings"}
                </button>
              </form>
            </div>

            {/* Keyword Bot Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <FaRobot size={22} className="text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">Automated Keyword Responses</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Form to add */}
                <form onSubmit={handleAddKeyword} className="space-y-4 md:col-span-1 border-r pr-0 md:pr-8 border-gray-100">
                  <h3 className="font-bold text-gray-800 text-base mb-2">Add Auto-Reply Rule</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Incoming Keyword</label>
                    <input
                      type="text"
                      className="border w-full rounded-xl p-3 bg-gray-55 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="e.g. bro"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Bot Response</label>
                    <textarea
                      rows={3}
                      className="border w-full rounded-xl p-3 bg-gray-55 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="e.g. Welcome to ABC Turf! Let us know how we can help you."
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingKeyword}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold p-3 rounded-xl flex items-center justify-center gap-2 shadow transition duration-200 text-sm"
                  >
                    <FaPlus />
                    {savingKeyword ? "Adding Rule..." : "Add Rule"}
                  </button>
                </form>

                {/* List rules */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-bold text-gray-800 text-base">Active Rules ({keywords.length})</h3>
                  {keywords.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No custom keyword rules defined. Send "hi" to trigger the booking flow.</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                      {keywords.map((kw) => (
                        <div
                          key={kw._id}
                          className="flex items-start justify-between p-4 rounded-xl border bg-gray-50 hover:bg-gray-100 transition"
                        >
                          <div className="space-y-1">
                            <span className="inline-block bg-purple-100 text-purple-800 font-bold text-xs px-2 py-0.5 rounded-full">
                              Keyword: {kw.keyword}
                            </span>
                            <p className="text-sm text-gray-700 font-mono mt-1 whitespace-pre-wrap">{kw.reply}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteKeyword(kw._id)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                            title="Delete rule"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <FaCalendarAlt size={22} className="text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Recent WhatsApp Bookings</h2>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  <FaCalendarAlt size={32} className="mx-auto text-gray-300 mb-3" />
                  No bookings received yet from WhatsApp.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-l-xl">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Booking Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Time Slot
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Booked At
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider rounded-r-xl">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-sm">
                      {bookings.map((booking) => {
                        const bookedDate = new Date(booking.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                        const bookedTime = new Date(booking.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return (
                          <tr key={booking._id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <FaUser className="text-gray-400 size-3" />
                                {booking.customerName || "Customer"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              <div className="flex items-center gap-2">
                                <FaPhone className="text-gray-400 size-3" />
                                {booking.customerPhone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-green-500 size-3" />
                                {bookedDate}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-bold">
                              <div className="flex items-center gap-2">
                                <FaClock className="text-blue-500 size-3" />
                                {booking.timeSlot}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                              {bookedTime}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => handleCancelBooking(booking._id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 font-semibold px-3 py-1.5 rounded-lg transition"
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}