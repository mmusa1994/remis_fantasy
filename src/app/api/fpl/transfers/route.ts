import { NextResponse } from "next/server";

/**
 * Most transferred in / out players since the last deadline.
 *
 * FPL resets `transfers_in_event` / `transfers_out_event` at every deadline,
 * so after GW N's deadline these counts are transfers made *for GW N+1* —
 * `next_event` tells the UI which gameweek that is.
 *
 * Each row also carries FPL's own price-change progress
 * (`price_change_percent`: +100 means a rise is due, -100 a fall) so the UI
 * can show which transfer targets are about to move in price.
 */

const mapPlayer = (player: any) => {
  const projection = Array.isArray(player.price_change_projections)
    ? player.price_change_projections.find((p: any) => p?.offset === 0)
    : null;
  const percent = parseFloat(player.price_change_percent);
  const projected = parseFloat(projection?.projected_percent);

  return {
    id: player.id,
    web_name: player.web_name,
    first_name: player.first_name,
    second_name: player.second_name,
    team: player.team,
    team_code: player.team_code,
    position: player.element_type,
    element_type: player.element_type,
    now_cost: player.now_cost,
    cost_change_event: player.cost_change_event || 0,
    selected_by_percent: parseFloat(player.selected_by_percent || "0"),
    status: player.status,
    transfers_in_event: player.transfers_in_event,
    transfers_out_event: player.transfers_out_event,
    transfers_net_event:
      (player.transfers_in_event || 0) - (player.transfers_out_event || 0),
    transfers_in: player.transfers_in,
    transfers_out: player.transfers_out,
    price_change_percent: Number.isFinite(percent) ? percent : null,
    price_change_projected: Number.isFinite(projected) ? projected : null,
    price_change_locked_until: player.price_change_locked_until || null,
  };
};

export async function GET() {
  const startTime = Date.now();

  try {
    // Use bootstrap-static instead of transfers endpoint (which requires auth)
    const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`FPL API responded with status: ${response.status}`);
    }

    const bootstrapData = await response.json();

    // Extract and sort transfer data from bootstrap-static
    const players = bootstrapData.elements || [];

    // Sort by transfers_in_event (descending) for most transferred in
    const transfersIn = [...players]
      .filter(player => player.transfers_in_event > 0)
      .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
      .slice(0, 20)
      .map(mapPlayer);

    // Sort by transfers_out_event (descending) for most transferred out
    const transfersOut = [...players]
      .filter(player => player.transfers_out_event > 0)
      .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
      .slice(0, 20)
      .map(mapPlayer);

    const events: any[] = Array.isArray(bootstrapData.events) ? bootstrapData.events : [];
    const nextEvent = events.find((e) => e?.is_next);
    const currentEvent = events.find((e) => e?.is_current);

    const data = {
      transfers_in: transfersIn,
      transfers_out: transfersOut,
      next_event: nextEvent
        ? {
            id: nextEvent.id,
            deadline_time: nextEvent.deadline_time,
            transfers_made: nextEvent.transfers_made || 0,
          }
        : null,
      current_event: currentEvent
        ? {
            id: currentEvent.id,
            transfers_made: currentEvent.transfers_made || 0,
          }
        : null,
    };

    const responseTime2 = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime2,
      data_sources: {
        using_services: false,
        live_tracking: true,
        database_free: true,
        source: "bootstrap-static"
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("💥 Transfers API failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      response_time_ms: responseTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
        fallback_attempted: true
      },
      { status: 500 }
    );
  }
}
