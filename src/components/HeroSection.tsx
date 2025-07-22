'use client'

import { motion } from 'framer-motion'
import { ArrowDown, Trophy, Shield, Star, Crown } from 'lucide-react'
import Image from 'next/image'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 overflow-hidden">
      {/* Old English Football Pattern Background */}
      <div className="absolute inset-0">
        {/* Classic football field pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(34, 197, 94, 0.1) 50%, transparent 50%),
                linear-gradient(rgba(34, 197, 94, 0.1) 50%, transparent 50%)
              `,
              backgroundSize: '40px 40px'
            }}
          />
        </div>
        
        {/* Traditional football elements */}
        <div className="absolute top-20 left-20 w-32 h-32 border-4 border-emerald-800/20 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 border-2 border-emerald-800/10 rounded-full"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 border-3 border-emerald-800/15 transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 border-3 border-emerald-800/15 transform -translate-y-1/2"></div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/40"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Classic Football Club Style Header */}
          <div className="mb-16">
            {/* Logo and Club Name */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12"
            >
              {/* Traditional Club Crest */}
              <div className="relative w-48 h-48 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-800 rounded-full shadow-2xl border-8 border-white"></div>
                <div className="absolute inset-2 bg-gradient-to-tr from-white via-slate-50 to-white rounded-full shadow-inner"></div>
                
                {/* Logo */}
                <div className="absolute inset-6 flex items-center justify-center">
                  <Image
                    src="/images/rf-no-bg.png"
                    alt="Remis Fantasy Logo"
                    width={120}
                    height={120}
                    className="w-full h-full object-contain drop-shadow-lg"
                    priority
                  />
                </div>
                
                {/* Traditional border decorations */}
                <div className="absolute -inset-2">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 bg-emerald-700 rounded-full shadow-lg"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 30}deg) translateY(-100px) translateX(-6px)`
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Main Title - Old English Football Style */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-8"
            >
              <h1 
                className="text-8xl md:text-9xl font-bold mb-4 text-emerald-900 leading-none tracking-tighter"
                style={{ fontFamily: 'Russo One, sans-serif' }}
              >
                REMIS
              </h1>
              <h2 
                className="text-4xl md:text-5xl font-bold text-emerald-800 tracking-wider mb-6"
                style={{ fontFamily: 'Russo One, sans-serif' }}
              >
                FANTASY FOOTBALL
              </h2>
              
              {/* Traditional underline decoration */}
              <div className="flex justify-center items-center gap-4 mb-8">
                <div className="h-px bg-gradient-to-r from-transparent to-emerald-700 w-24"></div>
                <Trophy className="w-8 h-8 text-emerald-700" />
                <div className="h-px bg-gradient-to-l from-transparent to-emerald-700 w-24"></div>
              </div>
            </motion.div>

            {/* Tradition Text - English Football Heritage Style */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="max-w-4xl mx-auto mb-12"
            >
              {/* Heritage Badge */}
              <div className="inline-flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 rounded-full px-6 py-2 mb-6 shadow-lg">
                <Shield className="w-5 h-5 text-emerald-700" />
                <span className="text-emerald-800 font-bold text-sm tracking-wider">EST. 2018</span>
                <Star className="w-5 h-5 text-emerald-700" />
              </div>

              {/* Traditional Club Description */}
              <div className="space-y-6">
                <h3 
                  className="text-2xl md:text-3xl font-bold text-emerald-800 mb-4"
                  style={{ fontFamily: 'Russo One, sans-serif' }}
                >
                  "Where Legends Are Forged"
                </h3>
                
                <div className="text-lg md:text-xl text-slate-700 leading-relaxed space-y-4 font-medium">
                  <p>
                    Since our founding in <strong>2018</strong>, the <strong>Remis Fantasy Football League</strong> has stood as the pinnacle of competitive fantasy football. 
                    Built upon the traditions of English football heritage, our league combines the tactical depth of the beautiful game 
                    with the strategic brilliance that only true champions possess.
                  </p>
                  
                  <p>
                    For <strong>seven magnificent seasons</strong>, we have witnessed extraordinary battles, legendary comebacks, 
                    and moments of pure football genius. Each season writes its own chapter in our storied history, 
                    where strategy meets passion, and only the most dedicated rise to claim their place in our 
                    <strong>Hall of Champions</strong>.
                  </p>
                  
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-lg shadow-sm">
                    <p className="text-emerald-800 font-semibold italic text-center">
                      "In the grand tradition of English football, we honor the past, 
                      celebrate the present, and forge the future of fantasy football excellence."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Call-to-Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <motion.button
              className="group relative bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 hover:from-emerald-800 hover:via-emerald-700 hover:to-green-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-xl border-2 border-emerald-500/30"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 15px 30px rgba(34, 197, 94, 0.4)" 
              }}
              whileTap={{ scale: 0.95 }}
              style={{ fontFamily: 'Russo One, sans-serif' }}
              onClick={() => {
                document.querySelector('#registration')?.scrollIntoView({ 
                  behavior: 'smooth' 
                })
              }}
            >
              <span className="relative z-10 flex items-center gap-3">
                <Trophy className="w-5 h-5" />
                JOIN THE LEAGUE
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.button>
            
            <motion.button
              className="group relative border-2 border-emerald-600/50 text-emerald-700 hover:text-white hover:border-emerald-500 hover:bg-emerald-600/10 px-10 py-4 rounded-lg font-bold text-lg transition-all duration-300 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 10px 25px rgba(34, 197, 94, 0.2)" 
              }}
              whileTap={{ scale: 0.95 }}
              style={{ fontFamily: 'Russo One, sans-serif' }}
              onClick={() => {
                document.querySelector('#champions')?.scrollIntoView({ 
                  behavior: 'smooth' 
                })
              }}
            >
              <span className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                VIEW CHAMPIONS
              </span>
            </motion.button>
          </motion.div>

          {/* Season History */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            {['2018/19', '2019/20', '2020/21', '2021/22'].map((season, index) => (
              <motion.div
                key={season}
                className="bg-emerald-50/80 border border-emerald-200/60 rounded-lg px-4 py-3 text-center backdrop-blur-sm shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(236, 253, 245, 0.9)" }}
              >
                <div className="text-sm font-bold text-emerald-800" style={{ fontFamily: 'Russo One, sans-serif' }}>
                  {season}
                </div>
                <div className="text-xs text-emerald-600">Season</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-slate-400 dark:text-slate-500"
          >
            <ArrowDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}