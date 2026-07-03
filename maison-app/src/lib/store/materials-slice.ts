import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";
import type { Material } from "./types";

export interface MaterialsSlice {
  materials: Material[];
  addMaterial: (m: Omit<Material, "id" | "createdAt">) => void;
  removeMaterial: (id: string) => void;
  restoreMaterial: (m: Material) => void;
  setMaterialImage: (id: string, imageUrl: string) => void;
  toggleMaterialCollectionLink: (materialId: string, collectionId: string) => void;
}

export const createMaterialsSlice: StateCreator<MaisonStore, [], [], MaterialsSlice> = (
  set
) => ({
  materials: [],
  addMaterial: (m) =>
    set((s) => ({
      materials: [{ ...m, id: `mat${Date.now()}`, createdAt: Date.now() }, ...s.materials],
    })),
  removeMaterial: (id) => set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })),
  restoreMaterial: (m) => set((s) => ({ materials: [m, ...s.materials] })),
  setMaterialImage: (id, imageUrl) =>
    set((s) => ({
      materials: s.materials.map((m) => (m.id === id ? { ...m, imageUrl } : m)),
    })),
  toggleMaterialCollectionLink: (materialId, collectionId) =>
    set((s) => ({
      materials: s.materials.map((m) => {
        if (m.id !== materialId) return m;
        const linked = m.linkedCollectionIds ?? [];
        return {
          ...m,
          linkedCollectionIds: linked.includes(collectionId)
            ? linked.filter((id) => id !== collectionId)
            : [...linked, collectionId],
        };
      }),
    })),
});
