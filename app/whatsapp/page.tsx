"use client";
import FacebookSDK from "@/components/FacebookSDK";
import ConnectWhatsAppButton from "@/components/whatsapp/ConnectWhatsAppButton";
import {
  FaWhatsapp,
  FaCheckCircle,
  FaRobot,
  FaArrowRight,
  
} from "react-icons/fa";

export default function WhatsAppPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-green-50">

      {/* Hero */}

      <section className="max-w-7xl mx-auto px-6 py-20">
         <FacebookSDK />

        <div className="text-center">

          <div className="w-24 h-24 rounded-full bg-green-100 mx-auto flex items-center justify-center">

            <FaWhatsapp
              size={48}
              className="text-green-600"
            />

          </div>

          <h1 className="mt-8 text-5xl font-bold">

            WhatsApp Automation

          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">

            Connect your WhatsApp Business account,
            automate replies,
            create AI agents
            and manage customers from one dashboard.

          </p>

        </div>

        <div className="grid md:grid-cols-2 gap-10 mt-20">

          {/* Connect */}

          <div className="rounded-3xl bg-white shadow-xl p-10">

            <h2 className="text-2xl font-bold">

              Connect WhatsApp

            </h2>

            <p className="text-gray-600 mt-4">

              Securely connect your WhatsApp Business account using Meta's official API.

            </p>

            <div className="mt-8">

           <ConnectWhatsAppButton />

            </div>

          </div>

          {/* Features */}

          <div className="rounded-3xl bg-white shadow-xl p-10">

            <h2 className="text-2xl font-bold">

              Included

            </h2>

            <div className="space-y-5 mt-8">

              <div className="flex items-center gap-3">

                <FaCheckCircle className="text-green-500"/>

                Official Meta Cloud API

              </div>

              <div className="flex items-center gap-3">

                <FaCheckCircle className="text-green-500"/>

                Auto Replies

              </div>

              <div className="flex items-center gap-3">

                <FaCheckCircle className="text-green-500"/>

                AI Chatbot

              </div>

              <div className="flex items-center gap-3">

                <FaCheckCircle className="text-green-500"/>

                Broadcast

              </div>

              <div className="flex items-center gap-3">

                <FaCheckCircle className="text-green-500"/>

                CRM

              </div>

            </div>

          </div>

        </div>

        {/* Bot */}

        <div className="bg-white rounded-3xl shadow-xl p-10 mt-14">

          <div className="flex items-center gap-4">

            <FaRobot
              size={28}
              className="text-blue-600"
            />

            <h2 className="text-3xl font-bold">

              Simple Keyword Bot

            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-10">

            <div>

              <label className="font-semibold">

                Keyword

              </label>

              <input
                className="border w-full rounded-xl p-4 mt-2"
                placeholder="hi"
              />

            </div>

            <div>

              <label className="font-semibold">

                Reply

              </label>

              <input
                className="border w-full rounded-xl p-4 mt-2"
                placeholder="Hello 👋 Welcome!"
              />

            </div>

          </div>

          <button
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl flex items-center gap-2"
          >
            Save Bot

            <FaArrowRight/>

          </button>

        </div>

      </section>

    </main>
  );
}