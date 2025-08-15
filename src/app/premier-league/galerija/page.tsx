'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Camera } from 'lucide-react'

export default function GalerijaPage() {
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen py-20 px-4 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }`}>
      <div className="max-w-6xl mx-auto text-center">
        <h1 className={`text-4xl md:text-6xl font-black mb-8 ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          Premier League Galerija
        </h1>
        
        <div className={`p-12 rounded-2xl backdrop-blur-lg border ${
          theme === 'dark'
            ? 'bg-gray-800/50 border-gray-700'
            : 'bg-white/60 border-orange-200'
        }`}>
          <div className="mb-6">
            <Camera className={`w-16 h-16 mx-auto ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Galerija u pripremi
          </h2>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Uskoro ćete ovdje moći pregledati slike i uspomene iz prethodnih sezona Premier League Fantasy lige. 
            Najuzbudljiviji momenti, ceremonije dodjele nagrada i proslava pobjeda čekaju vas!
          </p>
        </div>
      </div>
    </div>
  )
}