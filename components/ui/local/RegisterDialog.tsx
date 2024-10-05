"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserSession } from "@/app/hooks/session";
import { ExpressionDescriptors } from "@/app/student/page";

export function RegisterDialog({
  open,
  onOpenChange,
  faceData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faceData: ExpressionDescriptors; // Ensure this is the correct type based on your application
}) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    department: "",
    faculty: "",
    course: "",
    receipt: "",
    faceData: null, // Add a field for face data if necessary
  });

  // Fetch session data (including email) when the component mounts
  useEffect(() => {
    const loadSessionData = async () => {
      const session = await getUserSession();
      if (session && session.email) {
        setFormData((prev) => ({ ...prev, email: session.email }));
      }
    };
    loadSessionData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add faceData to the formData payload
    const payload = {
      ...formData,
      faceData: faceData, // Include faceData in the payload
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Send the updated payload
      });

      if (response.ok) {
        // const data = await response.json();
        console.log("Registration successful");
        // Handle success, reset form, close modal, etc.
      } else {
        const error = await response.json();
        console.log(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error registering:", error);
      console.log("Something went wrong. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>Register</DialogTitle>
          <DialogDescription>
            Fill out the form to complete your registration. The email field is
            auto-filled and cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Email (Disabled and Auto-filled) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                className="col-span-3"
                disabled
              />
            </div>
            {/* Full Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            {/* Department */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            {/* Faculty */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="faculty" className="text-right">
                Faculty
              </Label>
              <Input
                id="faculty"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            {/* Course */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course" className="text-right">
                Course
              </Label>
              <Input
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            {/* Receipt */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receipt" className="text-right">
                Receipt
              </Label>
              <Input
                id="receipt"
                name="receipt"
                value={formData.receipt}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Register</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
