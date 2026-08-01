import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, signInWithGoogle, signOutUser } from "../firebase";

export function useLibrarianAuth() {
  const [user, loading] = useAuthState(auth);
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!user) {
      setAccessChecked(false);
      setAccessDenied(false);
      return;
    }
    
    async function checkLibrarian() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        
        const [allowedRes, dneRes] = await Promise.all([
          fetch("/api/librarian/allowed-users", { headers }),
          fetch("/api/librarian/dne-list", { headers })
        ]);
        
        const allowedUsers = await allowedRes.json();
        const dneList = await dneRes.json();
        const email = user?.email || "";

        const inDne = dneList.some((dne: string) => email.toLowerCase().includes(dne.toLowerCase()));
        const isAllowed = !inDne && email && allowedUsers.includes(email);

        if (!isAllowed) {
          await signOutUser();
          setAccessDenied(true);
        } else {
          setAccessChecked(true);
        }
      } catch (e) {
        console.error("Librarian check failed", e);
      }
    }
    
    checkLibrarian();
  }, [user]);

  return { user, loading, accessChecked, accessDenied, signInWithGoogle, signOutUser };
}