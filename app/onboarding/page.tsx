"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiZendesk } from "react-icons/si";
import {
  FaBuilding,
  FaWhatsapp,
  FaCog,
  FaRobot,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
} from "react-icons/fa";
import ConnectWhatsAppButton from "@/components/whatsapp/ConnectWhatsAppButton";
import FacebookSDK from "@/components/FacebookSDK";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("Curtains");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState("09:00 - 18:00");
  
  // WhatsApp Connection State
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");

  // Welcome Automation State
  const [welcomeText, setWelcomeText] = useState("Hello 👋 Welcome to our store!");
  const [buttons, setButtons] = useState(["Products", "Services", "Talk to Agent"]);

  // Guard: check if user logged in
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.success) {
          router.push("/login");
        } else {
          // prefill workspace name with user's name if empty
          setBusinessName(data.user.name ? `${data.user.name}'s Business` : "My Business");
        }
      } catch {
        router.push("/login");
      } finally {
        setCheckingSession(false);
      }
    }
    checkUser();
  }, [router]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };



  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Update Current Workspace
      const workspaceRes = await fetch("/api/workspaces", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName,
          industry,
          businessDescription: description,
          address,
          website,
          hours,
        }),
      });
      const workspaceData = await workspaceRes.json();
      if (!workspaceData.success) {
        throw new Error(workspaceData.message || "Failed to update workspace");
      }

      const activeWorkspace = workspaceData.workspace;

      // 2. Save Custom Automation Flow
      await fetch("/api/whatsapp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace._id,
          businessName,
          welcomeMessage: welcomeText,
          buttons,
        }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error).message || "Onboarding failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <FacebookSDK />
      {/* Top Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 text-white p-1 rounded-lg">
            <SiZendesk className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-800">Zaanway Onboarding</span>
        </div>
        <div className="text-sm font-semibold text-slate-500">
          Step {currentStep} of 4
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1">
        <div
          className="bg-emerald-500 h-1 transition-all duration-300"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        ></div>
      </div>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-2xl w-full p-8 md:p-10 transition-all duration-300">
          
          {/* Step 1: Create Business */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <FaBuilding className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Create your business workspace</h2>
                  <p className="text-slate-500 text-sm">Tell us about your business to get started.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-medium"
                    placeholder="e.g. ABC Curtains & Blinds"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    <option value="Curtains">Curtains / Furniture Shop</option>
                    <option value="Restaurant">Restaurant / Cafe</option>
                    <option value="Clinic">Medical Clinic</option>
                    <option value="Salon">Salon & Spa</option>
                    <option value="Auto">Auto Rental</option>
                    <option value="Hotel">Hotel / Stay</option>
                    <option value="Retail">Retail Store</option>
                    <option value="Other">Other Business</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Connect WhatsApp */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <FaWhatsapp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Connect WhatsApp Business</h2>
                  <p className="text-slate-500 text-sm">Link your phone number to receive messages instantly.</p>
                </div>
              </div>

              <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50">
                {whatsappConnected ? (
                  <div className="space-y-4">
                    <div className="flex justify-center text-emerald-500">
                      <FaCheckCircle className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">WhatsApp Connected!</h3>
                      <p className="text-sm text-slate-500 mt-1">Number: {whatsappNumber}</p>
                    </div>
                    <div className="text-xs text-slate-400 bg-slate-100 p-2 rounded-lg inline-block text-left font-mono">
                      <div>WABA ID: {wabaId}</div>
                      <div>Phone ID: {phoneNumberId}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-600 text-sm mb-4">
                      Zaanway uses the official Meta Embedded Signup to securely authorize your WhatsApp number.
                    </p>
                    <div className="flex justify-center">
                      <ConnectWhatsAppButton
                        onConnectSuccess={(account: {
                          wabaId: string;
                          phoneNumberId: string;
                          displayPhoneNumber: string;
                        }) => {
                          setWabaId(account.wabaId);
                          setPhoneNumberId(account.phoneNumberId);
                          setWhatsappNumber(account.displayPhoneNumber);
                          setWhatsappConnected(true);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Configure Business details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <FaCog className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Configure business information</h2>
                  <p className="text-slate-500 text-sm">Fill in details displayed to customers.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Business Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm"
                    placeholder="We offer premium custom blackout curtains & sofa upholstery..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Business Hours</label>
                    <input
                      type="text"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm"
                      placeholder="e.g. 09:00 - 18:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm"
                      placeholder="e.g. https://mycurtains.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm"
                    placeholder="123 Main Street, Industrial Area, Sector 5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Create first Welcome Automation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <FaRobot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Set up your welcome chatbot</h2>
                  <p className="text-slate-500 text-sm">Design the automated replies customers receive when they text you &quot;Hi&quot;.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-800">
                  <strong>Trigger condition:</strong> Triggered automatically when an incoming message contains <em>&quot;hi&quot;</em>, <em>&quot;hello&quot;</em>, or <em>&quot;hey&quot;</em>.
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Greeting Text</label>
                  <textarea
                    rows={3}
                    value={welcomeText}
                    onChange={(e) => setWelcomeText(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm font-sans"
                    placeholder="Welcome greeting..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Reply Buttons (Max 3)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {buttons.map((btn, index) => (
                      <input
                        key={index}
                        type="text"
                        value={btn}
                        onChange={(e) => {
                          const copy = [...buttons];
                          copy[index] = e.target.value;
                          setButtons(copy);
                        }}
                        className="border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs font-semibold text-center"
                        placeholder={`Button ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
            {currentStep > 1 ? (
              <button
                onClick={handlePrev}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 font-bold transition disabled:opacity-50"
              >
                <FaArrowLeft /> Back
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !businessName}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Next <FaArrowRight />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading || !businessName}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  "Go to Dashboard!"
                )}
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        © 2026 Zaanway. All rights reserved.
      </footer>
    </div>
  );
}
