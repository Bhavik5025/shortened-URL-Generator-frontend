"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Url() {
    const queryClient = useQueryClient();
  
    const [url_id, setUrlid] = useState(null);
  const [original_url, setOriginalUrl] = useState("");
  const [friendly_name, setFriendlyName] = useState("");
  const [created_at, setCreatedAt] = useState("");
const [shortendurl,setShortendurl]=useState("");
const [Secret_key,setSecret_key]=useState("");
  // Fetch success count
  const fetch_totalsuccess = async () => {
    const usertoken = Cookies.get("token");
    if (!usertoken) throw new Error("User not authenticated");

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_DB_API}/success_count`,
      { url_id },
      {
        headers: {
          Authorization: `Bearer ${usertoken}`,
        },
      }
    );
    return response.data.success || 0; // Ensure it's returning a default value if not found
  };

  // Fetch failure count
  const fetch_totalfailure = async () => {
    const usertoken = Cookies.get("token");
    if (!usertoken) throw new Error("User not authenticated");

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_DB_API}/failure_count`,
      { url_id },
      {
        headers: {
          Authorization: `Bearer ${usertoken}`,
        },
      }
    );
    return response.data.success || 0; // Ensure it's returning a default value if not found
  };

  // Load initial data from cookies
  useEffect(() => {
    setUrlid(Cookies.get("url_id") || null);
    setOriginalUrl(Cookies.get("url_original") || "N/A");
    setFriendlyName(Cookies.get("friendly_name") || "N/A");
    setShortendurl(Cookies.get("shortendurl") ||"N/A");
    setSecret_key(Cookies.get("secret_key")|| "N/A")
    setCreatedAt(
      Cookies.get("Creation_time")
        ? new Date(Cookies.get("Creation_time")).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })
        : "N/A"
    );
    queryClient.invalidateQueries(["Success_Count","Failure_Count"]);

  }, []);

  // Queries to fetch success and failure counts separately
  const { isLoading: isLoadingSuccess, isError: isErrorSuccess, data: success } = useQuery({
    queryKey: ["Success_Count", url_id],
    queryFn: fetch_totalsuccess,
    enabled: !!url_id, // Ensure query runs only when url_id is set
  });

  const { isLoading: isLoadingFailure, isError: isErrorFailure, data: failure } = useQuery({
    queryKey: ["Failure_Count", url_id],
    queryFn: fetch_totalfailure,
    enabled: !!url_id, // Ensure query runs only when url_id is set
  });

  useEffect(() => {
    if (isErrorSuccess || isErrorFailure) {
      console.log("Error fetching data:", isErrorSuccess ? isErrorSuccess : isErrorFailure);
    }
  }, [isErrorSuccess, isErrorFailure]);

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-center mb-5 text-2xl font-bold">URL Statistics</h1>

      <div className="mb-4">
        <h2>
          <b>Friendly Name:</b> {friendly_name}
        </h2>
      </div>
      <div className="mb-4">
        <h2>
          <b>Shortend URL:</b><Link href= {shortendurl}>{shortendurl}</Link>
        </h2>
      </div>
      {/* <div className="mb-4">
        <h2>
          <b>Original URL:</b>{" "}
          <a
            href={original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {original_url}
          </a>
        </h2>
      </div> */}
      <div className="mb-4">
        <h2>
          <b>Created At:</b> {created_at}
        </h2>
      </div>

      <div className="mb-4">
        <h2>
          <b>Total Successful Clicks:</b>{" "}
          {isLoadingSuccess ? "Loading..." : isErrorSuccess ? "Error fetching data" : success}
        </h2>
      </div>
     

      <div className="mb-4">
        <h2>
          <b>Total Failed Clicks:</b>{" "}
          {isLoadingFailure ? "Loading..." : isErrorFailure ? "Error fetching data" : failure}
        </h2>
      </div>

      <div className="mb-4">
        <h2>
          <b>Secret_key:</b>{" "}
          <input className="mr-2 w-1/5"  type="password" readOnly value={Secret_key}></input>
  <i
    className="cursor-pointer text-blue-500 hover:underline"
    onClick={() => {
      // Copy the secret_key to clipboard
      navigator.clipboard.writeText(Secret_key).then(() => {
        // Optionally, alert the user or show a confirmation
        alert("Secret Key copied to clipboard!");
      }).catch((error) => {
        console.error("Failed to copy text: ", error);
        alert("Failed to copy the secret key.");
      });
    }}
  >
    copy
  </i>
   
         </h2>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => window.history.back()}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
