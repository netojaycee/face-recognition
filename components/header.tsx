"use client";
import React, { useEffect, useState } from "react";
import { clearUserSession, getUserSession } from "../app/hooks/session";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status
  const [session, setSession] = useState<any>(null); // State to store session data

  const logout = () => {
    clearUserSession();
    setIsLoggedIn(false); // Update login status
    setSession(null); // Clear session data
    console.log("User logged out successfully");
  };

  useEffect(() => {
    getUser(); // Check user session on component mount
  }, []);

  const getUser = () => {
    const userSession = getUserSession(); // Fetch user session
    if (userSession) {
      setIsLoggedIn(true); // Update login status
      setSession(userSession); // Store session data
    }
  };

  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="flex justify-between p-10 items-center bg-gray-400 rounded-md mt-4 w-[95%] mx-auto">
      <p className="font-bold text-green-600 text-lg">
        FACE RECOGNITION SYSTEM
      </p>
      {session ? ( // Render email only if session is available
        <h2 className="font-bold text-xl flex gap-2"><User />{session.email}</h2>
      ) : null}
      {!isHome ? (
        <Link href="/" className="bg-red-500 p-3 rounded-lg">
          Home
        </Link>
      ) : (
        <>
          {!isLoggedIn ? (
            <Link href="/" className="bg-red-500 p-3 rounded-lg">
              Login
            </Link>
          ) : (
            <button onClick={logout} className="bg-red-500 p-3 rounded-lg">
              Logout
            </button>
          )}
        </>
      )}
    </div>
  );
}
