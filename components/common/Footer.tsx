"use client";

import React from "react";
import { SiZendesk } from "react-icons/si";
import { FaLinkedin, FaInstagram, FaYoutube, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaRegPlayCircle, FaArrowRight } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6"; // Standard X/Twitter icon

const Footer = () => {
  return (
    <footer className="bg-[#0b1110] text-gray-300 pb-6 mt-24">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CTA Banner */}
        <div className="bg-[#0a1512] border border-gray-800 rounded-2xl p-6 md:p-8 mb-16 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden -mt-16 md:-mt-20 z-20">
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-full bg-[#c1f3d4] flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h3 className="text-white text-xl font-bold mb-1">Ready to Automate Your Business?</h3>
              <p className="text-gray-400 text-sm">Start your free trial today and experience the power of automation.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <button className="bg-[#16a34a] hover:bg-[#15803d] text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
              Start 14-Day Free Trial <FaArrowRight className="w-3.5 h-3.5" />
            </button>
            <button className="text-white hover:text-gray-300 px-4 py-2.5 font-medium transition-colors flex items-center gap-2 text-sm">
              Book a Demo <FaRegPlayCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4 cursor-pointer">
              <div className="text-[#16a34a]">
                <SiZendesk className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">Zaanway</span>
            </div>
            <p className="text-gray-400 mb-6 text-xs leading-relaxed pr-2">
              We help businesses automate their processes, save time, and scale faster with AI-powered automation solutions.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-7 h-7 rounded-full border border-gray-700 flex items-center justify-center hover:bg-[#16a34a] hover:border-[#16a34a] hover:text-white transition-colors group">
                <FaXTwitter className="w-3 h-3 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full border border-gray-700 flex items-center justify-center hover:bg-[#16a34a] hover:border-[#16a34a] hover:text-white transition-colors group">
                <FaLinkedin className="w-3 h-3 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full border border-gray-700 flex items-center justify-center hover:bg-[#16a34a] hover:border-[#16a34a] hover:text-white transition-colors group">
                <FaInstagram className="w-3 h-3 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full border border-gray-700 flex items-center justify-center hover:bg-[#16a34a] hover:border-[#16a34a] hover:text-white transition-colors group">
                <FaYoutube className="w-3 h-3 text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Features</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Pricing</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Integrations</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Changelog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">About Us</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Careers</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Blog</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Documentation</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Help Center</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Templates</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">API Reference</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#16a34a] transition-colors text-xs text-gray-400 font-medium">Refund Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm">Contact Us</h4>
            <ul className="space-y-4">
              <li>
                <div className="flex items-start gap-2 text-xs text-gray-400 hover:text-[#16a34a] transition-colors font-medium">
                  <FaEnvelope className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                  <a href="mailto:hello@zaanway.in">hello@zaanway.in</a>
                </div>
              </li>
              <li>
                <div className="flex items-start gap-2 text-xs text-gray-400 hover:text-[#16a34a] transition-colors font-medium">
                  <FaPhoneAlt className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                  <a href="tel:+916235123456">+91 6235 123 456</a>
                </div>
              </li>
              <li>
                <div className="flex items-start gap-2 text-xs text-gray-400 hover:text-[#16a34a] transition-colors font-medium">
                  <FaMapMarkerAlt className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                  <span>Malappuram, Kerala, India</span>
                </div>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="pt-6 border-t border-gray-800 flex items-center justify-center">
          <p className="text-xs text-gray-500 font-medium">
            &copy; 2026 Zaanway Automation Solutions. All rights reserved.
          </p>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;
