"use client";

import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface RoleContextProps {
  role: string | null;
  setRole: (role: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  return (
    <RoleContext.Provider value={{ role, setRole, user, setUser }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};
