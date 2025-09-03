import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import { CommandValidator, commandExecutionSchema } from "@/lib/command-validator";
import { spawn } from "child_process";
import path from "path";

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_COMMANDS_PER_WINDOW = 10;
const MAX_VIOLATIONS_BEFORE_LOCKOUT = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  commandId: string;
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  resetTime?: Date;
}

/**
 * Checks and updates rate limiting for an admin user
 */
async function checkRateLimit(adminId: string): Promise<RateLimitResult> {
  const now = new Date();
  
  // Get current rate limit data
  const { data: rateLimitData, error: fetchError } = await supabaseServer
    .from("admin_rate_limits")
    .select("*")
    .eq("admin_id", adminId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") { // PGRST116 = no rows returned
    console.error("Error fetching rate limit data:", fetchError);
    return { allowed: false, reason: "Database error" };
  }

  // Check if admin is locked out
  if (rateLimitData?.locked_until && new Date(rateLimitData.locked_until) > now) {
    return {
      allowed: false,
      reason: "Admin is locked out due to rate limit violations",
      resetTime: new Date(rateLimitData.locked_until),
    };
  }

  // Initialize or reset rate limit window if needed
  const windowStart = rateLimitData?.window_start ? new Date(rateLimitData.window_start) : now;
  const isNewWindow = now.getTime() - windowStart.getTime() > RATE_LIMIT_WINDOW;

  if (!rateLimitData || isNewWindow) {
    // Create new rate limit entry or reset window
    const { error: upsertError } = await supabaseServer
      .from("admin_rate_limits")
      .upsert({
        admin_id: adminId,
        commands_executed: 1,
        window_start: now.toISOString(),
        violations_count: rateLimitData?.violations_count || 0,
        locked_until: null,
      });

    if (upsertError) {
      console.error("Error updating rate limit:", upsertError);
      return { allowed: false, reason: "Database error" };
    }

    return { allowed: true };
  }

  // Check current window limits
  if (rateLimitData.commands_executed >= MAX_COMMANDS_PER_WINDOW) {
    // Increment violations and potentially lock out
    const newViolations = rateLimitData.violations_count + 1;
    const shouldLockOut = newViolations >= MAX_VIOLATIONS_BEFORE_LOCKOUT;

    await supabaseServer
      .from("admin_rate_limits")
      .update({
        violations_count: newViolations,
        locked_until: shouldLockOut ? new Date(now.getTime() + LOCKOUT_DURATION).toISOString() : null,
      })
      .eq("admin_id", adminId);

    return {
      allowed: false,
      reason: shouldLockOut 
        ? "Too many violations. Admin locked out." 
        : "Rate limit exceeded",
      resetTime: shouldLockOut 
        ? new Date(now.getTime() + LOCKOUT_DURATION)
        : new Date(windowStart.getTime() + RATE_LIMIT_WINDOW),
    };
  }

  // Increment command count
  const { error: updateError } = await supabaseServer
    .from("admin_rate_limits")
    .update({
      commands_executed: rateLimitData.commands_executed + 1,
    })
    .eq("admin_id", adminId);

  if (updateError) {
    console.error("Error updating command count:", updateError);
    return { allowed: false, reason: "Database error" };
  }

  return { allowed: true };
}

/**
 * Logs command execution to the database
 */
async function logCommandExecution(
  adminId: string,
  command: string,
  args: string[],
  status: "success" | "error" | "timeout" | "running",
  output?: string,
  errorMessage?: string,
  executionTime?: number,
  ipAddress?: string,
  userAgent?: string,
  commandId?: string
): Promise<string> {
  const logEntry = {
    id: commandId,
    admin_id: adminId,
    command,
    args: JSON.stringify(args),
    status,
    output: output || null,
    error_message: errorMessage || null,
    execution_time_ms: executionTime || null,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  };

  if (commandId) {
    // Update existing log entry
    const { error } = await supabaseServer
      .from("command_execution_logs")
      .update(logEntry)
      .eq("id", commandId);

    if (error) {
      console.error("Error updating command log:", error);
    }
    return commandId;
  } else {
    // Create new log entry
    const { data, error } = await supabaseServer
      .from("command_execution_logs")
      .insert(logEntry)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating command log:", error);
      return "unknown";
    }

    return data.id;
  }
}

/**
 * Executes a command securely with proper validation and logging
 */
async function executeCommand(
  command: string,
  args: string[],
  workingDirectory: string,
  timeout: number,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<CommandResult> {
  const startTime = Date.now();
  
  // Create initial log entry
  const commandId = await logCommandExecution(
    adminId,
    command,
    args,
    "running",
    undefined,
    undefined,
    undefined,
    ipAddress,
    userAgent
  );

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: workingDirectory,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV },
      stdio: ["ignore", "pipe", "pipe"],
      shell: false, // Important: disable shell to prevent injection
    });

    let stdout = "";
    let stderr = "";
    let isResolved = false;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        child.kill("SIGTERM");
        
        const executionTime = Date.now() - startTime;
        logCommandExecution(
          adminId,
          command,
          args,
          "timeout",
          stdout,
          "Command timed out",
          executionTime,
          ipAddress,
          userAgent,
          commandId
        );

        resolve({
          success: false,
          output: stdout,
          error: "Command timed out",
          executionTime,
          commandId,
        });
      }
    }, timeout);

    // Collect output
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    child.on("close", (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);

        const executionTime = Date.now() - startTime;
        const success = code === 0;
        const status = success ? "success" : "error";

        logCommandExecution(
          adminId,
          command,
          args,
          status,
          stdout,
          stderr || undefined,
          executionTime,
          ipAddress,
          userAgent,
          commandId
        );

        resolve({
          success,
          output: stdout,
          error: success ? undefined : stderr || `Command failed with exit code ${code}`,
          executionTime,
          commandId,
        });
      }
    });

    // Handle process errors
    child.on("error", (error) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);

        const executionTime = Date.now() - startTime;
        logCommandExecution(
          adminId,
          command,
          args,
          "error",
          stdout,
          error.message,
          executionTime,
          ipAddress,
          userAgent,
          commandId
        );

        resolve({
          success: false,
          output: stdout,
          error: error.message,
          executionTime,
          commandId,
        });
      }
    });
  });
}

/**
 * Verifies admin authentication and returns admin ID
 */
async function verifyAdminAccess(session: any): Promise<string | null> {
  if (!session?.user?.email) {
    return null;
  }

  // Check if user is an admin
  const { data: adminData, error } = await supabaseServer
    .from("admin_users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (error || !adminData) {
    return null;
  }

  return adminData.id;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin access
    const adminId = await verifyAdminAccess(session);
    if (!adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = commandExecutionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { command, args, workingDirectory, timeout } = parseResult.data;

    // Get client info for logging
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(adminId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.reason,
          resetTime: rateLimitResult.resetTime,
        },
        { status: 429 }
      );
    }

    // Validate command
    const validationResult = CommandValidator.validateCommand(command, args || []);
    if (!validationResult.isValid) {
      // Log failed validation attempt
      await logCommandExecution(
        adminId,
        command,
        args || [],
        "error",
        undefined,
        `Validation failed: ${validationResult.error}`,
        undefined,
        ipAddress,
        userAgent
      );

      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // Validate working directory
    const projectRoot = process.cwd();
    const finalWorkingDirectory = workingDirectory 
      ? path.resolve(projectRoot, workingDirectory)
      : projectRoot;

    const dirValidation = CommandValidator.validateWorkingDirectory(
      finalWorkingDirectory,
      projectRoot
    );
    if (!dirValidation.isValid) {
      return NextResponse.json(
        { error: dirValidation.error },
        { status: 400 }
      );
    }

    // Execute command
    const result = await executeCommand(
      command,
      validationResult.sanitizedArgs || args || [],
      finalWorkingDirectory,
      timeout || 60000,
      adminId,
      ipAddress,
      userAgent
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in command execution API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin access
    const adminId = await verifyAdminAccess(session);
    if (!adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get query parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const status = url.searchParams.get("status");
    const command = url.searchParams.get("command");

    // Build query
    let query = supabaseServer
      .from("command_execution_logs")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (command) {
      query = query.eq("command", command);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("Error fetching command history:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabaseServer
      .from("command_execution_logs")
      .select("*", { count: "exact", head: true })
      .eq("admin_id", adminId);

    if (status) {
      countQuery = countQuery.eq("status", status);
    }

    if (command) {
      countQuery = countQuery.eq("command", command);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error getting command count:", countError);
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error("Error in command history API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}