"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, transitions } from "@/lib/animations";
import { MilestoneForm } from "./MilestoneForm";

type Milestone = {
  id: string;
  content: string;
};

type MilestoneListProps = {
  milestones: Milestone[];
  childId: string;
  year: number;
  month: number;
  onAdd: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function MilestoneList({
  milestones,
  onAdd,
  onDelete,
}: MilestoneListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const handleLongPressStart = useCallback((id: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      handleDeleteConfirm(id);
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleDeleteConfirm = async (id: string) => {
    if (window.confirm("このメモを削除しますか？")) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSubmit = async (content: string) => {
    await onAdd(content);
    setIsFormOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">
          できるようになったこと
        </h3>
        <motion.button
          onClick={() => setIsFormOpen(true)}
          whileTap={{ scale: 0.9 }}
          transition={transitions.spring}
          className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 hover:bg-amber-200"
          aria-label="メモを追加"
        >
          <PlusIcon className="w-5 h-5" />
        </motion.button>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <StarIcon className="w-10 h-10 mx-auto" />
          </div>
          <p className="text-gray-500 text-sm">まだメモがありません</p>
          <motion.button
            onClick={() => setIsFormOpen(true)}
            whileTap={{ scale: 0.95 }}
            transition={transitions.spring}
            className="mt-3 px-4 py-2 text-sm bg-amber-500 text-white rounded-full hover:bg-amber-600"
          >
            最初のメモを追加
          </motion.button>
        </div>
      ) : (
        <motion.ul
          className="space-y-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence mode="popLayout">
            {milestones.map((milestone) => (
              <motion.li
                key={milestone.id}
                variants={staggerItem}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                layout
                onTouchStart={() => handleLongPressStart(milestone.id)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                onMouseDown={() => handleLongPressStart(milestone.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                  deletingId === milestone.id
                    ? "bg-red-50 opacity-50"
                    : "hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                <span className="text-amber-500 mt-0.5">
                  <CheckCircleIcon className="w-5 h-5" />
                </span>
                <span className="text-gray-700 flex-1">{milestone.content}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <MilestoneForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
