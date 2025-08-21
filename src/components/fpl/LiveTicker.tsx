'use client';

import { useState, useEffect, useRef } from 'react';

interface Event {
  id: number;
  gw: number;
  fixture_id: number;
  event_type: string;
  player_id: number;
  delta_value: number;
  side: 'H' | 'A';
  occurred_at: string;
  player?: {
    web_name: string;
    first_name: string;
    second_name: string;
  };
  fixture?: {
    team_h: { short_name: string };
    team_a: { short_name: string };
  };
}

interface LiveTickerProps {
  gameweek: number;
  isPolling: boolean;
}

const EVENT_ICONS = {
  goals_scored: '⚽',
  assists: '🅰️',
  yellow_cards: '🟨',
  red_cards: '🟥',
  penalties_missed: '❌',
  penalties_saved: '🧤',
  own_goals: '⚽',
  saves: '🧤',
};

const EVENT_LABELS = {
  goals_scored: 'Goal',
  assists: 'Assist',
  yellow_cards: 'Yellow Card',
  red_cards: 'Red Card',
  penalties_missed: 'Penalty Missed',
  penalties_saved: 'Penalty Saved',
  own_goals: 'Own Goal',
  saves: 'Save',
};

export default function LiveTicker({ gameweek, isPolling }: LiveTickerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventIdRef = useRef<number>(0);

  const fetchEvents = async () => {
    if (!gameweek) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/fpl/events?gw=${gameweek}&limit=50`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const newEvents = result.data.filter((event: Event) => event.id > lastEventIdRef.current);
          
          if (newEvents.length > 0) {
            setEvents(prev => [...newEvents.reverse(), ...prev].slice(0, 100));
            lastEventIdRef.current = Math.max(...result.data.map((e: Event) => e.id));
          } else if (events.length === 0) {
            setEvents(result.data.reverse());
            if (result.data.length > 0) {
              lastEventIdRef.current = Math.max(...result.data.map((e: Event) => e.id));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPolling) {
      fetchEvents();
      intervalRef.current = setInterval(fetchEvents, 10000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPolling, gameweek]);

  useEffect(() => {
    if (!isPolling) {
      fetchEvents();
    }
  }, [gameweek]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const eventTime = new Date(dateString);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return eventTime.toLocaleDateString();
  };

  const getEventDescription = (event: Event) => {
    const playerName = event.player?.web_name || `Player ${event.player_id}`;
    const eventLabel = EVENT_LABELS[event.event_type as keyof typeof EVENT_LABELS] || event.event_type;
    const team = event.side === 'H' 
      ? event.fixture?.team_h?.short_name 
      : event.fixture?.team_a?.short_name;
    
    let description = `${playerName} - ${eventLabel}`;
    if (team) {
      description += ` (${team})`;
    }
    
    if (event.delta_value > 1) {
      description += ` x${event.delta_value}`;
    }
    
    return description;
  };

  const EventItem = ({ event }: { event: Event }) => {
    const icon = EVENT_ICONS[event.event_type as keyof typeof EVENT_ICONS] || '📊';
    
    return (
      <div className="flex items-start space-x-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div className="text-lg">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {getEventDescription(event)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTimeAgo(event.occurred_at)}
          </p>
        </div>
        {event.delta_value > 1 && (
          <div className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-1 rounded">
            +{event.delta_value}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Ticker
          </h3>
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            )}
            <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isPolling ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {events.length > 0 ? (
          <div className="px-6">
            {events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {loading ? 'Loading events...' : 'No events yet'}
            </p>
            {!isPolling && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Start live polling to see real-time updates
              </p>
            )}
          </div>
        )}
      </div>

      {events.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{events.length} event{events.length !== 1 ? 's' : ''}</span>
            <span>GW{gameweek}</span>
          </div>
        </div>
      )}
    </div>
  );
}