"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2Icon, PhoneIcon, PhoneOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Orb } from "@/components/ui/orb";
import { ShimmeringText } from "@/components/ui/shimmering-text";

const DEFAULT_AGENT = {
  agentId:
    process.env.NEXT_PUBLIC_AGENT_ID || "agent_8701kfjzrrhcf408keqd06k3pryw",
  name: "City Assistant",
  description: "Tap to start voice chat with your civic assistant",
};

type AgentState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | null;

function VoiceChatInterface() {
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => console.log("Connected to voice agent"),
    onDisconnect: () => console.log("Disconnected from voice agent"),
    onMessage: (message) => console.log("Voice message:", message),
    onError: (error) => {
      console.error("Voice agent error:", error);
      setAgentState("disconnected");
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setErrorMessage(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: DEFAULT_AGENT.agentId,
        connectionType: "webrtc",
        onStatusChange: (status) => setAgentState(status.status),
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      setAgentState("disconnected");
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setErrorMessage(
          "Please enable microphone permissions in your browser.",
        );
      }
    }
  }, [conversation]);

  const handleCall = useCallback(() => {
    if (agentState === "disconnected" || agentState === null) {
      setAgentState("connecting");
      startConversation();
    } else if (agentState === "connected") {
      conversation.endSession();
      setAgentState("disconnected");
    }
  }, [agentState, conversation, startConversation]);

  const isCallActive = agentState === "connected";
  const isTransitioning =
    agentState === "connecting" || agentState === "disconnecting";

  const getInputVolume = useCallback(() => {
    const rawValue = conversation.getInputVolume?.() ?? 0;
    return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5);
  }, [conversation]);

  const getOutputVolume = useCallback(() => {
    const rawValue = conversation.getOutputVolume?.() ?? 0;
    return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5);
  }, [conversation]);

  return (
    <Card className="flex h-[500px] w-full flex-col items-center justify-center overflow-hidden p-8">
      <div className="flex flex-col items-center gap-8">
        <div className="relative size-40">
          <div className="bg-muted relative h-full w-full rounded-full p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
              <Orb
                className="h-full w-full"
                volumeMode="manual"
                getInputVolume={getInputVolume}
                getOutputVolume={getOutputVolume}
                agentState={
                  agentState === "connected"
                    ? "talking"
                    : agentState === "connecting"
                      ? "thinking"
                      : null
                }
                colors={["#3b82f6", "#1d4ed8"]}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-semibold">{DEFAULT_AGENT.name}</h2>
          <AnimatePresence mode="wait">
            {errorMessage ? (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-destructive text-center text-sm max-w-sm"
              >
                {errorMessage}
              </motion.p>
            ) : agentState === "disconnected" || agentState === null ? (
              <motion.p
                key="disconnected"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-muted-foreground text-center text-sm max-w-sm"
              >
                {DEFAULT_AGENT.description}
              </motion.p>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2"
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    agentState === "connected" && "bg-green-500",
                    isTransitioning && "bg-primary/60 animate-pulse",
                  )}
                />
                <span className="text-sm capitalize">
                  {isTransitioning ? (
                    <ShimmeringText text={agentState} />
                  ) : (
                    <span className="text-green-600">Connected</span>
                  )}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          onClick={handleCall}
          disabled={isTransitioning}
          size="lg"
          variant={isCallActive ? "secondary" : "default"}
          className="h-14 w-14 rounded-full"
        >
          <AnimatePresence mode="wait">
            {isTransitioning ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{
                  rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                }}
              >
                <Loader2Icon className="h-6 w-6" />
              </motion.div>
            ) : isCallActive ? (
              <motion.div
                key="end"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <PhoneOffIcon className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <PhoneIcon className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </Card>
  );
}

export default function VoiceAgentPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Voice Agent Assistant
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Interact with our AI-powered voice agent to report issues, get
          information, and navigate through the platform using natural speech.
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-8">
        <Badge variant="secondary" className="px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Voice Agent Ready
          </div>
        </Badge>
      </div>

      {/* Main Voice Agent Interface */}
      <div className="mb-8">
        <VoiceChatInterface />
      </div>

      {/* Information Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              What You Can Do
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Report Issues</p>
                  <p className="text-sm text-muted-foreground">
                    Describe problems in your area using natural speech
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Get Information</p>
                  <p className="text-sm text-muted-foreground">
                    Ask about ongoing projects and issue status
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Navigation Help</p>
                  <p className="text-sm text-muted-foreground">
                    Get guided assistance using the platform
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Emergency Reporting</p>
                  <p className="text-sm text-muted-foreground">
                    Quickly report urgent issues that need immediate attention
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Voice Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Speak Clearly</p>
                <p className="text-xs text-muted-foreground">
                  Use clear, normal speech for best recognition
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Be Specific</p>
                <p className="text-xs text-muted-foreground">
                  Include location details and specific problem descriptions
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Wait for Response</p>
                <p className="text-xs text-muted-foreground">
                  Allow the agent to process and respond to your request
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Example Phrases */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Example Phrases</CardTitle>
          <CardDescription>
            Try saying these phrases to get started with the voice agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Reporting Issues:</h4>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  &quot;There&apos;s a pothole on Main Street near the
                  library&quot;
                </p>
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  &quot;The streetlight is broken on 5th Avenue&quot;
                </p>
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  &quot;I want to report illegal dumping in Central Park&quot;
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Getting Help:</h4>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  &quot;How do I check the status of my report?&quot;
                </p>
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  &quot;Show me the dashboard&quot;
                </p>
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  &quot;What&apos;s happening in my neighborhood?&quot;
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
