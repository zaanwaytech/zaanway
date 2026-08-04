"use client";

import React from "react";
import { SiGoogle, SiNetflix, SiSpotify, SiAirbnb } from "react-icons/si";
import { FaAmazon, FaFigma } from "react-icons/fa";

const LogoTicker = () => {
  const logos = [
    { name: "tranzact", icon: <SiGoogle className="w-8 h-8" /> },
    { name: "GREENLEAF Organics", icon: <SiNetflix className="w-8 h-8" /> },
    { name: "DreamHome REALTY", icon: <FaAmazon className="w-8 h-8" /> },
    { name: "EduPrime", icon: <SiSpotify className="w-8 h-8" /> },
    { name: "Finova", icon: <FaFigma className="w-8 h-8" /> },
    { name: "UrbanKart", icon: <SiAirbnb className="w-8 h-8" /> },
  ];

  return (
    <section className="py-10 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-gray-500 mb-8 uppercase tracking-wider">
          Trusted by growing businesses
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-800 transition-colors hover:text-emerald-600">
              {logo.icon}
              <span className="font-bold text-lg hidden sm:block">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoTicker;
