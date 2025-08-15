'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { BarChart3 } from 'lucide-react'

export default function TabelePage() {
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
          Premier League Tabele
        </h1>
        
        <div className={`p-12 rounded-2xl backdrop-blur-lg border ${
          theme === 'dark'
            ? 'bg-gray-800/50 border-gray-700'
            : 'bg-white/60 border-orange-200'
        }`}>
          <div className="mb-6">
            <BarChart3 className={`w-16 h-16 mx-auto ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Tabele u pripremi
          </h2>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Ovdje ćete moći pratiti trenutne rezultate i tabele svih Premier League Fantasy liga. 
            Rezultati se ažuriraju u realnom vremenu kada sezona počne!
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Free Liga', 'H2H Liga', 'Standard Liga', 'Premium Liga'].map((liga, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-white/80 border-orange-300'
                }`}
              >
                <h3 className={`font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  {liga}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Uskoro dostupno
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}