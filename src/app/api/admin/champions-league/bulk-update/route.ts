import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ParsedPlayer {
  rank: number;
  team_name: string;
  user_name: string;
  avatar_url: string;
  member_number: number;
  points: number;
  last_md_points: number;
  is_winner: boolean;
  is_loser: boolean;
  is_tie: boolean;
}

function parseChampionsLeagueHTML(htmlContent: string): ParsedPlayer[] {
  const players: ParsedPlayer[] = [];

  try {
    // Remove newlines and normalize whitespace for better parsing
    const normalizedContent = htmlContent
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ");

    // New approach: split by si-data-row and reconstruct complete rows
    const rowSplits = normalizedContent.split('<div class="si-data-row si-row');

    for (let i = 1; i < rowSplits.length; i++) {
      // Skip first split (before first row)
      const rowContent = '<div class="si-data-row si-row' + rowSplits[i];

      // Skip loader rows and invalid rows
      if (
        rowContent.includes("si-tbl-loader") ||
        rowContent.includes("Load more rows") ||
        !rowContent.includes("si-rank")
      ) {
        continue;
      }

      // Find the end of this row by looking for the next row or end of content
      let completeRow = rowContent;
      const nextRowIndex = completeRow.indexOf(
        '<div class="si-data-row si-row',
        1
      );
      if (nextRowIndex !== -1) {
        completeRow = completeRow.substring(0, nextRowIndex);
      }

      // Extract rank - look for the first number in a span within si-rank
      const rankMatch = completeRow.match(
        /<div class="si-rank"><span>(\d+)<\/span>/
      );
      if (!rankMatch) continue;
      const rank = parseInt(rankMatch[1]);

      // Extract status (winner, loser, tie)
      const isWinner = completeRow.includes("si-winner");
      const isLoser = completeRow.includes("si-loser");
      const isTie = completeRow.includes("si-tie");

      // Extract avatar URL
      const avatarMatch = completeRow.match(/<img src="([^"]+)"/);
      const avatarUrl = avatarMatch
        ? avatarMatch[1]
        : "https://gaming.uefa.com/assets/avatars/scarf_19_45@2x.png";

      // Extract member number
      const memberMatch = completeRow.match(
        /<div class="si-member-num"><span>(\d+)<\/span><\/div>/
      );
      const memberNumber = memberMatch ? parseInt(memberMatch[1]) : 0;

      // Extract team name and user name
      const teamNameMatch = completeRow.match(
        /<span class="si-name-one">([^<]+)<\/span>/
      );
      const userNameMatch = completeRow.match(
        /<span class="si-user-name">([^<]+)<\/span>/
      );

      if (!teamNameMatch || !userNameMatch) continue;

      const teamName = teamNameMatch[1].trim();
      const userName = userNameMatch[1].trim();

      // Extract points - Last MD points and Total points
      let totalPoints = 0;
      let lastMdPoints = 0;

      // Find the si-block si-right-data section
      const rightDataMatch = completeRow.match(
        /<div class="si-block si-right-data">(.*?)$/
      );

      if (rightDataMatch) {
        const rightDataContent = rightDataMatch[1];

        // Pattern: Last MD has si-cell--top, Total is plain si-cell
        // <div class="si-cell"><div class="si-cell--top"><span>110</span></div></div><div class="si-cell">222</div>
        const pointsPattern =
          /<div class="si-cell"><div class="si-cell--top"><span>(\d+)<\/span><\/div><\/div><div class="si-cell">(\d+)<\/div>/;
        const pointsMatch = rightDataContent.match(pointsPattern);

        if (pointsMatch) {
          lastMdPoints = parseInt(pointsMatch[1]);
          totalPoints = parseInt(pointsMatch[2]);
        } else {
          // Fallback: try to extract any two numbers from the right data section
          const anyNumberPattern = /<span>(\d+)<\/span>|>(\d+)</g;
          const allNumbers = [];
          let match;

          while ((match = anyNumberPattern.exec(rightDataContent)) !== null) {
            const num = parseInt(match[1] || match[2]);
            if (num > 0) {
              allNumbers.push(num);
            }
          }

          if (allNumbers.length >= 2) {
            lastMdPoints = allNumbers[0];
            totalPoints = allNumbers[1];
          } else if (allNumbers.length === 1) {
            totalPoints = allNumbers[0];
            lastMdPoints = allNumbers[0];
          }
        }
      }

      // Debug logging for the first few entries
      if (rank <= 5) {
        console.log(
          `Parsing player ${rank}: ${teamName} - Last MD: ${lastMdPoints}, Total: ${totalPoints}`
        );
      }

      players.push({
        rank,
        team_name: teamName,
        user_name: userName,
        avatar_url: avatarUrl,
        member_number: memberNumber,
        points: totalPoints,
        last_md_points: lastMdPoints,
        is_winner: isWinner,
        is_loser: isLoser,
        is_tie: isTie,
      });
    }

    return players;
  } catch (error) {
    console.error("Error parsing Champions League HTML:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", session.user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { htmlContent } = body;

    if (!htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json(
        { success: false, error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Parse the HTML content
    const parsedPlayers = parseChampionsLeagueHTML(htmlContent);

    if (parsedPlayers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid player data found in HTML" },
        { status: 400 }
      );
    }

    // Clear existing data and insert new data
    const { error: deleteError } = await supabase
      .from("cl_table_25_26")
      .delete()
      .neq("id", 0); // Delete all rows

    if (deleteError) {
      console.error("Error clearing Champions League table:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to clear existing data" },
        { status: 500 }
      );
    }

    // Insert new data
    const { data, error: insertError } = await supabase
      .from("cl_table_25_26")
      .insert(parsedPlayers)
      .select();

    if (insertError) {
      console.error("Error inserting Champions League data:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to insert new data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${parsedPlayers.length} Champions League entries`,
      count: parsedPlayers.length,
      data: data,
    });
  } catch (error) {
    console.error("Champions League bulk update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
