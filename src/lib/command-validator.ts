import { z } from "zod";

// Command validation schema
export const commandExecutionSchema = z.object({
  command: z.string().min(1).max(100),
  args: z.array(z.string()).optional().default([]),
  workingDirectory: z.string().optional(),
  timeout: z.number().min(1000).max(300000).optional().default(60000), // 1 second to 5 minutes
});

export type CommandExecutionRequest = z.infer<typeof commandExecutionSchema>;

// Define allowed commands and their permitted arguments
export const ALLOWED_COMMANDS = {
  npm: {
    subcommands: ["install", "run", "audit", "update", "ci"],
    args: {
      run: ["build", "lint", "dev", "start", "test"],
      install: ["--force", "--legacy-peer-deps", "--production"],
      audit: ["--audit-level", "fix"],
      ci: ["--production"],
      update: [],
    },
    maxArgs: 3,
  },
  next: {
    subcommands: ["build", "lint", "start"],
    args: {
      lint: ["--fix", "--quiet"],
      build: [],
      start: [],
    },
    maxArgs: 2,
  },
  git: {
    subcommands: ["status", "log", "diff", "branch"],
    args: {
      log: ["--oneline", "-n", "--graph", "--pretty=format"],
      diff: ["--name-only", "--stat"],
      branch: ["-v", "--list"],
      status: ["--porcelain"],
    },
    maxArgs: 5,
  },
  ls: {
    subcommands: [],
    args: {
      "": ["-la", "-l", "-a", "-R", "--help"],
    },
    maxArgs: 2,
  },
  pwd: {
    subcommands: [],
    args: {
      "": [],
    },
    maxArgs: 0,
  },
} as const;

// Dangerous patterns to reject
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i,
  /sudo/i,
  /passwd/i,
  /shadow/i,
  /\.\.\//, // Path traversal
  /\$\(/, // Command substitution
  /`/, // Backticks
  /;/, // Command chaining
  /\|/, // Pipes
  /&/, // Background execution
  />/, // Redirection
  /</, // Input redirection
];

// Special characters that should be rejected in arguments
const DANGEROUS_CHARS = /[;&|`$()><]/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedArgs?: string[];
}

export class CommandValidator {
  /**
   * Validates a command and its arguments against the whitelist
   */
  static validateCommand(
    command: string,
    args: string[] = []
  ): ValidationResult {
    // Check if command is whitelisted
    const allowedCommand = ALLOWED_COMMANDS[command as keyof typeof ALLOWED_COMMANDS];
    if (!allowedCommand) {
      return {
        isValid: false,
        error: `Command '${command}' is not whitelisted`,
      };
    }

    // Check argument count
    if (args.length > allowedCommand.maxArgs) {
      return {
        isValid: false,
        error: `Too many arguments for command '${command}'. Maximum allowed: ${allowedCommand.maxArgs}`,
      };
    }

    // Validate arguments
    const validationResult = this.validateArguments(command, args, allowedCommand);
    if (!validationResult.isValid) {
      return validationResult;
    }

    // Check for dangerous patterns
    const fullCommand = `${command} ${args.join(" ")}`;
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(fullCommand)) {
        return {
          isValid: false,
          error: `Command contains dangerous pattern: ${pattern.source}`,
        };
      }
    }

    return {
      isValid: true,
      sanitizedArgs: validationResult.sanitizedArgs,
    };
  }

  /**
   * Validates command arguments against allowed patterns
   */
  private static validateArguments(
    command: string,
    args: string[],
    allowedCommand: any
  ): ValidationResult {
    if (args.length === 0) {
      return { isValid: true, sanitizedArgs: [] };
    }

    const sanitizedArgs: string[] = [];

    // For commands with subcommands (like npm run build)
    if (allowedCommand.subcommands.length > 0) {
      const [subcommand, ...remainingArgs] = args;

      // Validate subcommand
      if (!allowedCommand.subcommands.includes(subcommand)) {
        return {
          isValid: false,
          error: `Subcommand '${subcommand}' is not allowed for '${command}'`,
        };
      }

      sanitizedArgs.push(subcommand);

      // Validate remaining arguments
      const allowedArgs = allowedCommand.args[subcommand] || [];
      for (const arg of remainingArgs) {
        const sanitizedArg = this.sanitizeArgument(arg);
        if (!sanitizedArg) {
          return {
            isValid: false,
            error: `Invalid argument: '${arg}'`,
          };
        }

        // Check if argument is in allowed list for this subcommand
        if (allowedArgs.length > 0 && !this.isArgumentAllowed(sanitizedArg, allowedArgs)) {
          return {
            isValid: false,
            error: `Argument '${sanitizedArg}' is not allowed for '${command} ${subcommand}'`,
          };
        }

        sanitizedArgs.push(sanitizedArg);
      }
    } else {
      // For commands without subcommands (like ls, pwd)
      const allowedArgs = allowedCommand.args[""] || [];
      for (const arg of args) {
        const sanitizedArg = this.sanitizeArgument(arg);
        if (!sanitizedArg) {
          return {
            isValid: false,
            error: `Invalid argument: '${arg}'`,
          };
        }

        if (allowedArgs.length > 0 && !this.isArgumentAllowed(sanitizedArg, allowedArgs)) {
          return {
            isValid: false,
            error: `Argument '${sanitizedArg}' is not allowed for '${command}'`,
          };
        }

        sanitizedArgs.push(sanitizedArg);
      }
    }

    return { isValid: true, sanitizedArgs };
  }

  /**
   * Sanitizes an individual argument
   */
  private static sanitizeArgument(arg: string): string | null {
    // Reject arguments with dangerous characters
    if (DANGEROUS_CHARS.test(arg)) {
      return null;
    }

    // Reject path traversal attempts
    if (arg.includes("../") || arg.includes("..\\")) {
      return null;
    }

    // Reject absolute paths (except for allowed patterns)
    if (arg.startsWith("/") && !this.isAllowedAbsolutePath(arg)) {
      return null;
    }

    // Trim and limit length
    const trimmed = arg.trim();
    if (trimmed.length === 0 || trimmed.length > 200) {
      return null;
    }

    return trimmed;
  }

  /**
   * Checks if an argument is in the allowed list
   */
  private static isArgumentAllowed(arg: string, allowedArgs: string[]): boolean {
    return allowedArgs.some((allowed) => {
      // Exact match
      if (arg === allowed) return true;
      
      // Pattern match for arguments with values (like --audit-level=high)
      if (allowed.includes("=") && arg.startsWith(allowed.split("=")[0] + "=")) {
        return true;
      }
      
      // Special handling for numeric arguments (like -n 10)
      if (allowed === "-n" && /^\d+$/.test(arg)) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Checks if an absolute path is allowed
   */
  private static isAllowedAbsolutePath(path: string): boolean {
    const allowedPaths = [
      "/tmp",
      "/dev/null",
    ];
    
    return allowedPaths.some((allowed) => path.startsWith(allowed));
  }

  /**
   * Validates working directory
   */
  static validateWorkingDirectory(dir: string, projectRoot: string): ValidationResult {
    if (!dir) {
      return { isValid: true };
    }

    // Must be within project root
    if (!dir.startsWith(projectRoot)) {
      return {
        isValid: false,
        error: "Working directory must be within project root",
      };
    }

    // No path traversal
    if (dir.includes("../")) {
      return {
        isValid: false,
        error: "Path traversal not allowed in working directory",
      };
    }

    return { isValid: true };
  }
}

export default CommandValidator;