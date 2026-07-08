"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  Calendar,
  Shield,
  Loader2,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";
import type { AdminUser } from "@/components/admin/types";
import { useAdminUsers } from "@/components/admin/useAdminUsers";
import { UserEditModal } from "@/components/admin/UserEditModal";
import { UserDeleteModal } from "@/components/admin/UserDeleteModal";

export default function AdminPage() {
  const {
    users,
    loading,
    error,
    editLoading,
    deleteLoading,
    fetchUsers,
    saveUser,
    deleteUser,
  } = useAdminUsers();

  // 編集モーダル
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // 削除確認モーダル
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      google: "bg-blue-100 text-blue-700",
      email: "bg-gray-100 text-gray-700",
    };
    return colors[provider] || "bg-gray-100 text-gray-700";
  };

  // 編集保存
  const handleEditSave = async (form: { name: string; role: string }) => {
    if (!editingUser) return;
    const ok = await saveUser(editingUser.id, form);
    if (ok) {
      setEditingUser(null);
    }
  };

  // 削除実行
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    const ok = await deleteUser(deletingUser.id);
    if (ok) {
      setDeletingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ユーザー管理</h2>
          <p className="text-gray-500 mt-1">
            登録されている全ユーザーを確認・編集・削除できます
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          更新
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">総ユーザー数</p>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Google認証</p>
              <p className="text-2xl font-bold text-gray-800">
                {users.filter((u) => u.provider === "google").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">メール認証</p>
              <p className="text-2xl font-bold text-gray-800">
                {users.filter((u) => u.provider === "email").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              再試行
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メールアドレス
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    認証方法
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日時
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終ログイン
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProviderBadge(
                          user.provider
                        )}`}
                      >
                        {user.provider === "google" ? "Google" : "Email"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">
                        {formatDate(user.lastSignInAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="編集"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          loading={editLoading}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSave}
        />
      )}

      {/* 削除確認モーダル */}
      {deletingUser && (
        <UserDeleteModal
          user={deletingUser}
          loading={deleteLoading}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
