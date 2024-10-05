"use client";
import { useState, useEffect } from "react";

export default function AddUser() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submission

    try {
      setLoading(true);
      const response = await fetch("/api/addUser", {
        // Replace with your actual login endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }), // Send email as JSON
      });
      setLoading(false);

      if (!response.ok) {
        throw new Error("register failed");
      }

      const data = await response.json();

      // Assuming the response contains the user details
      const user = {
        email: data.user.email,
        id: data.user.id,
        role: data.user.role,
      };
    } catch (error) {
      setLoading(false);
      console.error("Error during register:", error);
      // Handle error (e.g., display error message)
    }
  };

  return (
    <>
      {/* {showLogin && ( */}
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-gray-500 p-5 mt-5"
      >
        <h2 className="font-bold text-2xl">Add New Student</h2>
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
          {loading ? "loading..." : "Add Student"}
        </button>
      </form>
      {/* )} */}
    </>
  );
}
