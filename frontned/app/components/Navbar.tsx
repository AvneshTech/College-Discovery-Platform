"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, getUser } from "../utils/auth";

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const user = getUser();
    if (user) setUserName(user.name);
  }, []);

  return (
    <nav className="bg-blue-600 text-white p-4 flex flex-wrap justify-between items-center gap-2">
      <Link href="/" className="text-2xl font-bold">
        🎓 College Discovery
      </Link>
      <div className="flex flex-wrap gap-2">
        <Link href="/compare" className="bg-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-800">
          Compare
        </Link>
        <Link href="/predictor" className="bg-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-800">
          Predictor
        </Link>
        <Link href="/discussions" className="bg-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-800">
          Q&amp;A
        </Link>
        {loggedIn ? (
          <>
            <Link href="/saved" className="bg-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-800">
              Saved
            </Link>
            <Link href="/profile" className="bg-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-800">
              {userName || "Profile"}
            </Link>
            <button
              onClick={logout}
              className="bg-red-500 px-3 py-2 rounded-lg text-sm hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="bg-white text-blue-600 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50">
              Login
            </Link>
            <Link href="/register" className="bg-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-800">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
