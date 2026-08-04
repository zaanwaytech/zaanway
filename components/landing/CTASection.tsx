"use client";

import React from "react";
import { FiArrowRight, FiPlay } from "react-icons/fi";
import { FaRocket } from "react-icons/fa";

const CTASection = () => {
  return (
    <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1C1F26] rounded-[2.5rem] p-10 md:p-16 lg:p-20 relative overflow-hidden shadow-2xl">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            
            <div className="flex items-start gap-6 lg:gap-8 max-w-2xl">
              <div className="hidden sm:flex shrink-0 w-20 h-20 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 items-center justify-center">
                <FaRocket className="w-10 h-10 text-emerald-400 -rotate-12" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                  Ready to Automate Your Business?
                </h2>
                <p className="text-lg text-gray-400 max-w-xl">
                  Start your free trial today and experience the power of automation.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0">
              <button className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">
                Start 14-Day Free Trial
                <FiArrowRight className="w-5 h-5" />
              </button>
              <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-8 py-4 rounded-xl transition-all">
                Book a Demo
                <FiPlay className="w-5 h-5" />
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
