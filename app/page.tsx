"use client";
import { useState, useEffect } from "react";
import {
  getUserSession,
  setUserSession,
} from "./hooks/session";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  // const [showLogin, setShowLogin] = useState(false);
  // const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // useEffect(() => {
  //   const session = getUserSession();
  //   setIsLoggedIn(!!session); // Check if session exists and update state
  // }, []);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submission

    try {
      setLoading(true);
      const response = await fetch("/api/login", {
        // Replace with your actual login endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }), // Send email as JSON
      });
      setLoading(false);

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      // Assuming the response contains the user details
      const user = {
        email: data.user.email,
        id: data.user.id,
        role: data.user.role,
      };

      // Set the user session in cookies
      setUserSession(user);
      // setShowLogin(false);
      // setIsLoggedIn(true); // Update login status

      // console.log("Login successful:", data);
      // console.log(data.user.role);

      if (data.user.role === "STUDENT") {
        router.push("/student");
      } else {
        router.push("/admin");
      }
      // Handle successful login (e.g., redirect or update state)
    } catch (error) {
      setLoading(false);
      console.error("Error during login:", error);
      // Handle error (e.g., display error message)
    }
  };
  const session = getUserSession();

// console.log(session)
  return (
    <>
      

      {/* {showLogin && ( */}
        <form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto bg-gray-500 p-5 mt-5"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-semibold text-xs">
              Email/Matric no
            </label>
            <input
              className="p-2 text-black"
              name="email"
              type="text"
              placeholder="enter email or matric number"
              value={email} // Correctly bind the value to state
              onChange={(e) => setEmail(e.target.value)} // Update state on change
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="p-3 rounded-md shadow-md mt-3 bg-blue-700 font-bold"
          >
            {loading ? "loading..." : "Login"}
          </button>
        </form>
       {/* )} */}
    </>
  );
}
