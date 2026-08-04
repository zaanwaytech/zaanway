"use client";

import React from "react";
import { FiCheckSquare, FiSettings, FiZap, FiTrendingUp } from "react-icons/fi";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "1",
      title: "Choose a Plan",
      description: "Pick the perfect plan for your business.",
      icon: <FiCheckSquare className="w-6 h-6" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      number: "2",
      title: "Connect & Setup",
      description: "Connect your tools and set up your workflows.",
      icon: <FiSettings className="w-6 h-6" />,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      number: "3",
      title: "Automate",
      description: "We build automations that do the work for you.",
      icon: <FiZap className="w-6 h-6" />,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      number: "4",
      title: "Grow & Scale",
      description: "Save time, increase sales and grow your business.",
      icon: <FiTrendingUp className="w-6 h-6" />,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    }
  ];

  return (
    <section className="py-20 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          
          <div className="md:w-1/4">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">How It Works</h2>
            <p className="text-gray-600">Get started in just a few simple steps.</p>
          </div>

          <div className="md:w-3/4 w-full">
            <div className="flex flex-col md:flex-row justify-between relative">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>
              
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center relative bg-gray-50 px-4 md:px-2 py-4 md:py-0 w-full md:w-1/4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white ${step.bgColor} ${step.color} relative z-10`}>
                    {index % 2 === 0 ? step.icon : <span className="text-xl font-bold">{step.number}</span>}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 max-w-[180px] mx-auto">{step.description}</p>
                  
                  {/* Mobile connecting line */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden w-0.5 h-8 bg-gray-200 my-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
