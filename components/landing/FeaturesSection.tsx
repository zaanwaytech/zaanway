"use client";

import React from "react";
import { FaWhatsapp, FaRobot, FaProjectDiagram, FaChartLine, FaPlug, FaChartBar, FaArrowRight } from "react-icons/fa";

const FeaturesSection = () => {
  const features = [
    {
      title: "WhatsApp Automation",
      description: "Automate replies, broadcasts, lead capture, and CRM sync.",
      icon: <FaWhatsapp className="w-6 h-6 text-emerald-500" />,
      color: "bg-emerald-50",
      link: "#"
    },
    {
      title: "AI Agents",
      description: "Smart AI agents to chat, qualify leads and book meetings.",
      icon: <FaRobot className="w-6 h-6 text-blue-500" />,
      color: "bg-blue-50",
      link: "#"
    },
    {
      title: "Workflow Automation",
      description: "Connect your apps and automate any business process.",
      icon: <FaProjectDiagram className="w-6 h-6 text-purple-500" />,
      color: "bg-purple-50",
      link: "#"
    },
    {
      title: "CRM & Pipeline",
      description: "Manage leads, deals, and customers in one place.",
      icon: <FaChartLine className="w-6 h-6 text-orange-500" />,
      color: "bg-orange-50",
      link: "#"
    },
    {
      title: "Integrations",
      description: "Seamlessly connect with 100+ tools and platforms.",
      icon: <FaPlug className="w-6 h-6 text-yellow-500" />,
      color: "bg-yellow-50",
      link: "#"
    },
    {
      title: "Analytics & Reports",
      description: "Track performance and get actionable insights.",
      icon: <FaChartBar className="w-6 h-6 text-pink-500" />,
      color: "bg-pink-50",
      link: "#"
    }
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Powerful Automations. One Simple Platform.
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to automate and grow—powerful, easy, and built for results.
            </p>
          </div>
          <a href="#" className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 transition-colors group whitespace-nowrap">
            Explore All Features
            <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-8 rounded-2xl border border-gray-100 hover:border-emerald-100 bg-white hover:bg-emerald-50/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {feature.description}
              </p>
              <a href={feature.link} className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                Learn more
                <FaArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
