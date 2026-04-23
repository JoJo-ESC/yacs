import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { fetchSemesters } from "@/api";
import type { ApiSemesterResponse } from "@/api/types";

type SemesterCtx = {
  semesters: ApiSemesterResponse[];
  selectedSemester: string | undefined;
  setSelectedSemester: (term: string) => void;
  semestersLoading: boolean;
};

const SemesterContext = createContext<SemesterCtx | undefined>(undefined);

export function SemesterProvider({ children }: { children: React.ReactNode }) {
  const [semesters, setSemesters] = useState<ApiSemesterResponse[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string | undefined>(undefined);
  const [semestersLoading, setSemestersLoading] = useState(true);

  useEffect(() => {
    fetchSemesters()
      .then((data) => {
        setSemesters(data);
        if (data.length > 0) setSelectedSemester(data[0].term);
      })
      .catch(() => {})
      .finally(() => setSemestersLoading(false));
  }, []);

  const value = useMemo<SemesterCtx>(
    () => ({ semesters, selectedSemester, setSelectedSemester, semestersLoading }),
    [semesters, selectedSemester, semestersLoading]
  );

  return (
    <SemesterContext.Provider value={value}>
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  const ctx = useContext(SemesterContext);
  if (!ctx) throw new Error("useSemester must be used within a SemesterProvider");
  return ctx;
}
