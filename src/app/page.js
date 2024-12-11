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
        alert(data.message || "URL successfully shortened!");
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
      {usertoken?<div className="w-full  justify-center">
        <h1 className="p-4 text-2xl font-bold">History</h1>
        <div className="w-full flex">
          <div className="w-1/4 font-bold text-xl p-2">Friendly_Name</div>

          <div className="w-1/4 font-bold text-xl p-2">shortend url</div>
          <div className="w-1/4 font-bold text-xl p-2">Creation Time</div>
          <div className="w-1/4 font-bold text-xl p-2">View Statistics</div>
        </div>
        {isLoading ? (
          <h1>Loading data</h1>
        ) : error ? (
          <h1>Fail to Load Data</h1>
        ) : (
          Urls?.map((url) => (
            <div key={url._id} className="w-full flex">
              <div className="w-1/4 p-2">{url.friendly_name}</div>

              <Link
                href="#"
                onClick={async (event) => {
                  event.preventDefault(); // Prevent default navigation behavior
                  try {
                    await urlcount.mutateAsync({
                      url_id: url._id,
                      url: url.original_url,
                    });
                    window.open(url.original_url, "_blank"); // Open the link in a new tab
                  } catch (error) {
                    alert("Failed to update the URL status.");
                  }
                }}
                className="w-1/4 font-bold text-blue-600 underline"
              >
                {url.shortened_url}
              </Link>

              <div className="w-1/4 p-2">
                
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
              <div className="w-1/4 p-2">
                <button
                  className="bg-red-500 px-4 py-1 text-white"
                  onClick={() => {
                    router.push("/Url");
                    Cookies.set("url_id", url._id);
                    Cookies.set("shortendurl",url.shortened_url);
                    Cookies.set("url_original",url.original_url);
                    Cookies.set("friendly_name",url.friendly_name);
                    Cookies.set("Creation_time",url.createdAt)
                  }}
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>:null
      }
      
    </div>
  );
}
