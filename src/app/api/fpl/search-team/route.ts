import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "Search query parameter 'q' is required",
        },
        { status: 400 }
      );
    }

    // Enhanced search functionality with multiple approaches
    const searchResult = {
      query: query,
      message: `Searching for "${query}" - FPL API doesn't provide direct search, but here are several ways to find your Manager ID:`,

      // Direct search suggestions based on the query
      searchSuggestions: [
        {
          title: "Google Search Method",
          description: `Try searching Google for: "${query} FPL manager ID" or "${query} fantasy premier league"`,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(
            query + " FPL manager ID fantasy premier league"
          )}`,
          steps: [
            `Search Google for: "${query} FPL manager ID"`,
            "Look for social media posts, forums, or websites mentioning your team",
            "Check Twitter/X, Reddit (r/FantasyPL), or FPL community sites",
            "Look for posts where people share their team names with Manager IDs",
          ],
        },
        {
          title: "FPL Community Search",
          description:
            "Search FPL communities and forums where managers often share their details",
          searchUrl: `https://www.reddit.com/r/FantasyPL/search/?q=${encodeURIComponent(
            query
          )}`,
          steps: [
            "Search Reddit r/FantasyPL community",
            "Look for posts mentioning your team name",
            "Check FPL Discord servers and Telegram groups",
            "Search Twitter/X with hashtags #FPL #FantasyPL",
          ],
        },
        {
          title: "League Search Method",
          description:
            "If you know any leagues you're in, search within those leagues",
          steps: [
            "Ask friends in your mini-leagues to share the league URL",
            "Browse through league standings to find your team name",
            "Click on your team name to get your Manager ID from the URL",
            "Check work/family leagues where you might be registered",
          ],
        },
      ],

      // Traditional methods
      traditionalMethods: [
        {
          title: "From Your FPL Account",
          steps: [
            "Go to fantasy.premierleague.com",
            "Log in to your account",
            "Go to 'Points' or 'Transfers' tab",
            "Your Manager ID is in the URL: fantasy.premierleague.com/entry/YOUR_ID/event/X",
          ],
        },
        {
          title: "From League Standings",
          steps: [
            "Find any league you're in",
            "Look for your team name in the standings",
            "Click on your team name",
            "Your Manager ID will be in the URL",
          ],
        },
      ],

      // Tips specific to the search query
      specificTips: [
        `Your team name "${query}" should be visible in your FPL account`,
        "Manager ID is always a number (e.g., 133444, 1234567)",
        "The team name and Manager ID are linked - one leads to the other",
        "If you find your team in any league, clicking it reveals your Manager ID",
      ],

      // Emergency methods
      emergencyMethods: {
        title: "If Nothing Else Works",
        options: [
          "Create a new FPL account and note down the Manager ID",
          "Ask on FPL communities with your team name - someone might recognize it",
          "Check your email for FPL notifications that might contain your Manager ID",
          "Look through your browser history for FPL URLs that contain your ID",
        ],
      },

      note: `Searching for team name "${query}" requires manual methods since FPL API doesn't support name-based search. Try the Google search link above first!`,
    };

    return NextResponse.json({
      success: true,
      data: searchResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in team search:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
