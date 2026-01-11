"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";

export type FeaturedImage = {
  id: string;
  mediaUrl: string;
  childId: string;
  childName: string;
  createdAt: string;
  reactionCount: number;
} | null;

interface HeroImageProps {
  featured: FeaturedImage;
}

/**
 * 代表画像（Hero Image）表示コンポーネント
 *
 * - 画面上部1/3〜1/2の領域に代表画像を大きく表示
 * - アスペクト比を維持した表示（aspect-[4/3]）
 * - 画像がない場合のプレースホルダー表示
 * - Next.js Imageによる最適化配信
 */
export function HeroImage({ featured }: HeroImageProps) {
  if (!featured) {
    return (
      <div
        data-testid="hero-image-section"
        className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center"
      >
        <div className="text-center text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">この月の写真はありません</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="hero-image-section"
      className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg"
    >
      <Image
        src={featured.mediaUrl}
        alt={`${featured.childName}の写真`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 600px"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <p className="text-sm font-medium">{featured.childName}</p>
        {featured.reactionCount > 0 && (
          <p className="text-xs opacity-80">{featured.reactionCount} いいね</p>
        )}
      </div>
    </div>
  );
}
