"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";

interface FullPageLoaderProps {
  message?: string;
}

export default function FullPageLoader({ message = "Loading..." }: FullPageLoaderProps) {
  const { theme } = useTheme();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${
      theme === "dark" 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
    }`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%234F46E5' fill-opacity='0.1'%3e%3ccircle cx='7' cy='7' r='7'/%3e%3ccircle cx='53' cy='7' r='7'/%3e%3ccircle cx='7' cy='53' r='7'/%3e%3ccircle cx='53' cy='53' r='7'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative flex flex-col items-center space-y-8">
        {/* Logo with heartbeat animation */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <div className={`absolute inset-0 rounded-2xl blur-xl opacity-30 ${
            theme === "dark" ? "bg-blue-400" : "bg-blue-500"
          }`} />
          <div className={`relative p-6 rounded-2xl border backdrop-blur-sm ${
            theme === "dark" 
              ? "bg-gray-800/50 border-gray-700" 
              : "bg-white/80 border-gray-200"
          }`}>
            <Image
              src="/images/rf-logo.svg"
              alt="Remis Fantasy"
              width={80}
              height={80}
              className="w-20 h-20"
              priority
            />
          </div>
        </motion.div>

        {/* Loading text */}
        <div className="text-center space-y-3">
          <motion.h3 
            className={`text-xl font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Remis Fantasy
          </motion.h3>
          
          <motion.p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {message}
          </motion.p>
        </div>

        {/* Heartbeat indicator */}
        <motion.div className="flex items-center space-x-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full ${
                theme === "dark" ? "bg-blue-400" : "bg-blue-500"
              }`}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div 
          className={`w-48 h-1 rounded-full overflow-hidden ${
            theme === "dark" ? "bg-gray-700" : "bg-gray-200"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className={`h-full rounded-full ${
              theme === "dark" ? "bg-blue-400" : "bg-blue-500"
            }`}
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}