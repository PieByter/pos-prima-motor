"use client";

import { useEffect, useState } from "react";

type UserRole = {
    role: "admin" | "mekanik";
    name: string;
    id: string | null;
};

export function useUserRole() {
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/my-role", { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => setUserRole(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return { userRole, isAdmin: userRole?.role === "admin", isMekanik: userRole?.role === "mekanik", loading };
}
