"use client";

import React from "react";
import { FiArrowRight, FiCheckCircle, FiPlay } from "react-icons/fi";
import Image from "next/image";

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-3xl opacity-50 z-0 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 text-emerald-700 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              AI-Powered Automation Solutions
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
              Automate Your Business. <br />
              <span className="text-emerald-600">Scale Without Limits.</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
              Build powerful automations, save time, reduce manual work, and grow your business with smart workflows.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-sm transition-all hover:shadow-md group">
                Start 14-Day Free Trial
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-semibold px-8 py-3.5 rounded-xl shadow-sm transition-all hover:shadow-md">
                Book a Demo
                <FiPlay className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-5 h-5 text-emerald-500" />
                <span>No Setup Fee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-5 h-5 text-emerald-500" />
                <span>14-Day Free Trial</span>
              </div>
            </div>
            
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-gray-900">4.9/5</span> (120+ Reviews)
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Content - Mockup */}
          <div className="relative mt-12 lg:mt-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-emerald-50 rounded-[2.5rem] transform rotate-3 scale-105 opacity-50"></div>
            <div className="relative bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-[#1C1F26] p-4 flex items-center justify-between">
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 </div>
              </div>
              <div className="p-6 bg-gray-50 min-h-[400px] flex items-center justify-center border-t border-gray-200">
                <div className="text-center text-gray-400">
                  {/* Dashboard Image Placeholder - normally use next/image here */}
                  <div className="flex flex-col gap-4 w-[350px]">
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                       <div className="bg-green-100 p-2 rounded-lg text-green-600">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                       </div>
                       <div className="text-left">
                         <div className="text-sm font-semibold text-gray-900">Customer Sends WhatsApp</div>
                         <div className="text-xs text-gray-500">New message received</div>
                       </div>
                     </div>
                     <div className="flex justify-center -my-2 text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                     </div>
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-500 flex items-center gap-4 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                       <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                       </div>
                       <div className="text-left">
                         <div className="text-sm font-semibold text-gray-900">AI Agent Responds</div>
                         <div className="text-xs text-emerald-600 font-medium">Instant automated reply</div>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
