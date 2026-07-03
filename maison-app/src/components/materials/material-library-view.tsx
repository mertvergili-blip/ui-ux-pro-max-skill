"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { Tilt } from "@/components/unlumen-ui/tilt";
import { resizeImageFile } from "@/lib/image-resize";
import { useUndoStore } from "@/lib/undo-toast";

const SWATCH_PRESETS = [
  "#c4a469", // gold
  "#7a2e2e", // wine
  "#3d5a6c", // blue
  "#a8666a", // rose
  "#5c6b52", // sage
  "#e7c98f", // terracotta gold
  "#4a3f35", // umber
  "#c9bda2", // bone
];

function MaterialCard({
  id,
  name,
  supplier,
  costNote,
  sampleNote,
  colorTag,
  imageUrl,
  onRemove,
}: {
  id: string;
  name: string;
  supplier: string;
  costNote: string;
  sampleNote: string;
  colorTag: string;
  imageUrl?: string;
  onRemove: () => void;
}) {
  const setMaterialImage = useStore((s) => s.setMaterialImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImageFile(file);
      setMaterialImage(id, dataUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="group bento-tile bento-graphite relative"
    >
      <Tilt
        rotationFactor={5}
        springOptions={{ stiffness: 200, damping: 22 }}
        className="p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="group/swatch relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-white/10"
            style={imageUrl ? undefined : { background: colorTag }}
            aria-label={imageUrl ? "Fotoğrafı değiştir" : "Kumaş fotoğrafı ekle"}
            title={imageUrl ? "Fotoğrafı değiştir" : "Kumaş fotoğrafı ekle"}
          >
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-ink/60 text-[9px] uppercase tracking-[1px] text-bone opacity-0 transition-opacity group-hover/swatch:opacity-100">
              {uploading ? "…" : imageUrl ? "Değiştir" : "+ Foto"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={onRemove}
            className="text-[10px] uppercase tracking-[1.5px] text-muted opacity-60 transition-opacity duration-200 hover:text-rose lg:opacity-0 lg:group-hover:opacity-100"
          >
            Kaldır
          </button>
        </div>
        <p className="mb-1 font-heading text-[16px] text-bone">{name}</p>
        {supplier && <p className="mb-3 text-xs text-muted">{supplier}</p>}
        {costNote && (
          <p className="mb-1 text-[12px] leading-relaxed text-bone-dim">
            <span className="text-muted">Maliyet · </span>
            {costNote}
          </p>
        )}
        {sampleNote && (
          <p className="text-[12px] leading-relaxed text-bone-dim">
            <span className="text-muted">Numune · </span>
            {sampleNote}
          </p>
        )}
      </Tilt>
    </motion.div>
  );
}

function AddMaterialCard() {
  const addMaterial = useStore((s) => s.addMaterial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [costNote, setCostNote] = useState("");
  const [sampleNote, setSampleNote] = useState("");
  const [color, setColor] = useState(SWATCH_PRESETS[0]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setSupplier("");
    setCostNote("");
    setSampleNote("");
    setColor(SWATCH_PRESETS[0]);
    setImageUrl(undefined);
    setOpen(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      setImageUrl(await resizeImageFile(file));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    addMaterial({
      name: name.trim(),
      supplier: supplier.trim(),
      costNote: costNote.trim(),
      sampleNote: sampleNote.trim(),
      colorTag: color,
      imageUrl,
    });
    reset();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-line text-muted transition-colors hover:border-gold/40 hover:text-gold"
      >
        <span className="text-2xl font-light">+</span>
        <span className="text-[10.5px] uppercase tracking-[2px]">Kumaş Ekle</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-tile bento-gold"
    >
      <div className="relative flex flex-col gap-2.5 p-5">
        <div className="mb-1 flex items-center gap-3">
          <button
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-white/10"
            style={imageUrl ? undefined : { background: color }}
            aria-label="Kumaş fotoğrafı ekle"
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-[1px] text-ink/70">
                {uploading ? "…" : "+ Foto"}
              </span>
            )}
          </button>
          <div className="flex gap-1.5">
            {SWATCH_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full ring-2 transition-transform hover:scale-110 ${
                  color === c && !imageUrl ? "ring-bone" : "ring-transparent"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </div>
        {!imageUrl && (
          <button
            onClick={() => cameraRef.current?.click()}
            className="-mt-1 self-start text-[9.5px] uppercase tracking-[1.5px] text-muted transition-colors hover:text-gold"
          >
            veya fotoğraf çek
          </button>
        )}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kumaş adı"
          autoFocus
          className="border-b border-line bg-transparent pb-1.5 text-[14px] text-bone outline-none placeholder:text-muted focus:border-gold/50"
        />
        <input
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Tedarikçi"
          className="border-b border-line bg-transparent pb-1.5 text-[12.5px] text-bone-dim outline-none placeholder:text-muted focus:border-gold/50"
        />
        <input
          value={costNote}
          onChange={(e) => setCostNote(e.target.value)}
          placeholder="Maliyet notu (örn. metre 340₺)"
          className="border-b border-line bg-transparent pb-1.5 text-[12.5px] text-bone-dim outline-none placeholder:text-muted focus:border-gold/50"
        />
        <input
          value={sampleNote}
          onChange={(e) => setSampleNote(e.target.value)}
          placeholder="Numune notu"
          className="border-b border-line bg-transparent pb-1.5 text-[12.5px] text-bone-dim outline-none placeholder:text-muted focus:border-gold/50"
        />
        <div className="mt-2 flex gap-2 text-[10.5px] uppercase tracking-[1.5px]">
          <button
            onClick={handleSave}
            className="rounded-full bg-gold px-4 py-2 text-ink"
          >
            Kaydet
          </button>
          <button
            onClick={reset}
            className="rounded-full border border-white/10 px-4 py-2 text-muted hover:border-white/25"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const GHOST_EXAMPLES = [
  {
    name: "Yün Krep",
    supplier: "Bursa İpekçilik",
    costNote: "metre 340₺",
    sampleNote: "Numune istendi, yolda",
    colorTag: "#4a3f35",
  },
  {
    name: "Organze — Buz Mavisi",
    supplier: "Zeytinburnu Tekstil",
    costNote: "metre 210₺",
    sampleNote: "Drape testi yapıldı",
    colorTag: "#3d5a6c",
  },
] as const;

// Shown only while the archive is empty — sketches what a filled library
// will look like without pretending to be the user's data.
function GhostMaterialCard({
  name,
  supplier,
  costNote,
  sampleNote,
  colorTag,
}: (typeof GHOST_EXAMPLES)[number]) {
  return (
    <div className="relative rounded-[1.25rem] border border-dashed border-line/80 p-1.5 opacity-60">
      <span className="absolute right-4 top-4 text-[8.5px] uppercase tracking-[2px] text-muted">
        Örnek
      </span>
      <div className="rounded-[1rem] p-5">
        <div
          className="mb-4 h-10 w-10 rounded-full opacity-70 ring-1 ring-white/10"
          style={{ background: colorTag }}
        />
        <p className="mb-1 font-heading text-[16px] text-bone-dim">{name}</p>
        <p className="mb-3 text-xs text-muted">{supplier}</p>
        <p className="mb-1 text-[12px] leading-relaxed text-muted">
          Maliyet · {costNote}
        </p>
        <p className="text-[12px] leading-relaxed text-muted">
          Numune · {sampleNote}
        </p>
      </div>
    </div>
  );
}

export function MaterialLibraryView() {
  const materials = useStore((s) => s.materials);
  const removeMaterial = useStore((s) => s.removeMaterial);
  const restoreMaterial = useStore((s) => s.restoreMaterial);
  const showUndo = useUndoStore((s) => s.show);

  const handleRemove = (id: string) => {
    const material = materials.find((m) => m.id === id);
    removeMaterial(id);
    if (material) {
      showUndo(`"${material.name}" kaldırıldı`, () => restoreMaterial(material));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="lg:pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
        <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
        Material Library
      </p>
      <h1 className="mb-1.5 font-heading text-[28px] font-normal leading-[1.12] text-[#f7f2e6] lg:text-[34px]">
        Kumaş ve materyal arşivin.
      </h1>
      <p className="mb-7 max-w-[420px] text-[13.5px] leading-relaxed text-bone-dim">
        Kullandığın ve kullanmak istediğin kumaşların kişisel veritabanı —
        tedarikçi, maliyet, numune notları.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {materials.map((m) => (
            <MaterialCard
              key={m.id}
              {...m}
              onRemove={() => handleRemove(m.id)}
            />
          ))}
        </AnimatePresence>
        <AddMaterialCard />
        {materials.length === 0 &&
          GHOST_EXAMPLES.map((g) => <GhostMaterialCard key={g.name} {...g} />)}
      </div>
    </motion.div>
  );
}
