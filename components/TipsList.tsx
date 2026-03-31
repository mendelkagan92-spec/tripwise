"use client";

import { useState } from "react";
import Button from "./ui/Button";

interface Tip {
  id: string;
  content: string;
  upvotes: number;
  user: { name: string | null };
  votes?: { userId: string }[];
}

export default function TipsList({
  tips,
  placeId,
  currentUserId,
  onVote,
  onAddTip,
}: {
  tips: Tip[];
  placeId: string;
  currentUserId?: string;
  onVote: (placeId: string, tipId: string) => void;
  onAddTip: (placeId: string, content: string) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [newTip, setNewTip] = useState("");

  const handleSubmit = () => {
    if (newTip.trim()) {
      onAddTip(placeId, newTip.trim());
      setNewTip("");
      setShowInput(false);
    }
  };

  return (
    <div className="space-y-2">
      {tips.map((tip) => {
        const hasVoted = tip.votes?.some((v) => v.userId === currentUserId) || false;
        return (
          <div key={tip.id} className="flex items-start gap-2 text-sm">
            <button
              onClick={() => onVote(placeId, tip.id)}
              className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                hasVoted
                  ? "bg-accent/20 text-accent"
                  : "bg-background text-text-secondary hover:text-text-primary"
              }`}
            >
              <span>▲</span>
              <span>{tip.upvotes}</span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary">{tip.content}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                — {tip.user.name || "Anonymous"}
              </p>
            </div>
          </div>
        );
      })}

      {showInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTip}
            onChange={(e) => setNewTip(e.target.value)}
            placeholder="Share a tip..."
            className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          <Button size="sm" onClick={handleSubmit}>Add</Button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="text-xs text-accent hover:underline"
        >
          + Add a tip
        </button>
      )}
    </div>
  );
}
