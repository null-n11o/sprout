"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { transitions } from "@/lib/animations";

type Photo = {
  id: string;
  media_url: string;
  created_at: string;
};

type PhotoDisplayProps = {
  photos: Photo[];
  year: number;
  month: number;
  onPhotoTap: () => void;
};

export function PhotoDisplay({
  photos,
  year,
  month,
  onPhotoTap,
}: PhotoDisplayProps) {
  const [mainIndex, setMainIndex] = useState(0);

  // 写真が変わったらランダムでメインを選択
  useEffect(() => {
    if (photos.length > 0) {
      setMainIndex(Math.floor(Math.random() * photos.length));
    }
  }, [photos, year, month]);

  if (photos.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-8 text-center">
        <div className="text-gray-400 mb-2">
          <PhotoIcon className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-500">写真がありません</p>
      </div>
    );
  }

  const mainPhoto = photos[mainIndex];
  const thumbnails = photos.filter((_, i) => i !== mainIndex).slice(0, 4);

  return (
    <motion.div
      className="flex gap-3"
      whileTap={{ scale: 0.98 }}
      transition={transitions.spring}
      onClick={onPhotoTap}
    >
      {/* メイン写真 */}
      <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-pointer">
        <Image
          src={mainPhoto.media_url}
          alt="メイン写真"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 60vw, 400px"
        />
      </div>

      {/* サムネイル群 */}
      {thumbnails.length > 0 && (
        <div className="flex flex-col gap-2 w-20">
          {thumbnails.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
            >
              <Image
                src={photo.media_url}
                alt="サムネイル"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
          {photos.length > 5 && (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                +{photos.length - 5}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
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
