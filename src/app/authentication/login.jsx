import { useState } from "react";
import Cookies from "js-cookie";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async ({ name, password }) => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_DB_API}/Login`,
          { name, password }
        );
        return response;
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Return the 400 error response if exists
          return error.response;
        }
        if (error.response && error.response.status === 401) {
          // Handle 401 errors specifically, e.g., user not found
          return error.response; // Returning the 401 error response
        }
        throw error; // Re-throw for unexpected errors
      }
    },
    onSuccess: (res) => {
      const { status, data } = res; // Destructure status and data from the response
      if (status === 200) {
        alert(data.message); // Success message from response data
        Cookies.set("token", data.token, { expires: 1 }); // Set the token in cookies
        router.push("/"); // Navigate to the homepage
      } else if (status === 401) {
        // Handle user not found or invalid credentials
        alert(data.error || "Unauthorized. User not found.");
      }
    },
    onError: (error) => {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          // Check if it's a 401 error and display the message
          alert(data.error || "Unauthorized. User not found.");
        } else if (status === 400) {
          // For any 400 errors (bad request)
          alert(data.error || "Bad request.");
        } else {
          // Catch-all for other errors
          alert("An unexpected error occurred.");
        }
      } else {
        // Handle cases where there is no response (network error, etc.)
        alert("Network error. Please try again.");
      }
    },
  });

  const submit = (event) => {
    event.preventDefault();
    mutation.mutate({ name, password });
  };
  return (
    <form onSubmit={submit} className="p-3">
      <Input
        type="text"
        className="my-2 "
        placeholder="Enter Name"
        required
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        type="password"
        required
        className="my-2 "
        placeholder="Enter password"
        onChange={(e) => setPassword(e.target.value)}
      ></Input>
      <div className="w-full flex justify-center">
        <Button type="submit">Login</Button>
      </div>
    </form>
  );
}
