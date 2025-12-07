"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/Modal";

interface UserData {
    username: string;
    permissions: string[];
    createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "categories", label: "Categories & Questions" },
    { id: "members", label: "Members (Public Users)" },
    { id: "users", label: "Users (Admin)" },
];

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [permissions, setPermissions] = useState<string[]>([]);
    const [editingUser, setEditingUser] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (user: UserData) => {
        setEditingUser(user.username);
        setUsername(user.username);
        setPassword("");
        setPermissions(user.permissions);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setUsername("");
        setPassword("");
        setPermissions([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = "/api/users";
            const method = editingUser ? "PUT" : "POST";
            const body: any = { username, permissions };
            if (password) body.password = password;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                await fetchUsers();
                handleCloseModal();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save user");
            }
        } catch (error) {
            console.error("Failed to save user", error);
            alert("Failed to save user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (username: string) => {
        if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

        try {
            const res = await fetch(`/api/users?username=${username}`, { method: "DELETE" });
            if (res.ok) {
                setUsers(users.filter((u) => u.username !== username));
            }
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    };

    const togglePermission = (permissionId: string) => {
        setPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(p => p !== permissionId)
                : [...prev, permissionId]
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    <p className="text-gray-500">Manage admin users and their permissions.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setUsername("");
                        setPassword("");
                        setPermissions([]);
                        setIsModalOpen(true);
                    }}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add User
                </button>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingUser ? "Edit User" : "Add New User"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                            placeholder="Enter username"
                            required
                            disabled={!!editingUser}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password {editingUser && "(leave blank to keep current)"}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                            placeholder="Enter password"
                            required={!editingUser}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                        <div className="space-y-2">
                            {AVAILABLE_PERMISSIONS.map((perm) => (
                                <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissions.includes(perm.id)}
                                        onChange={() => togglePermission(perm.id)}
                                        className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                                    />
                                    <span className="text-sm text-gray-700">{perm.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingUser ? <Pencil size={18} /> : <Plus size={18} />)}
                            {editingUser ? "Update User" : "Add User"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        No users found. Add one above!
                    </div>
                ) : (
                    <AnimatePresence>
                        {users.map((user) => (
                            <motion.div
                                key={user.username}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center flex-shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-800">{user.username}</h3>
                                        <p className="text-sm text-gray-500">
                                            {user.permissions.length > 0
                                                ? user.permissions.join(", ")
                                                : "No permissions"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.username)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
