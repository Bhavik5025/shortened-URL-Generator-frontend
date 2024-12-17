"use client";

import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        alert(data.message + "\nSecretKey: " + data.url.secret_key);
      } else {
        alert("Failed to save the URL.");
      }
    },
    onError: (error) => {
      alert(error.message);
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
          {usertoken ? (
            <div className="w-full flex justify-end">
              <Button
                onClick={() => {
                  Cookies.remove("token");
                  setUserToken(null);
                }}
              >
                Logout
              </Button>
            </div>
          ) : null}
          <form onSubmit={submit}>
            <Input
              type="text"
              placeholder="Enter the Url"
              value={original_url}
              className="my-2"
              onChange={(event) => setOriginalUrl(event.target.value)}
              required
            ></Input>
            <Input
              type="text"
              value={friendly_name}
              placeholder="Enter the Friendly Name"
              className="my-2"
              onChange={(event) => setFriendlyName(event.target.value)}
              required
            ></Input>

            <div className="w-full flex justify-center">
              <Button type="submit">Convert</Button>
            </div>
          </form>
        </div>
      </div>
      <div className="w-full flex justify-center">
        <div className="w-full lg:w-1/3 md:w-1/3 justify-end flex">
          {!usertoken ? (
            <Button   variant="link"  onClick={() => router.push("/authentication")}>
              login
            </Button>
          ) : null}
        </div>
      </div>
      {usertoken ? (
        <div className="w-full  justify-center ">
          <div className="overflow-x-auto p-3">
            {/* Table header */}
            <Table className="p-3">
            <TableCaption>A list of shortened URLs with their creation dates.</TableCaption>

      {/* Table Header */}
      <TableHeader>
        <TableRow>
          <TableHead>Friendly Name</TableHead>
          <TableHead>Shortened URL</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Secret Key</TableHead>
          <TableHead>View Statistics</TableHead>
        </TableRow>
      </TableHeader>

      {/* Conditional Rendering */}
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              Loading data...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-red-500">
              Failed to load data
            </TableCell>
          </TableRow>
        ) : (
          Urls?.map((url) => (
            <TableRow key={url._id} className="hover:bg-gray-100 transition-colors duration-200">
              {/* Friendly Name */}
              <TableCell>{url.friendly_name}</TableCell>

              {/* Shortened URL */}
              <TableCell>
              <Button
            variant="link"
            onClick={() => window.open(url.shortened_url, "_blank")}
          >
            {url.shortened_url}
            </Button>
              </TableCell>

              {/* Creation Time */}
              <TableCell>
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
              </TableCell>

              {/* Secret Key */}
              <TableCell>
                <span className="mr-2">{url.secret_key}</span>
                <span
                  className="cursor-pointer text-blue-500 hover:underline"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(url.secret_key)
                      .then(() => alert("Secret Key copied to clipboard!"))
                      .catch(() => alert("Failed to copy the secret key."));
                  }}
                >
                  Copy
                </span>
              </TableCell>

              {/* View Statistics Button */}
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push("/Url");
                    Cookies.set("url_id", url._id);
                    Cookies.set("shortendurl", url.shortened_url);
                    Cookies.set("url_original", url.original_url);
                    Cookies.set("friendly_name", url.friendly_name);
                    Cookies.set("Creation_time", url.createdAt);
                    Cookies.set("secret_key", url.secret_key);
                  }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>          </div>
        </div>
      ) : null}
    </div>
  );
}
