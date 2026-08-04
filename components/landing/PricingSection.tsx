"use client";

import React, { useState } from "react";
import { FiCheck } from "react-icons/fi";

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small businesses just getting started.",
      priceMonthly: "2,999",
      priceYearly: "2,399",
      features: [
        "Up to 2,000 Contacts",
        "1 WhatsApp Number",
        "Basic Automations",
        "Email Support",
      ],
      buttonText: "Start Free Trial",
      popular: false,
    },
    {
      name: "Growth",
      description: "For growing businesses that need more power.",
      priceMonthly: "6,999",
      priceYearly: "5,599",
      features: [
        "Up to 10,000 Contacts",
        "2 WhatsApp Numbers",
        "Advanced Automations",
        "CRM & Pipeline",
        "Priority Support",
      ],
      buttonText: "Start Free Trial",
      popular: true,
    },
    {
      name: "Business",
      description: "For businesses looking to scale their operations.",
      priceMonthly: "12,999",
      priceYearly: "10,399",
      features: [
        "Up to 50,000 Contacts",
        "5 WhatsApp Numbers",
        "Advanced Automations",
        "CRM & Pipeline",
        "Custom Integrations",
        "Priority Support",
      ],
      buttonText: "Start Free Trial",
      popular: false,
    },
    {
      name: "Enterprise",
      description: "For large businesses with custom needs.",
      priceMonthly: "Custom",
      priceYearly: "Custom",
      features: [
        "Unlimited Contacts",
        "Unlimited WhatsApp Numbers",
        "Custom Automations",
        "Advanced Integrations",
        "Dedicated Account Manager",
        "24/7 Premium Support",
      ],
      buttonText: "Contact Sales",
      popular: false,
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that's right for you. Cancel anytime.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <button 
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isYearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${isYearly ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Yearly <span className={`${isYearly ? 'text-emerald-200' : 'text-emerald-600'}`}>(Save 20%)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative rounded-3xl p-8 transition-transform hover:-translate-y-2 duration-300 flex flex-col ${plan.popular ? 'bg-white border-2 border-emerald-500 shadow-xl' : 'bg-white border border-gray-200 hover:shadow-lg hover:border-gray-300'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-500 mb-6 h-10">{plan.description}</p>
              
              <div className="mb-8">
                {plan.priceMonthly === "Custom" ? (
                  <div className="text-4xl font-extrabold text-gray-900">Custom</div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">₹{isYearly ? plan.priceYearly : plan.priceMonthly}</span>
                    <span className="text-gray-500 font-medium mb-1">/month</span>
                  </div>
                )}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <FiCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${plan.popular ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center flex items-center justify-center gap-2 text-gray-600 text-sm font-medium">
          <FiCheck className="text-emerald-500 w-5 h-5" />
          14-Day Money-Back Guarantee. No questions asked.
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
