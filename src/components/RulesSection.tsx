'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Calendar, Award, Gift, Users, X, Maximize2 } from 'lucide-react'
import { useState } from 'react'
import React from 'react'

const historyCategories = [
  {
    id: 'gatherings',
    title: 'LEGENDARY GATHERINGS',
    subtitle: 'Epic Moments Together',
    icon: <Users className="w-8 h-8" />,
    color: 'from-purple-600 to-blue-600',
    images: [
      { id: 1, src: '/images/gathering1.jpg', caption: 'Sezonsko okupljanje 2023/24 - Pobjeda Marka "Legend"', year: '2024' },
      { id: 2, src: '/images/gathering2.jpg', caption: 'Draft Night 2022/23 - Strategije se kuju', year: '2023' },
      { id: 3, src: '/images/gathering3.jpg', caption: 'Finalni susret 2021/22 - Drama do poslednjeg kola', year: '2022' },
      { id: 4, src: '/images/gathering4.jpg', caption: 'Celebration 2020/21 - Prva šampionska titula', year: '2021' },
    ]
  },
  {
    id: 'awards',
    title: 'AWARD CEREMONIES',
    subtitle: 'Moments of Glory',
    icon: <Award className="w-8 h-8" />,
    color: 'from-amber-500 to-orange-600',
    images: [
      { id: 5, src: '/images/awards1.jpg', caption: 'Golden Boot ceremony - Stefan "Tactician" prima nagradu', year: '2023' },
      { id: 6, src: '/images/awards2.jpg', caption: 'Manager of the Year - Miloš "Strategist" u čast', year: '2022' },
      { id: 7, src: '/images/awards3.jpg', caption: 'League Champion Trophy - Aleksandar "Dominator"', year: '2021' },
      { id: 8, src: '/images/awards4.jpg', caption: 'Hall of Fame induction - Nikola "Mastermind"', year: '2020' },
    ]
  },
  {
    id: 'promises',
    title: 'PROMISES FULFILLED',
    subtitle: 'Our Word is Bond',
    icon: <Gift className="w-8 h-8" />,
    color: 'from-emerald-500 to-teal-600',
    images: [
      { id: 9, src: '/images/promise1.jpg', caption: 'Premium League Trophy - Hand-crafted crystal masterpiece', year: '2024' },
      { id: 10, src: '/images/promise2.jpg', caption: 'Champions Dinner - 5-star restaurant celebration', year: '2023' },
      { id: 11, src: '/images/promise3.jpg', caption: 'Exclusive Merchandise - Limited edition league jerseys', year: '2022' },
      { id: 12, src: '/images/promise4.jpg', caption: 'VIP Stadium Experience - Manchester United Old Trafford', year: '2021' },
    ]
  }
]

interface ImageData {
  id: number;
  src: string;
  caption: string;
  year: string;
}

export default function RulesSection() {
  const [activeCategory, setActiveCategory] = useState('gatherings')
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const openLightbox = (image: ImageData) => {
    setSelectedImage(image)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setSelectedImage(null)
  }

  const getCurrentCategory = () => {
    return historyCategories.find(cat => cat.id === activeCategory) || historyCategories[0]
  }

  return (
    <>
      <section className="relative py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-red-950/80 overflow-hidden">
        {/* Epic Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-purple-600/20 via-blue-600/15 to-amber-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-l from-amber-700/20 via-red-700/15 to-purple-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          {/* Floating particles */}
          <div className="absolute inset-0">
            {Array.from({ length: 30 }, (_, i) => {
              const randomLeft = Math.random() * 100;
              const randomTop = Math.random() * 100;
              const randomDuration = 4 + Math.random() * 3;
              const randomDelay = Math.random() * 3;
              
              return (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-400/40 rounded-full"
                  style={{
                    left: `${randomLeft}%`,
                    top: `${randomTop}%`,
                  }}
                  animate={{
                    y: [0, -50, 0],
                    opacity: [0.2, 0.8, 0.2],
                    scale: [0.5, 1.5, 0.5],
                  }}
                  transition={{
                    duration: randomDuration,
                    repeat: Infinity,
                    delay: randomDelay,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <motion.h2 
              className="text-7xl md:text-8xl font-black mb-8 text-balance leading-tight"
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
                LIGA
              </span>
              <br />
              <span className="text-white drop-shadow-2xl">HISTORY</span>
            </motion.h2>
            
            <motion.p 
              className="text-2xl md:text-3xl text-amber-200 font-light max-w-4xl mx-auto mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              📸 Putovanje kroz <span className="text-amber-400 font-bold">nezaboravne trenutke</span> koji su definisali našu legendu
            </motion.p>

            {/* Category Selector */}
            <motion.div
              className="flex flex-wrap justify-center gap-6 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {historyCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  className={`relative group px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 border-2 backdrop-blur-md ${
                    activeCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white border-white/30 shadow-2xl`
                      : 'bg-black/30 text-gray-300 border-gray-600/50 hover:border-amber-400/50'
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${activeCategory === category.id ? 'text-white' : 'text-amber-400'} transition-colors duration-300`}>
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-sm">{category.title}</div>
                      <div className={`text-xs ${activeCategory === category.id ? 'text-white/80' : 'text-gray-400'} transition-colors duration-300`}>
                        {category.subtitle}
                      </div>
                    </div>
                  </div>
                  
                  {activeCategory === category.id && (
                    <motion.div
                      className="absolute -inset-1 rounded-2xl blur opacity-50"
                      style={{
                        background: `linear-gradient(45deg, ${category.color.split(' ')[1]}, ${category.color.split(' ')[3]})`
                      }}
                      layoutId="categoryGlow"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Ultra-Modern Gallery Grid */}
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto"
          >
            {getCurrentCategory().images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                className="group relative cursor-pointer"
                onClick={() => openLightbox(image)}
              >
                <motion.div
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm border border-white/10"
                  whileHover={{ 
                    scale: 1.02,
                    borderColor: "rgba(245, 158, 11, 0.3)"
                  }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                >
                  {/* Image Background */}
                  <div className="absolute inset-0 bg-slate-600 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-slate-400/60" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700/80 via-slate-600/60 to-slate-800/80"></div>
                  
                  {/* Modern Dark Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/60"></div>
                  
                  {/* Subtle Glow on Hover */}
                  <motion.div
                    className={`absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${getCurrentCategory().color} blur-sm`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0 }}
                    whileHover={{ opacity: 0.3 }}
                  />

                  {/* Year Badge - Top Left */}
                  <motion.div 
                    className="absolute top-4 left-4 z-20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <div className="bg-black/80 backdrop-blur-xl text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                      {image.year}
                    </div>
                  </motion.div>

                  {/* Zoom Icon - Top Right */}
                  <motion.div
                    className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>

                  {/* Ultra-Modern Text Overlay - Bottom Right */}
                  <motion.div
                    className="absolute bottom-0 right-0 left-0 z-20 p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <div className="text-right">
                      {/* Main Caption */}
                      <motion.h3 
                        className="text-white font-black text-lg md:text-xl leading-tight mb-2 drop-shadow-xl"
                        whileHover={{ scale: 1.02 }}
                      >
                        {image.caption}
                      </motion.h3>
                      
                      {/* Subtitle with Category Icon */}
                      <motion.div 
                        className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                      >
                        <span className="text-gray-300 text-sm font-medium">
                          {getCurrentCategory().subtitle}
                        </span>
                        <div className="text-amber-400 w-4 h-4 flex items-center justify-center">
                          {getCurrentCategory().icon}
                        </div>
                      </motion.div>

                      {/* Modern Accent Line */}
                      <motion.div
                        className={`h-[2px] bg-gradient-to-r ${getCurrentCategory().color} mt-3 ml-auto transition-all duration-300 group-hover:w-full`}
                        style={{ width: '60%' }}
                        whileHover={{ width: '100%' }}
                      />
                    </div>
                  </motion.div>

                  {/* Hover State Enhancement */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 70% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)`
                    }}
                  />
                </motion.div>

                {/* Floating Glow Effect */}
                <motion.div
                  className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-r ${getCurrentCategory().color} blur-xl -z-10`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

      </section>

      {/* Premium Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <motion.div
              className="relative max-w-6xl max-h-[90vh] bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30"
              initial={{ scale: 0.5, rotateY: -45 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.5, rotateY: 45 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                className="absolute top-6 right-6 z-20 w-12 h-12 bg-black/80 hover:bg-red-600/80 rounded-full flex items-center justify-center text-white transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeLightbox}
              >
                <X className="w-6 h-6" />
              </motion.button>

              {/* Image Container */}
              <div className="relative aspect-[16/10] max-h-[70vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10"></div>
                <div className="absolute inset-0 bg-slate-600 flex items-center justify-center">
                  <div className="text-center text-slate-300">
                    <Camera className="w-24 h-24 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Image Placeholder</p>
                    <p className="text-sm opacity-80">Replace with actual image: {selectedImage.src}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800"></div>
                
                {/* Premium overlays */}
                <motion.div
                  className={`absolute -inset-2 bg-gradient-to-r ${getCurrentCategory().color} rounded-3xl blur-xl opacity-40`}
                  animate={{ 
                    opacity: [0.2, 0.6, 0.2],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>

              {/* Content */}
              <div className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className={`p-3 bg-gradient-to-r ${getCurrentCategory().color} rounded-2xl`}>
                      {getCurrentCategory().icon}
                    </div>
                    <motion.div 
                      className={`bg-gradient-to-r ${getCurrentCategory().color} text-white px-6 py-3 rounded-full font-black text-lg shadow-lg`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {selectedImage.year}
                    </motion.div>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                    {selectedImage.caption}
                  </h2>
                  
                  <p className="text-lg text-gray-300 mb-6 max-w-3xl mx-auto">
                    Jedan od najvažnijih trenutaka u istoriji naše lige. Ove fotografije predstavljaju 
                    neizmernu strast i predanost koju svaki član unosi u našu zajednicu.
                  </p>

                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Calendar className="w-5 h-5" />
                      <span className="font-semibold">{selectedImage.year} Season</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400">
                      <Camera className="w-5 h-5" />
                      <span className="font-semibold">Liga History</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Premium Bottom Bar */}
              <motion.div 
                className={`h-3 bg-gradient-to-r ${getCurrentCategory().color}`}
                animate={{
                  background: getCurrentCategory().color.includes('purple') 
                    ? ["linear-gradient(90deg, #9333ea, #3b82f6)", "linear-gradient(90deg, #3b82f6, #9333ea)"]
                    : getCurrentCategory().color.includes('amber')
                    ? ["linear-gradient(90deg, #f59e0b, #ea580c)", "linear-gradient(90deg, #ea580c, #f59e0b)"]
                    : ["linear-gradient(90deg, #10b981, #0d9488)", "linear-gradient(90deg, #0d9488, #10b981)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}