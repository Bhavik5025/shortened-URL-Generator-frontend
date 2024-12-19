"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const useAuthToken = () => {
  return Cookies.get("token");
};

const fetchUrls = async (url_id, token) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_DB_API}/Url_statistics/${url_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.urls;
};

const fetchCount = async (url_id,token) => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_DB_API}/totalcounts`,
    { url_id },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log(response.data)
  return response.data;
};

export default function Url() {
  const queryClient = useQueryClient();
  const [url_id, setUrlid] = useState(null);
  const [urlData, setUrlData] = useState({
    original_url: "N/A",
    friendly_name: "N/A",
    created_at: "N/A",
    shortendurl: "N/A",
    secret_key: "N/A",
  });
  const [usertoken, setUserToken] = useState(null);

  // Call useAuthToken hook at the top level, not inside useEffect
  const token = useAuthToken();
  useEffect(() => {
    setUserToken(token || null);
    setUrlid(Cookies.get("url_id") || null);

    setUrlData({
      original_url: Cookies.get("url_original") || "N/A",
      friendly_name: Cookies.get("friendly_name") || "N/A",
      shortendurl: Cookies.get("shortendurl") || "N/A",
      secret_key: Cookies.get("secret_key") || "N/A",
      created_at:
        Cookies.get("Creation_time") &&
        new Date(Cookies.get("Creation_time")).toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        }) || "N/A",
    });

    queryClient.invalidateQueries(["Success_Count", "Failure_Count"]);
  }, [token, queryClient]); // Add queryClient to dependency array

  const { isLoading, error, data: Urls } = useQuery({
    queryKey: ["Urls", url_id],
    queryFn: () => fetchUrls(url_id, usertoken),
    enabled: !!url_id && !!usertoken, // Ensure both values are truthy
  });
  
  const { data: count, isLoading: isLoadingSuccess } = useQuery({
    queryKey: ["Success_Count", url_id],
    queryFn: () => fetchCount(url_id, usertoken),
    enabled: !!url_id && !!usertoken, // Ensure both values are truthy
  });
  
  
  

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 4;

  const totalPages = Urls ? Math.ceil(Urls.length / rowsPerPage) : 0;
  const currentRows = Urls
    ? Urls.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg mb-3">
        <div className="flex w-full justify-center"><h1 className="w-1/2 text-start mb-5 text-2xl font-bold">URL Statistics</h1>
        <div className="flex  w-1/2 justify-end">
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
        </div>
        <div className="mb-4">
          <h2>
            <b>Device Information:</b> {urlData.friendly_name}
          </h2>
        </div>
        <div className="mb-4">
          <h2>
            <b>Shortened URL:</b>
            <Button
              variant="link"
              onClick={() => window.open(urlData.shortendurl, "_blank")}
            >
              {urlData.shortendurl}
            </Button>
          </h2>
        </div>
        <div className="mb-4">
          <h2>
            <b>Created At:</b> {urlData.created_at}
          </h2>
        </div>
        <div className="mb-4">
          <h2>
            <b>Total Successful Clicks:</b>{" "}
            {isLoadingSuccess ? "Loading..." : count?.Success}
          </h2>
        </div>
        <div className="mb-4">
          <h2>
            <b>Total Failed Clicks:</b>{" "}
            {isLoadingSuccess ? "Loading..." : count?.Failure}
          </h2>
        </div>
        {urlData.secret_key!="-"?<div className="mb-4">
          <h2>
            <b>Secret Key:</b>
            <input
             className="mr-2 w-20"
              type="password"
              readOnly
              value={urlData.secret_key}
            />
            <i
              className="cursor-pointer text-blue-500 hover:underline"
              onClick={() => {
                navigator.clipboard
                  .writeText(urlData.secret_key)
                  .then(() => alert("Secret Key copied to clipboard!"))
                  .catch((error) => alert("Failed to copy the secret key."));
              }}
            >
              copy
            </i>
          </h2>
        </div>:null}
        
      </div>

      <Table className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
        <TableCaption>URL Request Statistics</TableCaption>
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="py-3 px-4 text-center">Device</TableHead>
            <TableHead className="text-center py-3 px-4">IP Address</TableHead>
            <TableHead className="text-center py-3 px-4">First Request</TableHead>
            <TableHead className="text-center py-3 px-4">Last Request</TableHead>
            <TableHead className="text-center py-3 px-4">Total Requests</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-5">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-red-600 py-5">
               
                {error.status==404?"NO REQUEST FOUND":" Failed to load data. Please try again later."}
              </TableCell>
            </TableRow>
          ) : currentRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-5">
                No URLs available. Start by adding one!
              </TableCell>
            </TableRow>
          ) : (
            currentRows.map((url) => (
              <TableRow key={url.ipAddress} className="">
                <TableCell className="py-3 px-4 text-center">{url.firstDeviceName}</TableCell>
                <TableCell className="py-3 px-4 text-center">
                  {url.ipAddress}
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                {new Date(url.firstCreatedAt).toLocaleString("en-IN", {
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
                <TableCell className="py-3 px-4 text-center">
                  {new Date(url.lastCreatedAt).toLocaleString("en-IN", {
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
                <TableCell className="py-3 px-4 text-center">{url.count}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              Prev
            </PaginationLink>
          </PaginationItem>
          <PaginationEllipsis />
          <PaginationItem>
            <PaginationLink>{currentPage}</PaginationLink>
          </PaginationItem>
          <PaginationEllipsis />
          <PaginationItem>
            <PaginationLink onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}
