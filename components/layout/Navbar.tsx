"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-wagner-black/95 backdrop-blur-sm border-b-2 border-wagner-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="font-heading text-2xl text-wagner-orange tracking-wider">
              IRON DISCIPLINE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#about"
              className="font-heading text-wagner-white hover:text-wagner-orange transition-colors tracking-wider"
            >
              ABOUT
            </Link>
            <Link
              href="#program"
              className="font-heading text-wagner-white hover:text-wagner-orange transition-colors tracking-wider"
            >
              PROGRAM
            </Link>
            <Link
              href="#results"
              className="font-heading text-wagner-white hover:text-wagner-orange transition-colors tracking-wider"
            >
              RESULTS
            </Link>
            <Button variant="brutal" size="sm">
              START NOW
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-wagner-white p-2"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t-2 border-wagner-gray">
            <div className="flex flex-col gap-4">
              <Link
                href="#about"
                className="font-heading text-wagner-white hover:text-wagner-orange transition-colors tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                ABOUT
              </Link>
              <Link
                href="#program"
                className="font-heading text-wagner-white hover:text-wagner-orange transition-colors tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                PROGRAM
              </Link>
              <Link
                href="#results"
                className="font-heading text-wagner-white hover:text-wagner-orange transition-colors tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                RESULTS
              </Link>
              <Button variant="brutal" size="md" className="w-full">
                START NOW
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}