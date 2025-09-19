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
  md1_points: number;
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

      // Extract points - handle both MD1 and total points
      let points = 0;
      let md1Points = 0;

      // More robust points extraction
      // First, try to find the si-block si-right-data section with more flexible pattern
      const rightDataMatch = completeRow.match(
        /<div class="si-block si-right-data">(.*?)$/
      );

      if (rightDataMatch) {
        const rightDataContent = rightDataMatch[1];

        // Debug: log the entire row and right data content for first few entries
        if (rank <= 3) {
          console.log(`\n=== Player ${rank} (${teamName}) ===`);
          console.log("Complete row:", completeRow.substring(0, 400) + "...");
          console.log("Right data content:", rightDataContent);
          console.log("Right data length:", rightDataContent.length);
        }
      } else {
        // Debug: log when right data match fails
        if (rank <= 3) {
          console.log(
            `\n=== Player ${rank} (${teamName}) - NO RIGHT DATA MATCH ===`
          );
          console.log("Complete row:", completeRow);

          // Try to find si-right-data with simpler pattern
          const simpleRightData = completeRow.match(
            /<div class="si-block si-right-data">/
          );
          console.log("Simple right data found:", !!simpleRightData);

          if (simpleRightData) {
            const afterRightData = completeRow.substring(
              completeRow.indexOf('<div class="si-block si-right-data">')
            );
            console.log("After right data:", afterRightData);
          }
        }
      }

      if (rightDataMatch) {
        const rightDataContent = rightDataMatch[1];

        // Try multiple patterns to extract points

        // Pattern 1: Two separate cells with spans (MD1 and Total)
        const twoPointsPattern =
          /<div class="si-cell"><span>(\d+)<\/span><\/div><div class="si-cell"><div class="si-cell--top"><span>(\d+)<\/span><\/div><\/div>/;
        const twoPointsMatch = rightDataContent.match(twoPointsPattern);

        if (twoPointsMatch) {
          md1Points = parseInt(twoPointsMatch[1]);
          points = parseInt(twoPointsMatch[2]);
        } else {
          // Pattern 2: Single cell with si-cell--top (only total points)
          const singlePointsPattern =
            /<div class="si-cell"><div class="si-cell--top"><span>(\d+)<\/span><\/div><\/div>/;
          const singlePointsMatch = rightDataContent.match(singlePointsPattern);

          if (singlePointsMatch) {
            points = parseInt(singlePointsMatch[1]);
            md1Points = points; // Use same value for both
          } else {
            // Pattern 3: Just look for any number in span tags
            const anyNumberPattern = /<span>(\d+)<\/span>/g;
            const allNumbers = [];
            let match;

            while ((match = anyNumberPattern.exec(rightDataContent)) !== null) {
              const num = parseInt(match[1]);
              if (num > 0) {
                allNumbers.push(num);
              }
            }

            if (allNumbers.length >= 2) {
              md1Points = allNumbers[0];
              points = allNumbers[1];
            } else if (allNumbers.length === 1) {
              points = allNumbers[0];
              md1Points = allNumbers[0];
            }
          }
        }
      }

      // Debug logging for the first few entries
      if (rank <= 5) {
        console.log(
          `Parsing player ${rank}: ${teamName} - MD1: ${md1Points}, Total: ${points}`
        );
      }

      players.push({
        rank,
        team_name: teamName,
        user_name: userName,
        avatar_url: avatarUrl,
        member_number: memberNumber,
        points,
        md1_points: md1Points,
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
