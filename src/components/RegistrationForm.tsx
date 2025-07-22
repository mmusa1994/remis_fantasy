'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Trophy, Upload, Crown, Shield, Zap, Phone, User, Users } from 'lucide-react'

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  team_name: string;
  league_type: 'standard' | 'premium' | '';
  h2h_league: boolean;
  payment_proof?: File;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    team_name: '',
    league_type: '',
    h2h_league: false,
    payment_proof: undefined
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    
    if (!formData.team_name.trim()) {
      newErrors.team_name = 'Team name is required'
    }
    
    if (!formData.league_type) {
      newErrors.league_type = 'Please select a league type'
    }
    
    if (!formData.payment_proof) {
      newErrors.payment_proof = 'Payment proof is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileUpload = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/', 'application/pdf'];
    
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, payment_proof: 'File size must be less than 10MB' }));
      return;
    }
    
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      setErrors(prev => ({ ...prev, payment_proof: 'Only images and PDF files are allowed' }));
      return;
    }
    
    setFormData(prev => ({ ...prev, payment_proof: file }));
    if (errors.payment_proof) {
      setErrors(prev => ({ ...prev, payment_proof: '' }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      let paymentProofUrl = null;
      
      // Upload file to Supabase Storage if exists
      if (formData.payment_proof) {
        const fileExt = formData.payment_proof.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, formData.payment_proof);
        
        if (uploadError) throw uploadError;
        paymentProofUrl = uploadData?.path;
      }
      
      // Insert registration data
      const { error } = await supabase
        .from('registration_25_26')
        .insert([{
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          team_name: formData.team_name.trim(),
          league_type: formData.league_type,
          h2h_league: formData.h2h_league,
          payment_proof_url: paymentProofUrl,
          created_at: new Date().toISOString()
        }])
      
      if (error) throw error
      
      setSubmitStatus('success')
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        team_name: '',
        league_type: '',
        h2h_league: false,
        payment_proof: undefined
      })
    } catch (error) {
      console.error('Registration error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const leagueOptions = [
    {
      id: 'standard',
      name: 'Standard Liga',
      price: '25€',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-blue-600 to-indigo-600',
      description: 'Klasična liga s osnovnim nagradama'
    },
    {
      id: 'premium',
      name: 'Premium Liga', 
      price: '50€',
      icon: <Crown className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-600',
      description: 'VIP liga s ekskluzivnim nagradama'
    }
  ];

  return (
    <section className="relative py-32 bg-gradient-to-b from-slate-950 via-red-950/80 to-slate-900 overflow-hidden">
      {/* Epic Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-amber-600/20 via-red-700/15 to-rose-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-red-800/20 via-amber-700/15 to-rose-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M30 15l10 15-10 15-10-15z'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl"
          >
            <Trophy className="w-10 h-10 text-amber-900" />
          </motion.div>
          
          <h2 className="text-6xl md:text-7xl font-black mb-6 text-balance leading-tight">
            <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-2xl">
              REGISTER
            </span>
            <br />
            <span className="text-white drop-shadow-2xl">FOR GLORY</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-amber-200 font-light max-w-3xl mx-auto">
            🏆 Sezona 2025/26 - Tvoja prilika da <span className="text-amber-400 font-bold">napraviš istoriju</span>
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-amber-500/20"
          >
            {/* Personal Info Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <User className="text-amber-400" />
                Lični Podaci
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="relative">
                  <motion.input
                    type="text"
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className={`w-full px-4 py-4 bg-black/30 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-300 ${
                      errors.first_name ? 'border-red-400' : 'border-white/20 focus:border-amber-400'
                    }`}
                    placeholder="First Name"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <label
                    htmlFor="first_name"
                    className="absolute left-4 -top-2.5 bg-slate-900 px-2 text-sm text-amber-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-amber-400 peer-focus:bg-slate-900"
                  >
                    Ime
                  </label>
                  <AnimatePresence>
                    {errors.first_name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-sm mt-2 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.first_name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Last Name */}
                <div className="relative">
                  <motion.input
                    type="text"
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className={`w-full px-4 py-4 bg-black/30 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-300 ${
                      errors.last_name ? 'border-red-400' : 'border-white/20 focus:border-amber-400'
                    }`}
                    placeholder="Last Name"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <label
                    htmlFor="last_name"
                    className="absolute left-4 -top-2.5 bg-slate-900 px-2 text-sm text-amber-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-amber-400 peer-focus:bg-slate-900"
                  >
                    Prezime
                  </label>
                  <AnimatePresence>
                    {errors.last_name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-sm mt-2 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.last_name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Phone className="text-amber-400" />
                Kontakt Podaci
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="relative">
                  <motion.input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-4 bg-black/30 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-300 ${
                      errors.email ? 'border-red-400' : 'border-white/20 focus:border-amber-400'
                    }`}
                    placeholder="Email"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-4 -top-2.5 bg-slate-900 px-2 text-sm text-amber-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-amber-400 peer-focus:bg-slate-900"
                  >
                    Email Adresa
                  </label>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-sm mt-2 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Phone */}
                <div className="relative">
                  <motion.input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-4 bg-black/30 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-300 ${
                      errors.phone ? 'border-red-400' : 'border-white/20 focus:border-amber-400'
                    }`}
                    placeholder="Phone"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <label
                    htmlFor="phone"
                    className="absolute left-4 -top-2.5 bg-slate-900 px-2 text-sm text-amber-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-amber-400 peer-focus:bg-slate-900"
                  >
                    Broj Telefona
                  </label>
                  <AnimatePresence>
                    {errors.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-sm mt-2 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Team Info */}
            <div className="mb-12">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Users className="text-amber-400" />
                Informacije o Ekipi
              </h3>
              
              <div className="relative">
                <motion.input
                  type="text"
                  id="team_name"
                  value={formData.team_name}
                  onChange={(e) => handleInputChange('team_name', e.target.value)}
                  className={`w-full px-4 py-4 bg-black/30 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-300 ${
                    errors.team_name ? 'border-red-400' : 'border-white/20 focus:border-amber-400'
                  }`}
                  placeholder="Team Name"
                  whileFocus={{ scale: 1.02 }}
                />
                <label
                  htmlFor="team_name"
                  className="absolute left-4 -top-2.5 bg-slate-900 px-2 text-sm text-amber-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-amber-400 peer-focus:bg-slate-900"
                >
                  Ime Ekipe
                </label>
                <AnimatePresence>
                  {errors.team_name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-400 text-sm mt-2 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.team_name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* League Selection */}
            <div className="mb-12">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Crown className="text-amber-400" />
                Tip Lige
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {leagueOptions.map((option) => (
                  <motion.div
                    key={option.id}
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 ${
                      formData.league_type === option.id
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-white/20 hover:border-amber-400/50'
                    }`}
                    onClick={() => handleInputChange('league_type', option.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="radio"
                      name="league_type"
                      value={option.id}
                      checked={formData.league_type === option.id}
                      onChange={() => handleInputChange('league_type', option.id)}
                      className="sr-only"
                    />
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${option.color}`}>
                        {option.icon}
                      </div>
                      <div className="text-3xl font-black text-amber-400">
                        {option.price}
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-bold text-white mb-2">
                      {option.name}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {option.description}
                    </p>
                    
                    {formData.league_type === option.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 text-amber-900" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* H2H League Option */}
              <motion.div
                className="bg-black/30 rounded-xl p-6 border border-white/20"
                whileHover={{ borderColor: "rgba(245, 158, 11, 0.5)" }}
              >
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.h2h_league}
                    onChange={(e) => handleInputChange('h2h_league', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                    formData.h2h_league ? 'bg-amber-400 border-amber-400' : 'border-white/40'
                  }`}>
                    {formData.h2h_league && (
                      <CheckCircle className="w-4 h-4 text-amber-900" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="text-amber-400 w-6 h-6" />
                    <div>
                      <span className="text-white font-bold">H2H Liga (+15€)</span>
                      <p className="text-gray-400 text-sm">Head-to-Head dodatna liga sa posebnim nagradama</p>
                    </div>
                  </div>
                </label>
              </motion.div>

              <AnimatePresence>
                {errors.league_type && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-400 text-sm mt-4 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.league_type}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* File Upload */}
            <div className="mb-12">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Upload className="text-amber-400" />
                Dokaz o Uplati
              </h3>
              
              <motion.div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-amber-400 bg-amber-500/10'
                    : errors.payment_proof
                    ? 'border-red-400'
                    : 'border-white/30 hover:border-amber-400/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                whileHover={{ scale: 1.01 }}
              >
                <input
                  type="file"
                  id="payment_proof"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="sr-only"
                />
                
                <label htmlFor="payment_proof" className="cursor-pointer">
                  <div className="space-y-4">
                    {formData.payment_proof ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-green-400"
                      >
                        <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-bold text-lg">{formData.payment_proof.name}</p>
                        <p className="text-sm text-gray-400">
                          {(formData.payment_proof.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </motion.div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto text-amber-400" />
                        <div>
                          <p className="text-lg font-bold text-white mb-2">
                            Otpusti fajl ovdje ili klikni za upload
                          </p>
                          <p className="text-gray-400 text-sm">
                            PNG, JPG, PDF do 10MB
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </motion.div>

              <AnimatePresence>
                {errors.payment_proof && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-400 text-sm mt-4 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.payment_proof}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-600 hover:via-orange-700 hover:to-red-700 text-white font-black py-6 px-12 rounded-2xl text-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-2xl border-2 border-amber-400/50"
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 25px 50px rgba(245, 158, 11, 0.4)" 
              }}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>OBRAĐUJEM REGISTRACIJU...</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="submit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <Trophy className="w-6 h-6" />
                    <span>🏆 POSTANI LEGENDA 🏆</span>
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <motion.div 
                className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-red-600 rounded-2xl opacity-30 blur"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </motion.button>

            {/* Success/Error Messages */}
            <AnimatePresence>
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="mt-8 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border border-green-400/50 rounded-2xl p-6 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-green-300 font-black text-lg mb-1">REGISTRACIJA USPJEŠNA!</h4>
                      <p className="text-green-200 text-sm">Dobrodošao u REMIS Fantasy 2025/26! Kontaktiraćemo te uskoro.</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="mt-8 bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20 border border-red-400/50 rounded-2xl p-6 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-red-300 font-black text-lg mb-1">GREŠKA PRI REGISTRACIJI</h4>
                      <p className="text-red-200 text-sm">Nešto je pošlo po zlu. Molimo pokušaj ponovo.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        </div>
      </div>
      </section>
  )
}