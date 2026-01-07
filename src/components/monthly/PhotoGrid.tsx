"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn, transitions } from "@/lib/animations";

type Photo = {
  id: string;
  media_url: string;
  created_at: string;
};

type PhotoGridProps = {
  photos: Photo[];
};

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // 投稿日時の新しい順でソート
  const sortedPhotos = [...photos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (photos.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-8 text-center">
        <div className="text-gray-400 mb-2">
          <PhotoIcon className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-500">この月の写真はありません</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {sortedPhotos.map((photo) => (
          <motion.button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            whileTap={{ scale: 0.95 }}
            transition={transitions.spring}
            className="relative aspect-square bg-gray-100 overflow-hidden"
          >
            <Image
              src={photo.media_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
            />
          </motion.button>
        ))}
      </div>

      {/* 拡大表示オーバーレイ */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.button
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
              onClick={() => setSelectedPhoto(null)}
              whileTap={{ scale: 0.9 }}
              transition={transitions.spring}
              aria-label="閉じる"
            >
              <CloseIcon className="w-8 h-8" />
            </motion.button>

            <motion.div
              className="relative w-full h-full max-w-4xl max-h-[80vh] m-4"
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedPhoto.media_url}
                alt=""
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PhotoIcon({ className }: { className?: string }) {
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
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
