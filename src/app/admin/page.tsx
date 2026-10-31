"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Lock,
  Unlock,
  Key,
  FolderSync,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Trash2,
  MapPin,
  Camera,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Globe,
  Star,
  X,
  Image as ImageIcon,
  Check,
  Edit3,
  GitMerge,
} from "lucide-react";

interface CountryVisit {
  id: string;
  title: string;
  slug: string;
  dateLabel: string;
  city: string;
  photoCount: number;
  status: string;
  createdAt: string;
}

interface CountryFolder {
  country: string;
  driveFolderId: string | null;
  driveFolderUrl: string | null;
  coverPhotoUrl: string | null;
  totalPhotos: number;
  visits: CountryVisit[];
}

function AdminContent() {
  const router = useRouter();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Sync Input & Progress
  const [folderUrl, setFolderUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingFolderId, setSyncingFolderId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<any | null>(null);

  // Synced Countries List
  const [countries, setCountries] = useState<CountryFolder[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  // Cover Photo Selector Modal
  const [coverModalTrip, setCoverModalTrip] = useState<{
    id: string;
    title: string;
    currentCoverUrl?: string | null;
  } | null>(null);
  const [coverPhotos, setCoverPhotos] = useState<any[]>([]);
  const [loadingCoverPhotos, setLoadingCoverPhotos] = useState(false);
  const [settingCoverPhotoId, setSettingCoverPhotoId] = useState<string | null>(null);
  const [coverSuccessMessage, setCoverSuccessMessage] = useState<string | null>(null);

  // Edit & Merge Visit Modal
  const [editingVisit, setEditingVisit] = useState<{
    id: string;
    title: string;
    dateLabel: string;
    city: string;
    country: string;
    photoCount: number;
    otherVisitsInCountry: { id: string; title: string; photoCount: number }[];
  } | null>(null);
  const [editDateInput, setEditDateInput] = useState("");
  const [editTitleInput, setEditTitleInput] = useState("");
  const [editCityInput, setEditCityInput] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [editMessage, setEditMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem("roamlog_admin_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const res = await fetch("/api/admin/countries");
      if (res.ok) {
        const data = await res.json();
        setCountries(data.countries || []);
      }
    } catch (e) {
      console.error("Failed to load country folders:", e);
    } finally {
      setLoadingCountries(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "roamlog" || passwordInput === "admin") {
      setIsAuthenticated(true);
      localStorage.setItem("roamlog_admin_auth", "true");
      setAuthError("");
    } else {
      setAuthError("Password salah. Silakan coba lagi.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("roamlog_admin_auth");
  };

  // Perform sync or re-sync for a folder URL
  const handleSync = async (targetUrl = folderUrl, targetFolderId?: string) => {
    if (!targetUrl.trim()) {
      setSyncError("Silakan masukkan link folder Google Drive terlebih dahulu.");
      return;
    }

    if (targetFolderId) {
      setSyncingFolderId(targetFolderId);
    } else {
      setIsSyncing(true);
    }
    setSyncError(null);
    setSyncSummary(null);

    try {
      const res = await fetch("/api/trips/sync-country", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderUrl: targetUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan sinkronisasi Google Drive.");
      }

      setSyncSummary(data);
      if (!targetFolderId) {
        setFolderUrl("");
      }
      fetchCountries();
    } catch (err: any) {
      setSyncError(err.message || "Terjadi kesalahan saat sinkronisasi.");
    } finally {
      setIsSyncing(false);
      setSyncingFolderId(null);
    }
  };

  const handleDeleteTrip = async (tripId: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus album kunjungan "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (res.ok) {
        fetchCountries();
      } else {
        alert("Gagal menghapus album.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus album.");
    }
  };

  const handleDeleteCountry = async (countryName: string, driveFolderId?: string | null) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus seluruh album untuk negara "${countryName}" beserta semua fotonya?`
      )
    ) {
      return;
    }

    try {
      const q = driveFolderId
        ? `driveFolderId=${encodeURIComponent(driveFolderId)}`
        : `country=${encodeURIComponent(countryName)}`;
      const res = await fetch(`/api/admin/countries?${q}`, { method: "DELETE" });
      if (res.ok) {
        fetchCountries();
      } else {
        alert("Gagal menghapus folder negara.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus folder negara.");
    }
  };

  const handleResetAll = async () => {
    if (
      !confirm(
        "PERINGATAN: Apakah Anda yakin ingin mengosongkan semua data uji coba?\n\nSemua album kunjungan dan foto akan dihapus dari database sehingga Anda dapat mulai sinkronisasi bersih dari awal."
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/admin/countries?action=reset-all", { method: "DELETE" });
      if (res.ok) {
        setSyncSummary(null);
        fetchCountries();
        alert("Semua data berhasil dibersihkan.");
      } else {
        alert("Gagal mengosongkan data.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat mengosongkan database.");
    }
  };

  const openEditModal = (
    visit: CountryVisit,
    countryName: string,
    allVisitsInCountry: CountryVisit[]
  ) => {
    const others = allVisitsInCountry
      .filter((v) => v.id !== visit.id)
      .map((v) => ({ id: v.id, title: v.title, photoCount: v.photoCount }));

    setEditingVisit({
      id: visit.id,
      title: visit.title,
      dateLabel: visit.dateLabel,
      city: visit.city,
      country: countryName,
      photoCount: visit.photoCount,
      otherVisitsInCountry: others,
    });
    setEditDateInput(visit.dateLabel);
    setEditTitleInput(visit.title);
    setEditCityInput(visit.city);
    setMergeTargetId(others[0]?.id || "");
    setEditMessage(null);
  };

  const handleSaveVisitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisit) return;
    setIsSavingEdit(true);
    setEditMessage(null);

    try {
      const res = await fetch(`/api/trips/${editingVisit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateLabel: editDateInput.trim(),
          title: editTitleInput.trim(),
          city: editCityInput.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan perubahan.");
      }

      setEditMessage({ type: "success", text: "Perubahan tanggal dan detail berhasil disimpan!" });
      fetchCountries();
      setTimeout(() => {
        setEditingVisit(null);
      }, 1000);
    } catch (err: any) {
      setEditMessage({ type: "error", text: err.message });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleMergeVisit = async () => {
    if (!editingVisit || !mergeTargetId) return;
    const targetVisit = editingVisit.otherVisitsInCountry.find((v) => v.id === mergeTargetId);
    if (
      !confirm(
        `Pindahkan semua ${editingVisit.photoCount} foto dari "${editingVisit.title}" dan gabungkan ke "${targetVisit?.title || "kunjungan tujuan"}"?`
      )
    ) {
      return;
    }

    setIsMerging(true);
    setEditMessage(null);

    try {
      const res = await fetch("/api/admin/merge-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTripId: editingVisit.id,
          targetTripId: mergeTargetId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menggabungkan kunjungan.");
      }

      setEditMessage({ type: "success", text: data.message || "Berhasil digabungkan!" });
      fetchCountries();
      setTimeout(() => {
        setEditingVisit(null);
      }, 1200);
    } catch (err: any) {
      setEditMessage({ type: "error", text: err.message });
    } finally {
      setIsMerging(false);
    }
  };

  // Open Cover Photo Selector Modal
  const openCoverModal = async (tripId: string, title: string, currentCoverUrl?: string | null) => {
    setCoverModalTrip({ id: tripId, title, currentCoverUrl });
    setCoverPhotos([]);
    setLoadingCoverPhotos(true);
    setCoverSuccessMessage(null);

    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (res.ok) {
        const data = await res.json();
        const collected: any[] = [];
        if (data.trip?.chapters) {
          data.trip.chapters.forEach((ch: any) => {
            if (ch.photos) collected.push(...ch.photos);
          });
        }
        if (data.trip?.photos) {
          data.trip.photos.forEach((p: any) => {
            if (!collected.some((existing) => existing.id === p.id)) {
              collected.push(p);
            }
          });
        }
        setCoverPhotos(collected);
        setCoverModalTrip({
          id: tripId,
          title,
          currentCoverUrl: data.trip?.coverPhotoUrl || currentCoverUrl,
        });
      }
    } catch (e) {
      console.error("Failed to load photos for cover modal:", e);
    } finally {
      setLoadingCoverPhotos(false);
    }
  };

  // Set selected photo as cover
  const handleSelectCover = async (photoId: string) => {
    if (!coverModalTrip) return;
    setSettingCoverPhotoId(photoId);

    try {
      const res = await fetch(`/api/trips/${coverModalTrip.id}/photos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, action: "setCover" }),
      });

      if (res.ok) {
        const data = await res.json();
        setCoverModalTrip((prev) =>
          prev ? { ...prev, currentCoverUrl: data.coverPhotoUrl } : prev
        );
        setCoverSuccessMessage("Cover foto berhasil diubah!");
        fetchCountries();
        setTimeout(() => setCoverSuccessMessage(null), 3000);
      } else {
        alert("Gagal mengubah cover foto.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat mengubah cover foto.");
    } finally {
      setSettingCoverPhotoId(null);
    }
  };

  // Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12">
        <div className="w-full max-w-sm apple-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-accent-light-theme text-accent-theme flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-main">Catatan Kembara Admin</h1>
            <p className="text-xs text-muted-theme">
              Masukkan password untuk mengelola & sinkronisasi Google Drive
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password (default: roamlog)"
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-theme bg-surface text-main focus:outline-none focus:ring-2 focus:ring-accent-glow focus:border-accent-theme"
                  autoFocus
                />
                <Key className="w-4 h-4 text-muted-theme absolute left-3 top-3" />
              </div>
              {authError && (
                <p className="text-[11px] text-rose-500 font-medium px-1">
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-accent-theme text-white text-xs font-semibold hover:bg-accent-hover-theme transition apple-press shadow-sm"
            >
              Buka Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-main">
              Admin & Sync Google Drive
            </h1>
          </div>
          <p className="text-xs text-muted-theme">
            Cukup masukkan 1 link folder Google Drive per negara. Foto dengan jeda &gt;14 hari otomatis dipecah menjadi kunjungan terpisah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl border border-theme bg-surface-subtle hover:bg-surface text-xs font-medium text-main transition apple-press"
          >
            Lihat Timeline Publik
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl border border-theme bg-surface-subtle hover:bg-surface text-muted-theme hover:text-rose-500 transition apple-press"
            title="Keluar"
          >
            <Unlock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card 1: Ultra-Simple Sync Form */}
      <section className="apple-card p-6 sm:p-7 space-y-5 border border-theme">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-light-theme text-accent-theme flex items-center justify-center shrink-0 shadow-xs">
            <FolderSync className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-main">
              Sinkronisasi Folder Negara
            </h2>
            <p className="text-xs text-muted-theme">
              Tempel link folder Google Drive publik (misal: folder &quot;Jepang&quot; atau &quot;Czechia&quot;)
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSync();
          }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="url"
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/1rJF8QbozSa01eWFxEdK2rzQMeVWwtT5h?usp=drive_link"
              disabled={isSyncing}
              className="flex-1 px-4 py-3 text-xs rounded-xl border border-theme bg-surface text-main focus:outline-none focus:ring-2 focus:ring-accent-glow focus:border-accent-theme font-mono"
            />
            <button
              type="submit"
              disabled={isSyncing || !folderUrl.trim()}
              className="px-5 py-3 rounded-xl bg-accent-theme text-white text-xs font-semibold hover:bg-accent-hover-theme transition apple-press shadow-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sinkronisasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Sync Negara & Buat Album</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-theme px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Folder harus disetel &quot;Anyone with the link can view&quot;. Foto subfolder kota otomatis terdeteksi.</span>
          </div>
        </form>

        {/* Sync Error Banner */}
        {syncError && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold">Gagal Sinkronisasi</div>
              <div className="text-[11px] opacity-90 whitespace-pre-line">{syncError}</div>
            </div>
          </div>
        )}

        {/* Sync Success Summary Card */}
        {syncSummary && (
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="text-sm font-bold">
                Sinkronisasi Berhasil: {syncSummary.country}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-surface/70 border border-theme">
                <div className="text-[10px] text-muted-theme">Total Foto di Drive</div>
                <div className="font-bold text-main">{syncSummary.totalDrivePhotos} foto</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface/70 border border-theme">
                <div className="text-[10px] text-muted-theme">Foto Baru Diimpor</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{syncSummary.newPhotosCount} foto
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface/70 border border-theme">
                <div className="text-[10px] text-muted-theme">Duplikat Dilewati</div>
                <div className="font-bold text-main">{syncSummary.existingPhotosCount} foto</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface/70 border border-theme">
                <div className="text-[10px] text-muted-theme">Kunjungan Terdeteksi</div>
                <div className="font-bold text-accent-theme">
                  {syncSummary.visits?.length || 0} Kunjungan
                </div>
              </div>
            </div>

            {/* List of generated visits */}
            {syncSummary.visits && syncSummary.visits.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-muted-theme">
                  Hasil Pemecahan Kunjungan (Jeda &gt; 14 Hari):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {syncSummary.visits.map((v: any) => (
                    <div
                      key={v.tripId}
                      className="p-2.5 rounded-xl bg-surface/90 border border-theme text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-main truncate">{v.title}</div>
                        <div className="text-[10px] text-muted-theme">
                          {v.city} • {v.photoCount} foto
                        </div>
                      </div>
                      <Link
                        href={`/trips/${v.slug || v.tripId}`}
                        target="_blank"
                        className="px-2 py-1 rounded-lg bg-accent-light-theme text-accent-theme text-[10px] font-medium hover:underline shrink-0 flex items-center gap-1"
                      >
                        <span>Buka</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Card 2: List of Synced Countries & Re-sync Buttons */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-main flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent-theme" />
              <span>Folder Negara Tersimpan ({countries.length})</span>
            </h2>
            <p className="text-xs text-muted-theme">
              Tekan &quot;Re-sync&quot; untuk mendeteksi foto baru yang baru saja diunggah ke Google Drive
            </p>
          </div>
          <div className="flex items-center gap-2">
            {countries.length > 0 && (
              <button
                onClick={handleResetAll}
                className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-medium transition flex items-center gap-1.5"
                title="Hapus semua data album untuk uji coba dari awal"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kosongkan Data Uji Coba</span>
              </button>
            )}
            <button
              onClick={fetchCountries}
              className="p-1.5 rounded-lg border border-theme bg-surface-subtle hover:bg-surface text-muted-theme hover:text-main text-xs transition apple-press"
              title="Refresh list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loadingCountries ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl apple-card animate-pulse bg-surface-subtle" />
            ))}
          </div>
        ) : countries.length > 0 ? (
          <div className="space-y-4">
            {countries.map((c) => {
              const isReSyncingThis = syncingFolderId === c.driveFolderId;
              const primaryTripId = c.visits[0]?.id;

              return (
                <div
                  key={c.driveFolderId || c.country}
                  className="apple-card p-5 sm:p-6 space-y-4 border border-theme"
                >
                  {/* Country Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle-theme">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Cover Thumbnail with Click-to-Change */}
                      <div
                        onClick={() => {
                          if (primaryTripId) {
                            openCoverModal(primaryTripId, c.country, c.coverPhotoUrl);
                          }
                        }}
                        className="relative group/cover w-14 h-14 rounded-2xl overflow-hidden bg-surface-subtle shrink-0 border border-theme shadow-xs cursor-pointer"
                        title="Klik untuk mengubah cover foto negara ini"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            c.coverPhotoUrl ||
                            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=300&q=80"
                          }
                          alt={c.country}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                          Cover
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-main truncate">
                            {c.country}
                          </h3>
                          {primaryTripId && (
                            <button
                              onClick={() =>
                                openCoverModal(primaryTripId, c.country, c.coverPhotoUrl)
                              }
                              className="text-[10px] text-accent-theme hover:underline font-semibold"
                            >
                              Ubah Cover
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-theme mt-0.5">
                          <span className="font-semibold text-accent-theme">
                            {c.visits.length} Kunjungan
                          </span>
                          <span>•</span>
                          <span>{c.totalPhotos} Total Foto</span>
                          {c.driveFolderId && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-muted-theme/80 truncate max-w-[120px]">
                                ID: {c.driveFolderId}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Re-sync 1-Click Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      {c.driveFolderUrl && (
                        <button
                          onClick={() => handleSync(c.driveFolderUrl!, c.driveFolderId!)}
                          disabled={isReSyncingThis}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-theme text-white text-xs font-semibold hover:bg-accent-hover-theme transition apple-press shadow-xs disabled:opacity-50"
                          title="Periksa foto baru di folder Drive ini"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isReSyncingThis ? "animate-spin" : ""}`}
                          />
                          <span>{isReSyncingThis ? "Re-syncing..." : "Re-sync Drive"}</span>
                        </button>
                      )}

                      {c.driveFolderUrl && (
                        <a
                          href={c.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl border border-theme bg-surface-subtle hover:bg-surface text-muted-theme hover:text-main text-xs transition apple-press"
                          title="Buka Folder di Google Drive"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteCountry(c.country, c.driveFolderId)}
                        className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-500 text-xs transition apple-press"
                        title={`Hapus seluruh album negara ${c.country}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List of Visits under this Country */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-muted-theme flex items-center justify-between">
                      <span>Riwayat Kunjungan Waktu (Timeline Entri):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {c.visits.map((visit) => (
                        <div
                          key={visit.id}
                          className="p-3 rounded-xl border border-theme bg-surface-subtle hover:bg-surface transition flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-semibold text-xs text-main truncate">
                              {visit.title}
                            </div>
                            <div className="text-[10px] text-muted-theme flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-accent-theme" />
                                <span>{visit.dateLabel}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-400" />
                                <span className="truncate max-w-[100px]">{visit.city}</span>
                              </span>
                              <span>•</span>
                              <span>{visit.photoCount} foto</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditModal(visit, c.country, c.visits)}
                              className="px-2 py-1 rounded-lg text-muted-theme hover:text-accent-theme hover:bg-accent-light-theme text-[11px] font-medium flex items-center gap-1 transition"
                              title="Ubah Tanggal / Gabungkan Kunjungan Ini"
                            >
                              <Edit3 className="w-3 h-3 text-accent-theme" />
                              <span className="hidden sm:inline">Ubah</span>
                            </button>

                            <button
                              onClick={() => openCoverModal(visit.id, visit.title)}
                              className="px-2 py-1 rounded-lg text-muted-theme hover:text-accent-theme hover:bg-accent-light-theme text-[11px] font-medium flex items-center gap-1 transition"
                              title="Ubah Foto Cover Kunjungan Ini"
                            >
                              <ImageIcon className="w-3 h-3 text-accent-theme" />
                              <span className="hidden sm:inline">Cover</span>
                            </button>

                            <Link
                              href={`/trips/${visit.slug || visit.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-muted-theme hover:text-accent-theme hover:bg-surface transition"
                              title="Buka Album Publik"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleDeleteTrip(visit.id, visit.title)}
                              className="p-1.5 rounded-lg text-muted-theme hover:text-rose-500 hover:bg-rose-500/10 transition"
                              title="Hapus Kunjungan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="apple-card p-10 text-center space-y-3">
            <Globe className="w-8 h-8 text-muted-theme mx-auto opacity-50" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-main">Belum Ada Folder Negara</div>
              <p className="text-[11px] text-muted-theme max-w-sm mx-auto">
                Masukkan link Google Drive folder negara pertamamu di kolom di atas untuk mulai membuat album perjalanan.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Cover Photo Selector Modal */}
      {coverModalTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[85vh] apple-card flex flex-col overflow-hidden shadow-2xl border border-theme bg-surface">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-main flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Ubah Cover Foto: {coverModalTrip.title}</span>
                </h3>
                <p className="text-xs text-muted-theme">
                  Klik pada foto manapun untuk langsung menjadikannya gambar sampul (cover).
                </p>
              </div>

              <button
                onClick={() => setCoverModalTrip(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-theme bg-surface-subtle hover:bg-surface text-muted-theme hover:text-main transition apple-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success message banner */}
            {coverSuccessMessage && (
              <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{coverSuccessMessage}</span>
              </div>
            )}

            {/* Modal Body / Photos Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-[250px]">
              {loadingCoverPhotos ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-theme text-xs animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin text-accent-theme" />
                  <span>Memuat foto-foto...</span>
                </div>
              ) : coverPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {coverPhotos.map((photo) => {
                    const isCover =
                      photo.isCover ||
                      photo.imageUrl === coverModalTrip.currentCoverUrl;
                    const isSettingThis = settingCoverPhotoId === photo.id;

                    return (
                      <div
                        key={photo.id}
                        onClick={() => handleSelectCover(photo.id)}
                        className={`group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border-2 transition apple-press ${
                          isCover
                            ? "border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                            : "border-theme/70 hover:border-accent-theme"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbnailUrl || photo.imageUrl}
                          alt={photo.filename}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {isCover && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold flex items-center gap-1 shadow-md">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            <span>COVER AKTIF</span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center p-2 text-center text-white transition-opacity">
                          {isSettingThis ? (
                            <RefreshCw className="w-5 h-5 animate-spin text-white" />
                          ) : isCover ? (
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Cover Utama</span>
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-accent-theme text-white shadow-sm">
                              Jadikan Cover
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-muted-theme">
                  Tidak ada foto ditemukan pada album ini.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-theme bg-surface-subtle flex items-center justify-end">
              <button
                onClick={() => setCoverModalTrip(null)}
                className="px-4 py-2 rounded-xl bg-surface border border-theme text-xs font-semibold text-main hover:bg-surface-elevated transition apple-press"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit & Merge Visit Modal */}
      {editingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg apple-card flex flex-col overflow-hidden shadow-2xl border border-theme bg-surface">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-main flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-accent-theme" />
                  <span>Ubah Detail Kunjungan</span>
                </h3>
                <p className="text-xs text-muted-theme">
                  Sesuaikan label tanggal, judul album, atau gabungkan dengan kunjungan lain di {editingVisit.country}.
                </p>
              </div>

              <button
                onClick={() => setEditingVisit(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-theme bg-surface-subtle hover:bg-surface text-muted-theme hover:text-main transition apple-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alert Message */}
            {editMessage && (
              <div
                className={`px-5 py-2.5 border-b text-xs flex items-center gap-2 font-medium ${
                  editMessage.type === "success"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-200"
                }`}
              >
                {editMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{editMessage.text}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Form 1: Edit Date & Info */}
              <form onSubmit={handleSaveVisitEdit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-main flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent-theme" />
                    <span>Label Tanggal Kunjungan</span>
                  </label>
                  <input
                    type="text"
                    value={editDateInput}
                    onChange={(e) => setEditDateInput(e.target.value)}
                    placeholder="Contoh: 22 – 28 Maret 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-theme bg-surface-subtle focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-theme/30 text-xs text-main transition placeholder:text-muted-theme"
                  />
                  <p className="text-[11px] text-muted-theme">
                    Ubah teks tanggal yang tampil pada kartu beranda dan timeline perjalanan.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-main flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-accent-theme" />
                    <span>Judul Album</span>
                  </label>
                  <input
                    type="text"
                    value={editTitleInput}
                    onChange={(e) => setEditTitleInput(e.target.value)}
                    placeholder="Contoh: France — 22 – 28 Maret 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-theme bg-surface-subtle focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-theme/30 text-xs text-main transition placeholder:text-muted-theme"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-main flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Daftar Kota</span>
                  </label>
                  <input
                    type="text"
                    value={editCityInput}
                    onChange={(e) => setEditCityInput(e.target.value)}
                    placeholder="Contoh: Paris, Versailles"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-theme bg-surface-subtle focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-theme/30 text-xs text-main transition placeholder:text-muted-theme"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="apple-button-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingEdit ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Form 2: Merge Trip (if multiple visits exist for this country) */}
              {editingVisit.otherVisitsInCountry.length > 0 && (
                <div className="pt-5 border-t border-theme space-y-3.5">
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-accent-theme" />
                    <span className="text-xs font-bold text-main">
                      Gabungkan ke Kunjungan Lain
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-theme leading-relaxed">
                    Jika ada foto lama/baru yang terpisah ke album kunjungan baru karena foto tidak memiliki tanggal EXIF kamera, kamu bisa menggabungkan semua <strong>{editingVisit.photoCount} foto</strong> dari album ini ke salah satu kunjungan di bawah:
                  </p>

                  <div className="space-y-2.5">
                    <select
                      value={mergeTargetId}
                      onChange={(e) => setMergeTargetId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-theme bg-surface-subtle focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-theme/30 text-xs text-main transition"
                    >
                      {editingVisit.otherVisitsInCountry.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.title} ({target.photoCount} foto saat ini)
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleMergeVisit}
                      disabled={isMerging || !mergeTargetId}
                      className="w-full px-4 py-2.5 rounded-xl bg-accent-light-theme hover:bg-accent-theme hover:text-white text-accent-theme border border-accent-theme/20 text-xs font-semibold flex items-center justify-center gap-2 transition apple-press disabled:opacity-50"
                    >
                      {isMerging ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Memindahkan & Menggabungkan...</span>
                        </>
                      ) : (
                        <>
                          <GitMerge className="w-3.5 h-3.5" />
                          <span>Pindahkan Semua Foto & Gabungkan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-theme bg-surface-subtle flex items-center justify-end">
              <button
                type="button"
                onClick={() => setEditingVisit(null)}
                className="px-4 py-2 rounded-xl bg-surface border border-theme text-xs font-semibold text-main hover:bg-surface-elevated transition apple-press"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted-theme">
          Memuat halaman admin...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
