/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface PartImageProps {
  category: string;
  image?: string;
  className?: string;
}

export default function PartImage({ category, image, className = "w-full h-full" }: PartImageProps) {
  // If we have a custom Base64 image or real web link, render that instead of the SVG illustration
  const isCustomImage = image && (image.startsWith("data:") || image.startsWith("http://") || image.startsWith("https://"));

  if (isCustomImage) {
    return (
      <div className={`flex items-center justify-center overflow-hidden bg-slate-900/40 border border-slate-700/50 ${className}`}>
        <img 
          src={image} 
          alt={category} 
          className="w-full h-full object-contain" 
          referrerPolicy="no-referrer" 
        />
      </div>
    );
  }

  // Renders a high-tech custom SVG schematic illustration depending on the spare part category
  const renderIllustration = () => {
    switch (category) {
      case "فرامل":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500 fill-none stroke-current" strokeWidth="2.5">
            {/* Brake pad illustration */}
            <path d="M15,40 C15,30 30,20 50,20 C70,20 85,30 85,40 L80,50 C80,45 68,38 50,38 C32,38 20,45 20,50 Z" fill="currentColor" fillOpacity="0.1" />
            <rect x="25" y="52" width="50" height="15" rx="3" fill="currentColor" fillOpacity="0.2" />
            <circle cx="35" cy="60" r="2" />
            <circle cx="65" cy="60" r="2" />
            <path d="M10,48 L15,40 M90,48 L85,40" strokeWidth="2" />
            <text x="50" y="82" textAnchor="middle" className="text-[8px] font-mono fill-current stroke-none tracking-widest uppercase opacity-70">BRAKE SYS</text>
          </svg>
        );
      case "فلاتر":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500 fill-none stroke-current" strokeWidth="2.5">
            {/* Cylinder Oil filter illustration */}
            <rect x="30" y="20" width="40" height="50" rx="4" fill="currentColor" fillOpacity="0.1" />
            <line x1="30" y1="30" x2="70" y2="30" />
            <line x1="30" y1="60" x2="70" y2="60" />
            <circle cx="50" cy="15" r="5" />
            {/* Ridges on filter */}
            <line x1="38" y1="35" x2="38" y2="55" strokeWidth="1.5" strokeDasharray="2,2" />
            <line x1="46" y1="35" x2="46" y2="55" strokeWidth="1.5" strokeDasharray="2,2" />
            <line x1="54" y1="35" x2="54" y2="55" strokeWidth="1.5" strokeDasharray="2,2" />
            <line x1="62" y1="35" x2="62" y2="55" strokeWidth="1.5" strokeDasharray="2,2" />
            <text x="50" y="82" textAnchor="middle" className="text-[8px] font-mono fill-current stroke-none tracking-widest uppercase opacity-70">FILTER SYS</text>
          </svg>
        );
      case "مساعدات":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-500 fill-none stroke-current" strokeWidth="2.5">
            {/* Shock absorber spring illustration */}
            <rect x="47" y="15" width="6" height="70" fill="currentColor" fillOpacity="0.2" />
            <circle cx="50" cy="15" r="6" />
            <circle cx="50" cy="85" r="6" />
            {/* Coil Spring */}
            <path d="M35,30 C35,30 65,33 65,38 C65,43 35,45 35,50 C35,55 65,58 65,63 C65,68 35,70 35,75" strokeWidth="3" />
            <text x="50" y="96" textAnchor="middle" className="text-[8px] font-mono fill-current stroke-none tracking-widest uppercase opacity-70">SUSPENSION</text>
          </svg>
        );
      case "سيور":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-500 fill-none stroke-current" strokeWidth="2.5">
            {/* Pulley and belt system */}
            <circle cx="35" cy="40" r="14" fill="currentColor" fillOpacity="0.1" />
            <circle cx="35" cy="40" r="3" />
            <circle cx="68" cy="60" r="10" fill="currentColor" fillOpacity="0.1" />
            <circle cx="68" cy="60" r="2" />
            {/* The serpentine belt looping around them */}
            <path d="M35,26 C53,26 68,50 68,50 M68,70 C50,70 35,54 35,54 M35,26 C21,26 21,54 35,54 M68,50 C78,50 78,70 68,70" strokeWidth="2" strokeDasharray="4,2" />
            <text x="50" y="85" textAnchor="middle" className="text-[8px] font-mono fill-current stroke-none tracking-widest uppercase opacity-70">DRIVE BELT</text>
          </svg>
        );
      case "محرك":
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-500 fill-none stroke-current" strokeWidth="2.5">
            {/* Piston/Engine schematic spark plug */}
            <rect x="42" y="20" width="16" height="35" rx="2" fill="currentColor" fillOpacity="0.1" />
            <rect x="35" y="15" width="30" height="5" />
            <line x1="50" y1="55" x2="50" y2="80" strokeWidth="4" />
            <circle cx="50" cy="80" r="4" fill="currentColor" />
            <path d="M45,25 L55,25 M45,35 L55,35 M45,45 L55,45" strokeWidth="1.5" />
            <path d="M48,15 L50,8 L52,15" strokeWidth="1.5" />
            <text x="50" y="93" textAnchor="middle" className="text-[8px] font-mono fill-current stroke-none tracking-widest uppercase opacity-70">IGNITION</text>
          </svg>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center p-3 bg-slate-900/40 rounded-xl border border-slate-700/50 ${className}`}>
      {renderIllustration()}
    </div>
  );
}
