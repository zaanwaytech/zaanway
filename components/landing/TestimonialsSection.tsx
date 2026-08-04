"use client";

import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaStar } from "react-icons/fa";

const TestimonialsSection = () => {
  const testimonials = [
    {
      content: "Zaanway's automation has transformed our business. We save 20+ hours every week and our response time is faster than ever!",
      author: "Ramesh K.",
      role: "Owner, ABC Traders",
      avatarSeed: "20"
    },
    {
      content: "Their WhatsApp automation and AI agents are game-changers. Highly recommended for any growing business.",
      author: "Priya N.",
      role: "Marketing Head, TechNova",
      avatarSeed: "45"
    },
    {
      content: "Professional team, great support, and amazing results. Our sales have increased by 2x!",
      author: "Anas P.",
      role: "CEO, GreenLeaf Organics",
      avatarSeed: "12"
    }
  ];

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Loved by Businesses
          </h2>
          <p className="text-lg text-gray-600">
            See what our customers have to say about us.
          </p>
        </div>

        <div className="relative">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex-1 relative group hover:-translate-y-1 transition-transform duration-300">
                <div className="flex text-amber-400 mb-6 gap-1">
                  {[1, 2, 3, 4, 5].map(i => <FaStar key={i} className="w-4 h-4" />)}
                </div>
                <p className="text-gray-700 text-lg leading-relaxed mb-8">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.avatarSeed}`} 
                      alt={testimonial.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.author}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 lg:-left-16 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 text-gray-600 hover:text-emerald-600 hover:scale-110 cursor-pointer transition-all">
            <FiChevronLeft className="w-6 h-6" />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 lg:-right-16 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 text-gray-600 hover:text-emerald-600 hover:scale-110 cursor-pointer transition-all">
            <FiChevronRight className="w-6 h-6" />
          </div>
        </div>
        
        <div className="flex justify-center mt-12 gap-2">
          <div className="w-8 h-2 rounded-full bg-emerald-500"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
