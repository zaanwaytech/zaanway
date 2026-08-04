"use client";

import React from "react";
import { FiChevronDown } from "react-icons/fi";
import { SiZendesk } from "react-icons/si"; // Placeholder for Zaanway logo

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <div className="bg-emerald-500 text-white p-1.5 rounded-lg">
              <SiZendesk className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">Zaanway</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-emerald-600 font-medium text-sm">
              Home
            </a>
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
              Features
            </a>
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                Solutions
                <FiChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </div>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
              Pricing
            </a>
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                Resources
                <FiChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </div>
            <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
              About Us
            </a>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-700 hover:text-gray-900 font-medium text-sm px-4 py-2 transition-colors">
              Log in
            </button>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all hover:shadow-md">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
