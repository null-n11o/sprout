"use client";

import { Modal } from "./Modal";
import { Heart, Sprout } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="アプリについて">
      <div className="p-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-coral-300 to-mint-300 rounded-2xl flex items-center justify-center mb-3">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Sprout</h3>
          <p className="text-sm text-gray-500">世界一温かいクローズド家族専用SNS</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">バージョン</span>
            <span className="font-medium text-gray-800">0.1.0</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">ビルド</span>
            <span className="font-medium text-gray-800">2024.01</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">開発者</span>
            <span className="font-medium text-gray-800">中野家</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-cream-50 rounded-xl">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            このアプリは、大切な家族の思い出を
            <br />
            ずっと残していくために作られました。
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1 text-gray-400">
          <span className="text-sm">Made with</span>
          <Heart className="w-4 h-4 fill-coral-400 text-coral-400" />
          <span className="text-sm">for the family</span>
        </div>
      </div>
    </Modal>
  );
}
