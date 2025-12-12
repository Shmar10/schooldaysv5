import { create } from 'zustand';
import { SchoolYear } from '../api/client';

interface SchoolYearStore {
  currentSchoolYear: SchoolYear | null;
  setCurrentSchoolYear: (schoolYear: SchoolYear | null) => void;
}

export const useSchoolYearStore = create<SchoolYearStore>((set) => ({
  currentSchoolYear: null,
  setCurrentSchoolYear: (schoolYear) => set({ currentSchoolYear: schoolYear }),
}));

