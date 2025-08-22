"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MdAnalytics,
  MdRefresh,
  MdWifi,
  MdWifiOff,
  MdSportsSoccer,
} from "react-icons/md";
import { IoFootball } from "react-icons/io5";
import { PiSneakerFill } from "react-icons/pi";
import { GiPlayerPrevious, GiGoalKeeper, GiWhistle } from "react-icons/gi";
import {
  TbRectangleVertical,
  TbTarget,
  TbTargetOff,
  TbArrowBack,
} from "react-icons/tb";
import { RiShieldLine } from "react-icons/ri";
import { SkeletonList } from "@/components/skeletons";

interface Event {
  id: number;
  gw: number;
  fixture_id: number;
  event_type: string;
  player_id: number;
  delta_value: number;
  side: "H" | "A";
  occurred_at: string;
  player?: {
    web_name: string;
    first_name: string;
    second_name: string;
  };
  fixture?: {
    team_h_data: { short_name: string };
    team_a_data: { short_name: string };
  };
}

interface LiveTickerProps {
  gameweek: number;
  isPolling: boolean;
}

const EVENT_ICONS = {
  goals_scored: <IoFootball className="text-green-500" />,
  assists: <PiSneakerFill className="text-blue-500" />,
  yellow_cards: <TbRectangleVertical className="text-yellow-500" />,
  red_cards: <TbRectangleVertical className="text-red-500" />,
  penalties_missed: <TbTargetOff className="text-red-400" />,
  penalties_saved: <TbTarget className="text-green-400" />,
  own_goals: <TbArrowBack className="text-orange-500" />,
  saves: <GiGoalKeeper className="text-blue-400" />,
  clean_sheets: <RiShieldLine className="text-green-600" />,
  goals_conceded: <MdSportsSoccer className="text-red-300" />,
  bonus: <GiWhistle className="text-purple-500" />,
  // Defensive actions
  tackles: <GiPlayerPrevious className="text-indigo-500" />,
  interceptions: <RiShieldLine className="text-cyan-500" />,
  clearances: <GiPlayerPrevious className="text-gray-600" />,
};

const EVENT_LABELS = {
  goals_scored: "Goal",
  assists: "Assist",
  yellow_cards: "Yellow Card",
  red_cards: "Red Card",
  penalties_missed: "Penalty Missed",
  penalties_saved: "Penalty Saved",
  own_goals: "Own Goal",
  saves: "Save",
  clean_sheets: "Clean Sheet",
  goals_conceded: "Goal Conceded",
  bonus: "Bonus Points",
  // Defensive actions
  tackles: "Tackle",
  interceptions: "Interception",
  clearances: "Clearance",
};

const LiveTicker = React.memo(function LiveTicker({ gameweek, isPolling }: LiveTickerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventIdRef = useRef<number>(0);

  const fetchEvents = useCallback(async () => {
    if (!gameweek) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/fpl/events?gw=${gameweek}&limit=50`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const newEvents = result.data.filter(
            (event: Event) => event.id > lastEventIdRef.current
          );

          if (newEvents.length > 0) {
            setEvents((prev) =>
              [...newEvents.reverse(), ...prev].slice(0, 100)
            );
            lastEventIdRef.current = Math.max(
              ...result.data.map((e: Event) => e.id)
            );
          } else if (events.length === 0) {
            setEvents(result.data.reverse());
            if (result.data.length > 0) {
              lastEventIdRef.current = Math.max(
                ...result.data.map((e: Event) => e.id)
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [gameweek, events.length]);

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
  }, [isPolling, gameweek, fetchEvents]);

  useEffect(() => {
    if (!isPolling) {
      fetchEvents();
    }
  }, [gameweek, fetchEvents, isPolling]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const eventTime = new Date(dateString);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;

    return eventTime.toLocaleDateString();
  };

  const getEventDescription = (event: Event) => {
    const playerName = event.player?.web_name || `Player ${event.player_id}`;
    const eventLabel =
      EVENT_LABELS[event.event_type as keyof typeof EVENT_LABELS] ||
      event.event_type;
    const team =
      event.side === "H"
        ? event.fixture?.team_h_data?.short_name
        : event.fixture?.team_a_data?.short_name;

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
    const icon = EVENT_ICONS[event.event_type as keyof typeof EVENT_ICONS] || (
      <MdAnalytics className="text-gray-500" />
    );

    return (
      <div className="flex items-start space-x-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div className="text-lg flex items-center">{icon}</div>
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
            LIVE BPS Tracker
          </h3>
          <div className="flex items-center space-x-2">
            {loading && (
              <MdRefresh className="w-4 h-4 text-blue-600 animate-spin" />
            )}
            {isPolling ? (
              <MdWifi className="w-4 h-4 text-green-500 animate-pulse" />
            ) : (
              <MdWifiOff className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isPolling ? "Live — polling" : "Offline — not polling"}
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
        ) : loading ? (
          <div className="px-6">
            <SkeletonList
              items={6}
              showIcons
              showSecondaryText
              showActions
              variant="events"
              className="border-none shadow-none"
            />
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="text-4xl mb-2 flex justify-center">
              <MdAnalytics className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No events yet
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
            <span>
              {events.length} event{events.length !== 1 ? "s" : ""}
            </span>
            <span>GW{gameweek}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default LiveTicker;
