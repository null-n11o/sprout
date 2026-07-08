"use client";

import { useState, useEffect } from "react";
import type { AdminUser } from "./types";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 各操作のloading
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("ユーザー情報の取得に失敗しました");
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 編集保存
  const saveUser = async (
    userId: string,
    form: { name: string; role: string }
  ): Promise<boolean> => {
    setEditLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      // ユーザー一覧を更新
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...form } : u))
      );
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
      return false;
    } finally {
      setEditLoading(false);
    }
  };

  // 削除実行
  const deleteUser = async (userId: string): Promise<boolean> => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      // ユーザー一覧から削除
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    editLoading,
    deleteLoading,
    fetchUsers,
    saveUser,
    deleteUser,
  };
}
