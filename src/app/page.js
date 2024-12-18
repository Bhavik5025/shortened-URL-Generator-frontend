"use client";

import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [secretkeystatus, setSecretkeyStatus] = useState(true);
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

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 4;

  // Calculate the total pages
  const totalPages = Urls ? Math.ceil(Urls.length / rowsPerPage) : 0;
  const currentRows = Urls
    ? Urls.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const mutation = useMutation({
    mutationFn: async ({ original_url, friendly_name }) => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_DB_API}/createShortendUrl`,
          { original_url, friendly_name, secret_key_status: secretkeystatus },
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
        alert(
          data.message +
            (data.url.secret_key ? `\nSecretKey: ${data.url.secret_key}` : "")
        );
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
            <div className="flex px-2">
              <label className="py-3 pr-2">Generate Secret Key :</label>
              <RadioGroup defaultValue="yes" className="flex">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="yes"
                    id="r1"
                    onClick={() => setSecretkeyStatus(true)}
                  />
                  <label htmlFor="r1">Yes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="no"
                    id="r2"
                    onClick={() => setSecretkeyStatus(false)}
                  />
                  <label htmlFor="r2">No</label>
                </div>
              </RadioGroup>
            </div>

            <div className="w-full flex justify-center">
              <Button type="submit">Convert</Button>
            </div>
          </form>
        </div>
      </div>
      <div className="w-full flex justify-center">
        <div className="w-full lg:w-1/3 md:w-1/3 justify-end flex">
          {!usertoken ? (
            <Button onClick={() => router.push("/authentication")}>
              login
            </Button>
          ) : null}
        </div>
      </div>
      {usertoken ? (
        <div className="w-full  justify-center ">
          <div className="overflow-x-auto p-3">
            {/* Table header */}
            <Table className="min-w-full border rounded-lg">
              <TableCaption>
                A comprehensive list of shortened URLs with their metadata.
              </TableCaption>

              {/* Table Header */}
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-left py-3 px-4">
                    Friendly Name
                  </TableHead>
                  <TableHead className="text-left py-3 px-4">
                    Shortened URL
                  </TableHead>
                  <TableHead className="text-left py-3 px-4">
                    Created At
                  </TableHead>
                  <TableHead className="text-left py-3 px-4">
                    Secret Key
                  </TableHead>
                  <TableHead className="text-center py-3 px-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-5">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-red-600 py-5"
                    >
                      Failed to load data. Please try again later.
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
                    <TableRow
                      key={url._id}
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <TableCell className="py-3 px-4">
                        {url.friendly_name}
                      </TableCell>

                      {/* Shortened URL */}
                      <TableCell className="py-3 px-4">
                        <Button
                          variant="link"
                          onClick={() =>
                            window.open(url.shortened_url, "_blank")
                          }
                          className="text-blue-500 hover:underline"
                        >
                          {url.shortened_url}
                        </Button>
                      </TableCell>

                      {/* Creation Time */}
                      <TableCell className="py-3 px-4">
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
                      <TableCell className="py-3 px-4 flex items-center">
                        {url.secret_key ? (
                          <>
                            <span className="mr-2">{url.secret_key}</span>
                            <span
                              className="cursor-pointer text-blue-500 hover:underline"
                              onClick={() => {
                                navigator.clipboard
                                  .writeText(url.secret_key)
                                  .then(() =>
                                    alert("Secret Key copied to clipboard!")
                                  )
                                  .catch(() =>
                                    alert("Failed to copy the secret key.")
                                  );
                              }}
                            >
                              Copy
                            </span>
                          </>
                        ) : (
                          <label className="text-center w-full">-</label>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          className="mr-2"
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
            </Table>
            <Pagination>
              <PaginationContent>
                {/* First Page Button */}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </PaginationLink>
                </PaginationItem>

                {/* Previous Button */}
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;

                  // Always show first, last, current, and adjacent pages
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem
                        key={page}
                        className={currentPage === page ? "active" : ""}
                      >
                        <PaginationLink onClick={() => handlePageChange(page)}>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  // Ellipsis for skipped pages
                  if (
                    (page === currentPage - 2 || page === currentPage + 2) &&
                    totalPages > 5
                  ) {
                    return <PaginationEllipsis key={`ellipsis-${page}`} />;
                  }

                  return null;
                })}

                {/* Next Button */}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>

                {/* Last Page Button */}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      ) : null}
    </div>
  );
}
