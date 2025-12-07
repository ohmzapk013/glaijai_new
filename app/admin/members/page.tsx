"use client";

import { useState, useEffect } from "react";
import { User, Loader2, Check, X, Trash2, Plus, Pencil, Package, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/Modal";

interface Member {
    email: string;
    displayName: string;
    createdAt: string;
    lastLogin: string | null;
    isActive: boolean;
    lockoutUntil?: string | null;
}

export default function AdminMembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);

    // Form state
    const [formEmail, setFormEmail] = useState("");
    const [formDisplayName, setFormDisplayName] = useState("");
    const [formPassword, setFormPassword] = useState("");

    // Packs Modal state
    const [isPacksModalOpen, setIsPacksModalOpen] = useState(false);
    const [memberPacks, setMemberPacks] = useState<any[]>([]);
    const [loadingPacks, setLoadingPacks] = useState(false);
    const [selectedMemberName, setSelectedMemberName] = useState("");

    useEffect(() => {
        fetchMembers();
    }, [page]);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/members?page=${page}&limit=20`);
            const data = await res.json();
            if (data.data) {
                setMembers(data.data);
                setTotalPages(data.meta.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch members", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingMember(null);
        setFormEmail("");
        setFormDisplayName("");
        setFormPassword("");
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (member: Member) => {
        setEditingMember(member);
        setFormEmail(member.email);
        setFormDisplayName(member.displayName);
        setFormPassword("");
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMember(null);
        setFormEmail("");
        setFormDisplayName("");
        setFormPassword("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = "/api/members";
            const method = editingMember ? "PUT" : "POST";
            const body: any = {
                displayName: formDisplayName,
            };

            if (editingMember) {
                body.email = editingMember.email;
                if (formEmail !== editingMember.email) {
                    body.newEmail = formEmail;
                }
                if (formPassword) {
                    body.password = formPassword;
                }
            } else {
                body.email = formEmail;
                body.password = formPassword;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                await fetchMembers();
                handleCloseModal();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save member");
            }
        } catch (error) {
            console.error("Failed to save member", error);
            alert("Failed to save member");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleActive = async (email: string, currentStatus: boolean) => {
        try {
            const res = await fetch("/api/members", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, isActive: !currentStatus }),
            });

            if (res.ok) {
                setMembers(
                    members.map((m) =>
                        m.email === email ? { ...m, isActive: !currentStatus } : m
                    )
                );
            }
        } catch (error) {
            console.error("Failed to update member", error);
        }
    };

    const deleteMember = async (email: string) => {
        if (!confirm(`คุณต้องการลบสมาชิก ${email} ใช่หรือไม่?`)) return;

        try {
            const res = await fetch(`/api/members?email=${email}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setMembers(members.filter((m) => m.email !== email));
            }
        } catch (error) {
            console.error("Failed to delete member", error);
        }
    };

    const handleDeletePack = async (packId: string) => {
        if (!confirm("คุณต้องการลบชุดคำถามนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

        try {
            const res = await fetch(`/api/admin/packs/${packId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setMemberPacks(memberPacks.filter(p => p.id !== packId));
            } else {
                alert("ไม่สามารถลบชุดคำถามได้");
            }
        } catch (error) {
            console.error("Failed to delete pack", error);
            alert("เกิดข้อผิดพลาดในการลบชุดคำถาม");
        }
    };

    const handleViewPacks = async (member: Member) => {
        setSelectedMemberName(member.displayName);
        setIsPacksModalOpen(true);
        setLoadingPacks(true);
        setMemberPacks([]);

        try {
            // Encode email to handle special characters
            const encodedEmail = encodeURIComponent(member.email);
            const res = await fetch(`/api/admin/members/${encodedEmail}/packs`);
            const data = await res.json();

            if (data.packs) {
                setMemberPacks(data.packs);
            }
        } catch (error) {
            console.error("Failed to fetch member packs", error);
            alert("ไม่สามารถดึงข้อมูลชุดคำถามได้");
        } finally {
            setLoadingPacks(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "ยังไม่เคยเข้าสู่ระบบ";
        return new Date(dateString).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isLocked = (lockoutUntil?: string | null) => {
        if (!lockoutUntil) return false;
        return new Date(lockoutUntil).getTime() > new Date().getTime();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">จัดการสมาชิก</h1>
                    <p className="text-gray-500">จัดการบัญชีผู้ใช้งานทั่วไป</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <Plus size={20} />
                    เพิ่มสมาชิก
                </button>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingMember ? "แก้ไขสมาชิก" : "เพิ่มสมาชิกใหม่"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อผู้ใช้งาน
                        </label>
                        <input
                            type="text"
                            value={formDisplayName}
                            onChange={(e) => setFormDisplayName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                            placeholder="กรอกชื่อผู้ใช้งาน"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            อีเมล
                        </label>
                        <input
                            type="email"
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                            placeholder="email@example.com"
                            required
                            disabled={!!editingMember}
                        />
                        {editingMember && (
                            <p className="text-xs text-gray-500 mt-1">
                                ไม่สามารถแก้ไขอีเมลได้
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            รหัสผ่าน {editingMember && "(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)"}
                        </label>
                        <input
                            type="password"
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                            placeholder="กรอกรหัสผ่าน"
                            required={!editingMember}
                            minLength={6}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : editingMember ? (
                                <>
                                    <Pencil size={18} />
                                    บันทึก
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    เพิ่มสมาชิก
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Packs List Modal */}
            <Modal
                isOpen={isPacksModalOpen}
                onClose={() => setIsPacksModalOpen(false)}
                title={`ชุดคำถามของ ${selectedMemberName}`}
            >
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {loadingPacks ? (
                        <div className="text-center py-8">
                            <Loader2 className="animate-spin mx-auto text-pink-500" size={32} />
                        </div>
                    ) : memberPacks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Package className="mx-auto mb-2 opacity-50" size={32} />
                            <p>ยังไม่มีชุดคำถามที่สร้างไว้</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {memberPacks.map((pack) => (
                                <div
                                    key={pack.id}
                                    className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-800">{pack.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${pack.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {pack.isPublic ? 'สาธารณะ' : 'ส่วนตัว'}
                                            </span>
                                            <button
                                                onClick={() => handleDeletePack(pack.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบชุดคำถาม"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                        {pack.description || "ไม่มีคำอธิบาย"}
                                    </p>

                                    {/* Questions Toggle */}
                                    <details className="group">
                                        <summary className="flex items-center gap-2 text-sm text-pink-500 cursor-pointer hover:text-pink-600 font-medium mb-2 select-none">
                                            <Package size={14} />
                                            ดูคำถาม ({pack.questions?.length || 0})
                                        </summary>
                                        <div className="pl-4 border-l-2 border-pink-100 space-y-2 mt-2">
                                            {pack.questions?.map((q: any, idx: number) => (
                                                <div key={idx} className="text-sm">
                                                    <p className="text-gray-800">{idx + 1}. {q.content_th}</p>
                                                    {q.content_en && <p className="text-gray-500 text-xs">{q.content_en}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </details>

                                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                                        <span className="flex items-center gap-1">
                                            <User size={14} />
                                            เล่นแล้ว {pack.playCount || 0} ครั้ง
                                        </span>
                                        <span>
                                            {new Date(pack.createdAt).toLocaleDateString('th-TH')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={() => setIsPacksModalOpen(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        ปิด
                    </button>
                </div>
            </Modal>

            {isLoading ? (
                <div className="text-center py-12">
                    <Loader2 className="animate-spin mx-auto text-pink-500" size={40} />
                </div>
            ) : members.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    ยังไม่มีสมาชิกในระบบ
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                        สมาชิก
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                        วันที่สมัคร
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                        เข้าสู่ระบบล่าสุด
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                                        สถานะ
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {members.map((member) => (
                                        <motion.tr
                                            key={member.email}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800">
                                                            {member.displayName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(member.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(member.lastLogin)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            toggleActive(member.email, member.isActive)
                                                        }
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${member.isActive
                                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                            : "bg-red-100 text-red-700 hover:bg-red-200"
                                                            }`}
                                                    >
                                                        {member.isActive ? (
                                                            <>
                                                                <Check size={14} />
                                                                เปิดใช้งาน
                                                            </>
                                                        ) : (
                                                            <>
                                                                <X size={14} />
                                                                ปิดใช้งาน
                                                            </>
                                                        )}
                                                    </button>

                                                    {isLocked(member.lockoutUntil) && (
                                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                                                            <Lock size={12} />
                                                            {`ติดสถานะล็อค: ${new Date(member.lockoutUntil!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewPacks(member)}
                                                        className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="ดูชุดคำถาม"
                                                    >
                                                        <Package size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(member)}
                                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMember(member.email)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ก่อนหน้า
                            </button>
                            <span className="px-4 py-2 text-gray-600">
                                หน้า {page} จาก {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ถัดไป
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
