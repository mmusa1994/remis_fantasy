"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { FaWandMagicSparkles, FaGoogle, FaEnvelope } from "react-icons/fa6";
import { HiChatBubbleLeftEllipsis, HiKey } from "react-icons/hi2";
import { BiSend, BiUserPlus } from "react-icons/bi";
import { AiOutlineRobot } from "react-icons/ai";
import { FaUser } from "react-icons/fa";
import LoadingCard from "@/components/shared/LoadingCard";
import Link from "next/link";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Usage {
  remaining: number;
  total: number;
  resetDate: string;
  resetDateFormatted: string;
}

export default function AITeamAnalysis() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const { t, ready } = useTranslation('ai');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [userApiKey, setUserApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [usageLoading, setUsageLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  // Check if user is authenticated and fetch usage information
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchUsage();
    } else if (status === "unauthenticated") {
      setUsageLoading(false);
      setAuthRequired(true);
    }
  }, [status, session]);

  const fetchUsage = async () => {
    try {
      setUsageLoading(true);
      const response = await fetch('/api/user/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
        setAuthRequired(false);
      } else if (response.status === 401) {
        setAuthRequired(true);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setAuthRequired(true);
    } finally {
      setUsageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userApiKey: userApiKey || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.requiresAuth) {
          // Authentication required
          setAuthRequired(true);
          const errorMessage: Message = {
            role: 'assistant',
            content: data.message || t('authenticationRequired'),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
        
        if (response.status === 429) {
          // Rate limit exceeded
          const errorMessage: Message = {
            role: 'assistant',
            content: data.message || t('rateLimitMessage'),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          if (data.requiresAuth) {
            setAuthRequired(true);
          }
          fetchUsage(); // Refresh usage info
          return;
        }
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Refresh usage if using free tier
      if (!userApiKey) {
        fetchUsage();
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: t('errorMessage'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || status === "loading") {
    return (
      <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingCard
            title={t('loadingTitle')}
            description={t('loadingDescription')}
            className="w-full max-w-md mx-auto"
          />
        </div>
      </main>
    );
  }

  // Show authentication required screen
  if (authRequired && !userApiKey) {
    return (
      <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FaWandMagicSparkles className="w-8 h-8 text-purple-500" />
              <h1 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {t('title')}
              </h1>
            </div>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('subtitle')}
            </p>
          </div>

          {/* Authentication Required Card */}
          <div className={`max-w-md mx-auto p-8 rounded-xl border ${
            theme === 'dark' 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white/50 border-gray-200'
          } text-center`}>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 mb-6">
              <BiUserPlus className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            
            <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('authenticationRequired')}
            </h3>
            
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('signInToAccess')}
            </p>

            <div className="space-y-3">
              {/* Google Sign In */}
              <button
                onClick={() => signIn("google", { callbackUrl: "/premier-league/ai-team-analysis" })}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 border ${
                  theme === 'dark' 
                    ? 'border-gray-700 hover:bg-gray-800' 
                    : 'border-gray-300 hover:bg-gray-50'
                } rounded-lg text-sm font-medium transition-colors`}
              >
                <FaGoogle className="text-red-500" />
                {t('signInWithGoogle')}
              </button>

              {/* Email Sign In */}
              <Link
                href="/login"
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors`}
              >
                <FaEnvelope />
                {t('signInWithEmail')}
              </Link>

              {/* Sign Up */}
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('dontHaveAccount')}{' '}
                <Link href="/signup" className="text-purple-600 hover:text-purple-500 font-medium">
                  {t('createFreeAccount')}
                </Link>
              </div>
            </div>

            {/* Benefits */}
            <div className={`mt-6 pt-6 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('freeAccountIncludes')}
              </h4>
              <ul className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>• {t('freeQueries')} AI questions per week</li>
                <li>• {t('personalizedAdvice')}</li>
                <li>• {t('realTimeData')}</li>
              </ul>
            </div>
          </div>

          {/* API Key Option */}
          <div className={`mt-6 p-4 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-gray-800/30 border-gray-700' 
              : 'bg-blue-50 border-blue-200'
          } max-w-md mx-auto`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HiKey className="w-4 h-4 text-purple-500" />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('useOwnApiKey')}
                </span>
              </div>
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="text-xs text-purple-500 hover:text-purple-600 transition-colors"
              >
                {showApiKeyInput ? t('hide') : t('show')}
              </button>
            </div>
            
            {showApiKeyInput && (
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder={t('enterApiKey')}
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('apiKeyDescription')}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaWandMagicSparkles className="w-8 h-8 text-purple-500" />
            <h1 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {t('title')}
            </h1>
          </div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('subtitle')}
          </p>
        </div>

        {/* Usage Information */}
        {!userApiKey && (
          <div className={`mb-6 p-4 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white/50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiChatBubbleLeftEllipsis className="w-5 h-5 text-blue-500" />
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {t('freeQuestions')}
                </span>
              </div>
              {usageLoading ? (
                <div className="animate-pulse h-4 w-20 bg-gray-300 rounded"></div>
              ) : usage ? (
                <span className={`text-sm ${
                  usage.remaining > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {usage.remaining}/{usage.total} {t('remaining')}
                </span>
              ) : null}
            </div>
            {usage && (
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('resetsOn')} {usage.resetDateFormatted}
              </p>
            )}
          </div>
        )}

        {/* API Key Section */}
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white/50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HiKey className="w-5 h-5 text-purple-500" />
              <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {t('useOwnApiKey')}
              </span>
            </div>
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-sm text-purple-500 hover:text-purple-600 transition-colors"
            >
              {showApiKeyInput ? t('hide') : t('show')}
            </button>
          </div>
          
          {showApiKeyInput && (
            <div className="space-y-2">
              <input
                type="password"
                placeholder={t('enterApiKey')}
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('apiKeyDescription')}
              </p>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className={`rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white/50 border-gray-200'
        } overflow-hidden`}>
          
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <AiOutlineRobot className={`w-12 h-12 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {t('readyToHelp')}
                </p>
                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('askAboutStrategies')}
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-purple-500'
                      : 'bg-blue-500'
                  }`}>
                    {message.role === 'user' ? (
                      <FaUser className="w-4 h-4 text-white" />
                    ) : (
                      <AiOutlineRobot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-xs md:max-w-md lg:max-w-lg ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? theme === 'dark'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-500 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-100'
                          : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <AiOutlineRobot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-300 dark:border-gray-600">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('inputPlaceholder')}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <BiSend className="w-4 h-4" />
                {t('send')}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className={`mt-6 p-4 rounded-lg ${
          theme === 'dark' 
            ? 'bg-blue-900/20 border border-blue-800/50' 
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <h3 className={`font-medium mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'}`}>
            {t('exampleQuestionsTitle')}
          </h3>
          <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
            <li>• {t('exampleQuestions.0')}</li>
            <li>• {t('exampleQuestions.1')}</li>
            <li>• {t('exampleQuestions.2')}</li>
            <li>• {t('exampleQuestions.3')}</li>
            <li>• {t('exampleQuestions.4')}</li>
          </ul>
        </div>
      </div>
    </main>
  );
}