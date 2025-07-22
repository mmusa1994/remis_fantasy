'use client'

import { motion } from 'framer-motion'
import { Trophy, Crown, Medal, Star } from 'lucide-react'

const champions = [
  {
    id: 1,
    season: '2023/24',
    name: 'MARKO "LEGEND" PETROVIĆ',
    points: 2387,
    rank: 1,
    badge: 'gold',
    achievement: 'Unprecedented Triple Crown',
    winStreak: 12
  },
  {
    id: 2,
    season: '2022/23', 
    name: 'STEFAN "TACTICIAN" NIKOLIĆ',
    points: 2156,
    rank: 1,
    badge: 'gold',
    achievement: 'Perfect Season Record',
    winStreak: 15
  },
  {
    id: 3,
    season: '2021/22',
    name: 'MILOŠ "STRATEGIST" JOVANOVIĆ',
    points: 2034,
    rank: 1,
    badge: 'gold',
    achievement: 'Comeback King',
    winStreak: 9
  },
  {
    id: 4,
    season: '2020/21',
    name: 'ALEKSANDAR "DOMINATOR" SIMIĆ',
    points: 1987,
    rank: 1,
    badge: 'gold',
    achievement: 'First Ever Champion',
    winStreak: 8
  },
  {
    id: 5,
    season: '2019/20',
    name: 'NIKOLA "MASTERMIND" ĐORĐEVIĆ',
    points: 1876,
    rank: 1,
    badge: 'gold',
    achievement: 'Dynasty Builder',
    winStreak: 7
  },
  {
    id: 6,
    season: '2018/19',
    name: 'LUKA "PIONEER" MILOŠEVIĆ',
    points: 1734,
    rank: 1,
    badge: 'gold',
    achievement: 'League Founder',
    winStreak: 6
  }
]

const getBadgeIcon = (badge: string, rank: number) => {
  const baseClasses = "w-8 h-8"
  if (rank === 1) return <Crown className={`${baseClasses} text-yellow-500`} />
  if (rank === 2) return <Medal className={`${baseClasses} text-gray-400`} />
  if (rank === 3) return <Trophy className={`${baseClasses} text-amber-600`} />
  return <Star className={`${baseClasses} text-blue-500`} />
}

export default function ChampionsShowcase() {
  return (
    <section id="champions" className="relative py-32 bg-gradient-to-b from-slate-950 via-red-950/80 to-slate-900 overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-r from-amber-600/20 via-red-700/15 to-rose-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-l from-red-800/20 via-amber-700/15 to-rose-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M40 20l20 20-20 20-20-20z'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.h2 
            className="text-6xl md:text-7xl font-black mb-6 text-balance leading-tight"
            animate={{
              backgroundImage: [
                "linear-gradient(45deg, #fbbf24, #f59e0b, #d97706)",
                "linear-gradient(45deg, #f59e0b, #d97706, #fbbf24)",
                "linear-gradient(45deg, #d97706, #fbbf24, #f59e0b)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-2xl">
              WALL OF
            </span>
            <br />
            <span className="text-white drop-shadow-2xl">LEGENDS</span>
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-amber-200 font-light max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            🏆 Šest vladara koji su ostavili <span className="text-amber-400 font-bold">neizbrisiv trag</span> u istoriji lige
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {champions.map((champion, index) => (
            <motion.div
              key={champion.id}
              initial={{ opacity: 0, y: 40, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.15,
                type: "spring",
                stiffness: 100
              }}
              className="group perspective-1000"
            >
              <motion.div
                className="relative bg-gradient-to-br from-slate-900/90 via-red-950/80 to-slate-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-500/20 overflow-hidden"
                whileHover={{ 
                  y: -10, 
                  rotateY: 5,
                  boxShadow: "0 25px 50px rgba(245, 158, 11, 0.2)" 
                }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {/* Premium Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/30 via-red-600/20 to-amber-600/30 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Season Badge */}
                <div className="relative z-10 flex items-center justify-between mb-6">
                  <motion.div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black px-4 py-2 rounded-full font-black text-sm"
                    whileHover={{ scale: 1.1 }}
                  >
                    {champion.season}
                  </motion.div>
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Crown className="w-6 h-6 text-amber-900" />
                  </motion.div>
                </div>

                {/* Champion Crown Icon */}
                <div className="relative flex justify-center mb-8">
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-amber-300/50"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    animate={{ 
                      boxShadow: [
                        "0 0 20px rgba(245, 158, 11, 0.3)",
                        "0 0 30px rgba(245, 158, 11, 0.5)",
                        "0 0 20px rgba(245, 158, 11, 0.3)"
                      ]
                    }}
                    transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
                  >
                    <Trophy className="w-12 h-12 text-amber-900" />
                  </motion.div>
                  
                  {/* Floating particles around trophy */}
                  {Array.from({ length: 6 }, (_, i) => {
                    const angle = (i * 60) * (Math.PI / 180);
                    const radius = 40;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    return (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-amber-400/80 rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                        }}
                        animate={{
                          scale: [0.5, 1, 0.5],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Champion Name */}
                <div className="relative z-10 text-center mb-6">
                  <motion.h3 
                    className="text-2xl font-black text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text mb-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    {champion.name}
                  </motion.h3>
                  <motion.p 
                    className="text-amber-400/80 font-semibold text-sm mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    "{champion.achievement}"
                  </motion.p>
                </div>

                {/* Stats */}
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center bg-black/30 rounded-xl px-4 py-3">
                    <span className="text-gray-300 font-semibold">Total Points</span>
                    <motion.span 
                      className="text-2xl font-black text-amber-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                    >
                      {champion.points.toLocaleString()}
                    </motion.span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-black/30 rounded-xl px-4 py-3">
                    <span className="text-gray-300 font-semibold">Win Streak</span>
                    <div className="flex items-center gap-2">
                      <motion.span 
                        className="text-xl font-bold text-red-400"
                        animate={{ color: ["#f87171", "#fbbf24", "#f87171"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {champion.winStreak}
                      </motion.span>
                      <span className="text-sm text-gray-400">games</span>
                    </div>
                  </div>
                </div>

                {/* Premium Bottom Accent */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{
                    background: [
                      "linear-gradient(90deg, #f59e0b, #eab308, #f59e0b)",
                      "linear-gradient(90deg, #eab308, #f59e0b, #eab308)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Ready to Join the Elite?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              The 2025/26 season awaits. Will your name be on the next Wall of Champions?
            </p>
            <motion.button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                document.querySelector('#registration')?.scrollIntoView({ 
                  behavior: 'smooth' 
                })
              }}
            >
              Register Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}