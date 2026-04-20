import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "exec" | "course_rep";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  position: string | null;
  assignedLevel: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isCourseRep: boolean;
  hasFullAccess: boolean;
  canAccessExecutives: boolean;
  canAccessCourses: boolean;
  canAccessMaterials: boolean;
  canAccessEvents: boolean;
  canAccessNews: boolean;
  canAccessGallery: boolean;
  canAccessCalendar: boolean;
  canAccessSuggestions: boolean;
  canAccessSignups: boolean;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

// Position-based permissions mapping
const getPermissions = (position: string | null, isAdmin: boolean, isCourseRep: boolean) => {
  if (isAdmin) {
    return {
      hasFullAccess: true,
      canAccessExecutives: true,
      canAccessCourses: true,
      canAccessMaterials: true,
      canAccessEvents: true,
      canAccessNews: true,
      canAccessGallery: true,
      canAccessCalendar: true,
      canAccessSuggestions: true,
      canAccessSignups: true,
    };
  }

  const pos = position?.toLowerCase() || "";

  // Course Rep - can only access courses and materials for their level
  if (isCourseRep || pos.includes("course rep")) {
    return {
      hasFullAccess: false,
      canAccessExecutives: false,
      canAccessCourses: true,
      canAccessMaterials: true,
      canAccessEvents: false,
      canAccessNews: false,
      canAccessGallery: false,
      canAccessCalendar: false,
      canAccessSuggestions: false,
      canAccessSignups: false,
    };
  }

  // President, Vice President, General Secretary have full access
  if (
    pos.includes("president") ||
    pos.includes("general secretary")
  ) {
    return {
      hasFullAccess: true,
      canAccessExecutives: true,
      canAccessCourses: true,
      canAccessMaterials: true,
      canAccessEvents: true,
      canAccessNews: true,
      canAccessGallery: true,
      canAccessCalendar: true,
      canAccessSuggestions: true,
      canAccessSignups: true,
    };
  }

  // Director of Software - tech-related access
  if (pos.includes("software") || pos.includes("technology")) {
    return {
      hasFullAccess: false,
      canAccessExecutives: true,
      canAccessCourses: true,
      canAccessMaterials: true,
      canAccessEvents: false,
      canAccessNews: false,
      canAccessGallery: false,
      canAccessCalendar: false,
      canAccessSuggestions: true,
      canAccessSignups: false,
    };
  }

  // Director of Academics - academic content
  if (pos.includes("academic")) {
    return {
      hasFullAccess: false,
      canAccessExecutives: false,
      canAccessCourses: true,
      canAccessMaterials: true,
      canAccessEvents: false,
      canAccessNews: false,
      canAccessGallery: false,
      canAccessCalendar: true,
      canAccessSuggestions: false,
      canAccessSignups: false,
    };
  }

  // P.R.O / Director of Information - media and communications
  if (
    pos.includes("p.r.o") ||
    pos.includes("pro") ||
    pos.includes("information") ||
    pos.includes("publicity") ||
    pos.includes("media")
  ) {
    return {
      hasFullAccess: false,
      canAccessExecutives: true,
      canAccessCourses: false,
      canAccessMaterials: false,
      canAccessEvents: true,
      canAccessNews: true,
      canAccessGallery: true,
      canAccessCalendar: true,
      canAccessSuggestions: false,
      canAccessSignups: false,
    };
  }

  // Director of Socials - events and social activities
  if (pos.includes("social")) {
    return {
      hasFullAccess: false,
      canAccessExecutives: false,
      canAccessCourses: false,
      canAccessMaterials: false,
      canAccessEvents: true,
      canAccessNews: false,
      canAccessGallery: true,
      canAccessCalendar: true,
      canAccessSuggestions: false,
      canAccessSignups: false,
    };
  }

  // Director of Welfare - member-related
  if (pos.includes("welfare")) {
    return {
      hasFullAccess: false,
      canAccessExecutives: false,
      canAccessCourses: false,
      canAccessMaterials: false,
      canAccessEvents: false,
      canAccessNews: false,
      canAccessGallery: false,
      canAccessCalendar: false,
      canAccessSuggestions: true,
      canAccessSignups: true,
    };
  }

  // Financial Secretary - limited access
  if (pos.includes("financial")) {
    return {
      hasFullAccess: false,
      canAccessExecutives: false,
      canAccessCourses: false,
      canAccessMaterials: false,
      canAccessEvents: false,
      canAccessNews: false,
      canAccessGallery: false,
      canAccessCalendar: false,
      canAccessSuggestions: false,
      canAccessSignups: true,
    };
  }

  // Default for other exec positions - minimal access
  return {
    hasFullAccess: false,
    canAccessExecutives: false,
    canAccessCourses: false,
    canAccessMaterials: false,
    canAccessEvents: false,
    canAccessNews: false,
    canAccessGallery: false,
    canAccessCalendar: false,
    canAccessSuggestions: false,
    canAccessSignups: false,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [position, setPosition] = useState<string | null>(null);
  const [assignedLevel, setAssignedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  const fetchPosition = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("position, assigned_level").eq("user_id", uid).single();
    setPosition(data?.position ?? null);
    setAssignedLevel(data?.assigned_level ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => {
          fetchRoles(s.user.id);
          fetchPosition(s.user.id);
        }, 0);
      } else {
        setRoles([]);
        setPosition(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        Promise.all([fetchRoles(s.user.id), fetchPosition(s.user.id)]).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setPosition(null);
    setAssignedLevel(null);
  };

  const refreshRoles = async () => {
    if (user) {
      await fetchRoles(user.id);
      await fetchPosition(user.id);
    }
  };

  const isAdmin = roles.includes("admin");
  const isStaff = isAdmin || roles.includes("exec");
  const isCourseRep = roles.includes("course_rep");

  const permissions = getPermissions(position, isAdmin, isCourseRep);

  return (
    <Ctx.Provider
      value={{
        session,
        user,
        roles,
        position,
        assignedLevel,
        loading,
        signOut,
        refreshRoles,
        isAdmin,
        isStaff,
        isCourseRep,
        ...permissions,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};
