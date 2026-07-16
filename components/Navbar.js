"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">

          <Image
            src="/logo.png"
            alt="Zaanway Logo"
            width={50}
            height={50}
            priority
            className="object-contain"
          />

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Zaanway
            </h1>

            <p className="text-xs text-gray-500">
              Digital Business Solutions
            </p>
          </div>

        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-medium">
          {links.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative hover:text-blue-600 transition duration-300 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-blue-600 after:transition-all hover:after:w-full"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Contact Button */}
        <Link
          href="/contact"
          className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition duration-300 shadow-md hover:shadow-lg"
        >
          Contact Us
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-3xl text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <HiX /> : <HiMenu />}
        </button>

      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">

          {links.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-4 border-b hover:bg-gray-100 transition"
            >
              {item.name}
            </Link>
          ))}

          <div className="p-5">
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition"
            >
              Contact Us
            </Link>
          </div>

        </div>
      )}
    </header>
  );
}