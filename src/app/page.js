"use client";

import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";

export default function Home() {
  const queryClient = useQueryClient();
  const [usertoken, setUserToken] = useState(null);
  const [original_url, setOriginalUrl] = useState("");
  const [friendly_name, setFriendlyName] = useState("");
  const router = useRouter();

  const [isKeyVisible, setIsKeyVisible] = useState(false);

  const handleToggleVisibility = () => {
    setIsKeyVisible((prevState) => !prevState);
  };

  const fetchUrls = async () => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_DB_API}/shortendurls`,
      {},
      {
        headers: {
          Authorization: `Bearer ${usertoken}`, // Pass token in headers
        },
      }
    );
    return response.data.message;
  };

  const {
    isLoading,
    error,
    data: Urls,
  } = useQuery({
    queryKey: ["Urls"],
    queryFn: fetchUrls,
  });
  useEffect(() => {
    const token = Cookies.get("token");
    setUserToken(token || null);
    
  }, []);

  const mutation = useMutation({
    mutationFn: async ({ original_url, friendly_name }) => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_DB_API}/createShortendUrl`,
          { original_url, friendly_name },
          {
            headers: {
              Authorization: `Bearer ${usertoken}`, // Pass token in headers
            },
          }
        );
        return response;
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return error.response;
        }
        throw error;
      }
    },
    onSuccess: (res) => {
      const { status, data } = res;
      if (status === 401) {
        Cookies.remove("token");
        alert("Session has expired. Please log in again.");
        router.push("/authentication");
      } else if (status === 201) {
        setOriginalUrl("");
        setFriendlyName("");
        queryClient.invalidateQueries(["Urls"]); //refresh the url data
        alert(data.message +"\nSecretKey: "+data.url.secret_key);
      } else {
        alert("Failed to save the URL.");
      }
    },
    onError: (error) => {
      alert(error.message);
    },
  });
  const urlcount = useMutation({
    mutationFn: async ({ url_id, url }) => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_DB_API}/Url_status`,
          { url_id, url },
          {
            headers: {
              Authorization: `Bearer ${usertoken}`, // Pass token in headers
            },
          }
        );
        return response;
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return error.response;
        }
        throw error;
      }
    },
  });

  const submit = (event) => {
    event.preventDefault();

    if (!usertoken) {
      router.push("/authentication");
    } else if (!original_url || !friendly_name) {
      alert("Both fields are required.");
    } else {
      mutation.mutate({ original_url, friendly_name });
    }
  };

  return (
    <div>
      <div className="w-full flex justify-center h-full">
        <div className="w-full lg:w-1/3 md:w-1/3 shadow-lg p-5 m-4">
          <h1 className="text-center text-2xl font-bold">Assignment</h1>
          {usertoken?<div className="w-full flex justify-end"><button className="p-2 bg-red-500 text-white rounded-lg" onClick={()=>{
            Cookies.remove("token");
            setUserToken(null);
          }}>Logout</button></div>:null}
          <form onSubmit={submit}>
            <input
              type="text"
              placeholder="Enter the Url"
              value={original_url}
              className="p-2 w-full my-2"
              onChange={(event) => setOriginalUrl(event.target.value)}
              required
            ></input>
            <input
              type="text"
              value={friendly_name}
              placeholder="Enter the Friendly Name"
              className="p-2 w-full my-2"
              onChange={(event) => setFriendlyName(event.target.value)}
              required
            ></input>
            <button
              type="submit"
              className="text-white p-4 bg-red-600 shadow-lg rounded-lg"
            >
              Convert
            </button>
          </form>
        </div>
      </div>
      <div className="w-full flex justify-center">
        <div className="w-full lg:w-1/3 md:w-1/3 justify-end flex">
          {!usertoken ? (
            <label
              className="px-3 text-red-600 font-bold underline"
              onClick={() => router.push("/authentication")}
            >
              login
            </label>
          ) : null}
        </div>
      </div>
      {usertoken?<div className="w-full  justify-center ">
        <h1 className="p-4 text-2xl font-bold">History</h1>
        <div className="overflow-x-auto p-3">
  {/* Table header */}
  <div className="w-full flex flex-wrap md:flex-nowrap mb-2 border-b border-gray-300 shadow-lg">
    <div className="w-1/5 font-bold text-xl p-2">Friendly Name</div>
    <div className="w-1/5 font-bold text-xl p-2">Shortened URL</div>
    <div className="w-1/5 font-bold text-xl p-2">Creation Time</div>
    <div className="w-1/5 font-bold text-xl p-2">Secret Key</div>
 
    <div className="w-1/5 font-bold text-xl p-2">View Statistics</div>
  </div>

  {/* Conditional rendering based on loading, error, or data */}
  {isLoading ? (
    <h1>Loading data...</h1>
  ) : error ? (
    <h1>Failed to load data</h1>
  ) : (
    Urls?.map((url) => (
      <div key={url._id} className="w-full flex flex-wrap md:flex-nowrap mb-2 border-b border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        {/* Friendly Name */}
        <div className="w-full md:w-1/5 p-2 border-r border-gray-300">{url.friendly_name}</div>

        {/* Shortened URL */}
        <Link
          href={url.shortened_url}
         
          className="w-full md:w-1/5 font-bold text-blue-600 underline p-2 border-r border-gray-300"
        >
          {url.shortened_url}
        </Link>

        {/* Creation Time */}
        <div className="w-full md:w-1/5 p-2 border-r border-gray-300">
          {new Date(url.createdAt).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })}
        </div>
        <div className="w-full md:w-1/5 p-2 border-r border-gray-300">
        <span className="mr-2">{url.secret_key}</span>
  <i
    className="cursor-pointer text-blue-500 hover:underline"
    onClick={() => {
      // Copy the secret_key to clipboard
      navigator.clipboard.writeText(url.secret_key).then(() => {
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
      </div>
        {/* View Button */}
        <div className="w-full md:w-1/5 p-2">
          <button
            className="bg-red-500 px-4 py-1 text-white rounded shadow-md hover:shadow-xl transition-shadow duration-300"
            onClick={() => {
              router.push("/Url");
              Cookies.set("url_id", url._id);
              Cookies.set("shortendurl", url.shortened_url);
              Cookies.set("url_original", url.original_url);
              Cookies.set("friendly_name", url.friendly_name);
              Cookies.set("Creation_time", url.createdAt);
              Cookies.set("secret_key",url.secret_key);
            }}
          >
            View
          </button>
        </div>
      </div>
    ))
  )}
</div>

      </div>:null
      }
      
    </div>
  );
}
