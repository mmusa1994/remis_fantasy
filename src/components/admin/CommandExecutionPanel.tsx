"use client";

import React, { useState, useRef, useEffect } from "react";
// Using standard HTML elements instead of custom UI components
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Terminal, 
  Play, 
  History,
  RefreshCw
} from "lucide-react";
import { ALLOWED_COMMANDS } from "@/lib/command-validator";

interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  commandId: string;
}

interface CommandHistoryEntry {
  id: string;
  command: string;
  args: string;
  status: "success" | "error" | "timeout" | "running";
  output: string;
  error_message?: string;
  execution_time_ms?: number;
  created_at: string;
}

interface CommandExecutionPanelProps {
  onCommandExecute?: (result: CommandResult) => void;
  disabled?: boolean;
}

export const CommandExecutionPanel: React.FC<CommandExecutionPanelProps> = ({
  onCommandExecute,
  disabled = false,
}) => {
  const [selectedCommand, setSelectedCommand] = useState<string>("");
  const [selectedSubcommand, setSelectedSubcommand] = useState<string>("");
  const [additionalArgs, setAdditionalArgs] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentResult, setCurrentResult] = useState<CommandResult | null>(null);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const outputRef = useRef<HTMLPreElement>(null);

  // Fetch command history on component mount
  useEffect(() => {
    fetchCommandHistory();
  }, []);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [currentResult]);

  const fetchCommandHistory = async () => {
    try {
      const response = await fetch("/api/admin/execute-command?limit=10");
      if (response.ok) {
        const data = await response.json();
        setCommandHistory(data.logs);
      }
    } catch (error) {
      console.error("Error fetching command history:", error);
    }
  };

  const executeCommand = async () => {
    if (!selectedCommand || isExecuting) return;

    setIsExecuting(true);
    setCurrentResult(null);

    const args = selectedSubcommand 
      ? [selectedSubcommand, ...additionalArgs]
      : additionalArgs;

    try {
      const response = await fetch("/api/admin/execute-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: selectedCommand,
          args: args.filter(Boolean),
          timeout: 300000, // 5 minutes
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setCurrentResult(result);
        onCommandExecute?.(result);
        fetchCommandHistory(); // Refresh history
      } else {
        setCurrentResult({
          success: false,
          output: "",
          error: result.error || "Command execution failed",
          executionTime: 0,
          commandId: "unknown",
        });
      }
    } catch (error) {
      setCurrentResult({
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Network error",
        executionTime: 0,
        commandId: "unknown",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getAvailableSubcommands = (): string[] => {
    if (!selectedCommand) return [];
    const commandConfig = ALLOWED_COMMANDS[selectedCommand as keyof typeof ALLOWED_COMMANDS];
    return [...(commandConfig?.subcommands || [])];
  };

  const getAvailableArgs = (): string[] => {
    if (!selectedCommand) return [];
    const commandConfig = ALLOWED_COMMANDS[selectedCommand as keyof typeof ALLOWED_COMMANDS];
    if (!commandConfig) return [];
    
    const argsKey = selectedSubcommand || "";
    return [...(commandConfig.args[argsKey as keyof typeof commandConfig.args] || [])];
  };

  const addArgument = (arg: string) => {
    if (!additionalArgs.includes(arg)) {
      setAdditionalArgs([...additionalArgs, arg]);
    }
  };

  const removeArgument = (index: number) => {
    setAdditionalArgs(additionalArgs.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "timeout":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Terminal className="h-4 w-4" />;
    }
  };

  // Note: getStatusColor is available if needed for future Badge components

  const reExecuteFromHistory = (entry: CommandHistoryEntry) => {
    const parsedArgs = JSON.parse(entry.args);
    setSelectedCommand(entry.command);
    
    if (parsedArgs.length > 0) {
      const subcommands = getAvailableSubcommands();
      if (subcommands.includes(parsedArgs[0])) {
        setSelectedSubcommand(parsedArgs[0]);
        setAdditionalArgs(parsedArgs.slice(1));
      } else {
        setSelectedSubcommand("");
        setAdditionalArgs(parsedArgs);
      }
    } else {
      setSelectedSubcommand("");
      setAdditionalArgs([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Command Builder */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Command Execution
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Command Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Command</label>
              <select 
                value={selectedCommand} 
                onChange={(e) => {
                  setSelectedCommand(e.target.value);
                  setSelectedSubcommand("");
                  setAdditionalArgs([]);
                }}
                disabled={disabled || isExecuting}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="">Select a command</option>
                {Object.keys(ALLOWED_COMMANDS).map((cmd) => (
                  <option key={cmd} value={cmd}>
                    {cmd}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcommand Selection */}
            {getAvailableSubcommands().length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Subcommand</label>
                <select 
                  value={selectedSubcommand} 
                  onChange={(e) => setSelectedSubcommand(e.target.value)}
                  disabled={disabled || isExecuting}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="">Select subcommand (optional)</option>
                  {getAvailableSubcommands().map((subcmd) => (
                    <option key={subcmd} value={subcmd}>
                      {subcmd}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Available Arguments */}
          {getAvailableArgs().length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Available Arguments</label>
              <div className="flex flex-wrap gap-2">
                {getAvailableArgs().map((arg) => (
                  <button
                    key={arg}
                    onClick={() => addArgument(arg)}
                    disabled={disabled || isExecuting || additionalArgs.includes(arg)}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {arg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Arguments */}
          {additionalArgs.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Selected Arguments</label>
              <div className="flex flex-wrap gap-2">
                {additionalArgs.map((arg, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => removeArgument(index)}
                  >
                    {arg} ×
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Command Preview */}
          {selectedCommand && (
            <div>
              <label className="block text-sm font-medium mb-2">Command Preview</label>
              <code className="block p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                {selectedCommand} {selectedSubcommand} {additionalArgs.join(" ")}
              </code>
            </div>
          )}

          {/* Execute Button */}
          <div className="flex gap-2">
            <button
              onClick={executeCommand}
              disabled={!selectedCommand || disabled || isExecuting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExecuting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isExecuting ? "Executing..." : "Execute Command"}
            </button>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Command Output */}
      {currentResult && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {getStatusIcon(currentResult.success ? "success" : "error")}
              Command Result
              <span className={`px-2 py-1 rounded-md text-sm ${
                currentResult.success 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}>
                {currentResult.success ? "Success" : "Failed"}
              </span>
              {currentResult.executionTime && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm">
                  {currentResult.executionTime}ms
                </span>
              )}
            </h3>
          </div>
          <div className="p-4">
            {currentResult.output && (
              <div>
                <label className="block text-sm font-medium mb-2">Output</label>
                <pre 
                  ref={outputRef}
                  className="bg-black text-green-400 p-4 rounded-md text-sm max-h-96 overflow-auto font-mono"
                >
                  {currentResult.output}
                </pre>
              </div>
            )}
            {currentResult.error && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2 text-red-600">Error</label>
                <pre className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-md text-sm max-h-48 overflow-auto font-mono">
                  {currentResult.error}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Command History */}
      {showHistory && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Commands
            </h3>
          </div>
          <div className="p-4">
            {commandHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No command history available</p>
            ) : (
              <div className="space-y-2">
                {commandHistory.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => reExecuteFromHistory(entry)}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(entry.status)}
                      <code className="text-sm">
                        {entry.command} {JSON.parse(entry.args).join(" ")}
                      </code>
                      <span className={`px-2 py-1 rounded-md text-xs ${
                        entry.status === "success" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : entry.status === "error"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : entry.status === "timeout"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleString()}
                      {entry.execution_time_ms && (
                        <span className="ml-2">({entry.execution_time_ms}ms)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandExecutionPanel;